/* eslint-disable no-console */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const data = require('./seedData');
const { maskPhone, generateTrackingCode } = require('../src/utils/helpers');

const prisma = new PrismaClient();

const STATUS_PATH = {
  MENUNGGU_VERIFIKASI: ['MENUNGGU_VERIFIKASI'],
  TERVERIFIKASI: ['MENUNGGU_VERIFIKASI', 'TERVERIFIKASI'],
  DIPROSES: ['MENUNGGU_VERIFIKASI', 'TERVERIFIKASI', 'DIPROSES'],
  SELESAI: ['MENUNGGU_VERIFIKASI', 'TERVERIFIKASI', 'DIPROSES', 'SELESAI'],
  DITOLAK: ['MENUNGGU_VERIFIKASI', 'DITOLAK'],
};

const HISTORY_NOTES = {
  MENUNGGU_VERIFIKASI: 'Aspirasi diterima sistem dan menunggu verifikasi petugas.',
  TERVERIFIKASI: 'Aspirasi telah diverifikasi dan dinyatakan valid.',
  DIPROSES: 'Aspirasi diteruskan ke instansi teknis terkait untuk ditindaklanjuti.',
  SELESAI: 'Tindak lanjut telah selesai dilaksanakan.',
  DITOLAK: 'Aspirasi tidak dapat ditindaklanjuti.',
};

async function seedConfigAndAdmin() {
  await prisma.siteConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  const password = await bcrypt.hash('Admin123!', 10);
  await prisma.admin.upsert({
    where: { email: 'admin@suaranusantara.id' },
    update: {},
    create: { name: 'Administrator Nasional', email: 'admin@suaranusantara.id', password, role: 'SUPER_ADMIN' },
  });
  console.log('[OK] SiteConfig (Dual-Logo default) & akun admin');
}

async function seedProvinces() {
  for (const [code, name, latitude, longitude] of data.provinces) {
    await prisma.province.upsert({
      where: { code },
      update: { name, latitude, longitude },
      create: { code, name, latitude, longitude },
    });
  }
  console.log(`[OK] ${data.provinces.length} provinsi`);
}

async function seedRegencies() {
  const provs = await prisma.province.findMany();
  const byCode = Object.fromEntries(provs.map((p) => [p.code, p]));
  let total = 0;
  for (const [provCode, list] of Object.entries(data.regencies)) {
    const prov = byCode[provCode];
    let idx = 1;
    for (const [name, type, latitude, longitude, officialCode] of list) {
      const code = officialCode || `S${provCode}${String(idx).padStart(2, '0')}`;
      idx += 1;
      // hindari duplikat jika sudah pernah disinkronkan (kode resmi berbeda)
      const existing = await prisma.regency.findFirst({ where: { provinceId: prov.id, name } });
      if (existing) {
        await prisma.regency.update({ where: { id: existing.id }, data: { latitude, longitude, type } });
      } else {
        await prisma.regency.create({ data: { code, name, type, latitude, longitude, provinceId: prov.id } });
      }
      total += 1;
    }
  }
  console.log(`[OK] ${total} kabupaten/kota awal (sisanya auto-sync)`);
}

async function seedDistrictsAndVillages() {
  let dCount = 0;
  let vCount = 0;
  for (const [regencyName, kecMap] of Object.entries(data.districts)) {
    const regency = await prisma.regency.findFirst({ where: { name: regencyName } });
    if (!regency) continue;
    let di = 1;
    for (const [kecName, villages] of Object.entries(kecMap)) {
      let district = await prisma.district.findFirst({ where: { regencyId: regency.id, name: kecName } });
      if (!district) {
        district = await prisma.district.create({
          data: { code: `S${regency.code.replace(/^S/, '')}-${String(di).padStart(2, '0')}`, name: kecName, regencyId: regency.id },
        });
      }
      di += 1;
      dCount += 1;
      let vi = 1;
      for (const vName of villages) {
        const exists = await prisma.village.findFirst({ where: { districtId: district.id, name: vName } });
        if (!exists) {
          await prisma.village.create({
            data: { code: `${district.code}-${String(vi).padStart(3, '0')}`, name: vName, districtId: district.id },
          });
        }
        vi += 1;
        vCount += 1;
      }
    }
  }
  console.log(`[OK] ${dCount} kecamatan & ${vCount} desa/kelurahan awal`);
}

async function seedCategories() {
  for (const [name, slug, description, color, icon, isCritical] of data.categories) {
    await prisma.category.upsert({
      where: { slug },
      update: { name, description, color, icon, isCritical },
      create: { name, slug, description, color, icon, isCritical },
    });
  }
  console.log(`[OK] ${data.categories.length} kategori aspirasi`);
}

async function seedAspirations() {
  const existing = await prisma.aspiration.count();
  if (existing > 0) {
    console.log(`[i] Aspirasi sudah ada (${existing}), seed dummy dilewati`);
    return;
  }
  const cats = Object.fromEntries((await prisma.category.findMany()).map((c) => [c.slug, c]));
  const provs = Object.fromEntries((await prisma.province.findMany()).map((p) => [p.code, p]));
  const usedCodes = new Set();

  for (const a of data.aspirations) {
    const province = provs[a.province];
    const regency = await prisma.regency.findFirst({ where: { provinceId: province.id, name: a.regency } });
    let district = null;
    let village = null;
    if (a.district) district = await prisma.district.findFirst({ where: { regencyId: regency.id, name: a.district } });
    if (a.village && district) village = await prisma.village.findFirst({ where: { districtId: district.id, name: a.village } });

    const createdAt = new Date(Date.now() - a.daysAgo * 86400000);
    let trackingCode;
    do trackingCode = generateTrackingCode(createdAt);
    while (usedCodes.has(trackingCode));
    usedCodes.add(trackingCode);

    const path = STATUS_PATH[a.status];
    const steps = path.length;
    const histories = path.map((st, i) => ({
      oldStatus: i === 0 ? null : path[i - 1],
      newStatus: st,
      note: i === steps - 1 && a.adminNote ? a.adminNote : HISTORY_NOTES[st],
      updatedBy: i === 0 ? 'Sistem' : 'Administrator',
      createdAt: new Date(createdAt.getTime() + i * Math.floor((a.daysAgo * 86400000) / steps)),
    }));

    await prisma.aspiration.create({
      data: {
        trackingCode,
        senderName: a.sender,
        phone: a.phone,
        maskedPhone: maskPhone(a.phone),
        title: a.title,
        content: a.content,
        categoryId: cats[a.category].id,
        provinceId: province.id,
        regencyId: regency.id,
        districtId: district ? district.id : null,
        villageId: village ? village.id : null,
        districtName: district ? district.name : a.district || null,
        villageName: village ? village.name : a.village || null,
        addressDetail: a.address || null,
        latitude: a.lat,
        longitude: a.lng,
        status: a.status,
        adminNote: a.adminNote || null,
        upvotesCount: a.upvotes,
        createdAt,
        histories: { create: histories },
      },
    });
  }
  console.log(`[OK] ${data.aspirations.length} aspirasi dummy tersebar se-Indonesia`);
}

async function main() {
  console.log('\nSeeding database SuaraNusantara GIS Nasional...\n');
  await seedConfigAndAdmin();
  await seedProvinces();
  await seedRegencies();
  await seedDistrictsAndVillages();
  await seedCategories();
  await seedAspirations();
  console.log('\nSeed selesai. Login admin: admin@suaranusantara.id / Admin123!\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
