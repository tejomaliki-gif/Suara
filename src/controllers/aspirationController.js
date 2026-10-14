const { z } = require('zod');
const prisma = require('../lib/prisma');
const { verifyCaptcha } = require('./captchaController');
const { publicPath, removeLocalUpload } = require('../middleware/uploadMiddleware');
const { normalizeIndonesianPhone, maskPhone, generateTrackingCode, haversineKm, STATUSES } = require('../utils/helpers');

// ---------- Serialisasi aman (nomor asli TIDAK PERNAH dikirim ke publik) ----------
const publicInclude = {
  category: { select: { id: true, name: true, slug: true, color: true, icon: true, isCritical: true } },
  province: { select: { id: true, name: true, code: true } },
  regency: { select: { id: true, name: true, type: true } },
  district: { select: { id: true, name: true } },
  village: { select: { id: true, name: true } },
};

function toPublic(a, extra = {}) {
  if (!a) return a;
  // eslint-disable-next-line no-unused-vars
  const { phone, ...rest } = a;
  return { ...rest, maskedPhone: a.maskedPhone || maskPhone(phone), ...extra };
}

// ---------- WhatsApp ----------
// POST /api/whatsapp/verify
function verifyWhatsapp(req, res) {
  const r = normalizeIndonesianPhone(req.body && req.body.phone);
  if (!r.valid) return res.status(400).json({ valid: false, message: r.message });
  return res.json({
    valid: true,
    maskedPhone: maskPhone(r.local),
    message: 'Format nomor WhatsApp valid. Nomor Anda akan disamarkan di halaman publik.',
  });
}

// ---------- Query builder ----------
const SORTS = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  most_supported: { upvotesCount: 'desc' },
  updated: { updatedAt: 'desc' },
};

function buildWhere(q) {
  const where = {};
  const int = (v) => (v !== undefined && v !== '' && Number.isInteger(Number(v)) ? Number(v) : undefined);
  if (int(q.provinceId)) where.provinceId = int(q.provinceId);
  if (int(q.regencyId)) where.regencyId = int(q.regencyId);
  if (int(q.categoryId)) where.categoryId = int(q.categoryId);
  if (q.status) {
    const list = String(q.status).split(',').filter((s) => STATUSES.includes(s));
    if (list.length) where.status = { in: list };
  }
  if (q.keyword && String(q.keyword).trim()) {
    const kw = String(q.keyword).trim();
    where.OR = [{ title: { contains: kw } }, { content: { contains: kw } }, { trackingCode: { contains: kw.toUpperCase() } }, { addressDetail: { contains: kw } }];
  }
  return where;
}

// GET /api/aspirations
// filter: keyword, provinceId, regencyId, categoryId, status, sort, page, limit
// deteksi serupa: lat, lng, radiusKm (opsional) -> hasil disertai distanceKm
async function listAspirations(req, res) {
  const q = req.query;
  const where = buildWhere(q);
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(q.limit, 10) || 12));
  const orderBy = SORTS[q.sort] || SORTS.newest;

  const lat = parseFloat(q.lat);
  const lng = parseFloat(q.lng);
  const radiusKm = Math.min(50, parseFloat(q.radiusKm) || 0);

  if (Number.isFinite(lat) && Number.isFinite(lng) && radiusKm > 0) {
    // bounding box kasar lalu haversine presisi
    const dLat = radiusKm / 111;
    const dLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180) || 1);
    where.latitude = { gte: lat - dLat, lte: lat + dLat };
    where.longitude = { gte: lng - dLng, lte: lng + dLng };
    const rows = await prisma.aspiration.findMany({ where, include: publicInclude, orderBy });
    const near = rows
      .map((a) => toPublic(a, { distanceKm: Math.round(haversineKm(lat, lng, a.latitude, a.longitude) * 100) / 100 }))
      .filter((a) => a.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
    const data = near.slice((page - 1) * limit, page * limit);
    return res.json({ data, meta: { page, limit, total: near.length, totalPages: Math.max(1, Math.ceil(near.length / limit)) } });
  }

  const [total, rows] = await Promise.all([
    prisma.aspiration.count({ where }),
    prisma.aspiration.findMany({ where, include: publicInclude, orderBy, skip: (page - 1) * limit, take: limit }),
  ]);
  return res.json({
    data: rows.map((a) => toPublic(a)),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
}

// GET /api/aspirations/map-points (payload ringan untuk ribuan marker)
async function mapPoints(req, res) {
  const where = buildWhere(req.query);
  const rows = await prisma.aspiration.findMany({
    where,
    select: {
      id: true,
      trackingCode: true,
      title: true,
      latitude: true,
      longitude: true,
      status: true,
      upvotesCount: true,
      createdAt: true,
      categoryId: true,
      provinceId: true,
      category: { select: { name: true, color: true, icon: true } },
      regency: { select: { name: true } },
      province: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10000,
  });
  return res.json(
    rows.map((r) => ({
      id: r.id,
      code: r.trackingCode,
      title: r.title,
      lat: r.latitude,
      lng: r.longitude,
      status: r.status,
      upvotes: r.upvotesCount,
      createdAt: r.createdAt,
      categoryId: r.categoryId,
      provinceId: r.provinceId,
      categoryName: r.category.name,
      color: r.category.color,
      icon: r.category.icon,
      regionName: `${r.regency.name}, ${r.province.name}`,
    }))
  );
}

const detailInclude = { ...publicInclude, histories: { orderBy: { createdAt: 'asc' } } };

// GET /api/aspirations/track/:trackingCode
async function trackByCode(req, res) {
  const code = String(req.params.trackingCode || '').trim().toUpperCase();
  const a = await prisma.aspiration.findUnique({ where: { trackingCode: code }, include: detailInclude });
  if (!a) return res.status(404).json({ message: `Tiket ${code} tidak ditemukan. Periksa kembali kode tiket Anda.` });
  return res.json(toPublic(a));
}

// GET /api/aspirations/:id
async function getAspiration(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'ID tidak valid.' });
  const a = await prisma.aspiration.findUnique({ where: { id }, include: detailInclude });
  if (!a) return res.status(404).json({ message: 'Aspirasi tidak ditemukan.' });
  return res.json(toPublic(a));
}

// ---------- Buat aspirasi ----------
const optInt = z.preprocess((v) => (v === '' || v === undefined || v === null || v === 'null' ? undefined : Number(v)), z.number().int().positive().optional());
const optStr = (max) => z.preprocess((v) => (v === '' || v === null ? undefined : v), z.string().trim().max(max).optional());

const createSchema = z.object({
  senderName: optStr(80),
  phone: z.string({ required_error: 'Nomor WhatsApp wajib diisi.' }),
  title: z.string().trim().min(8, 'Judul aspirasi minimal 8 karakter.').max(150, 'Judul maksimal 150 karakter.'),
  content: z.string().trim().min(20, 'Isi aspirasi minimal 20 karakter.').max(3000, 'Isi aspirasi maksimal 3000 karakter.'),
  categoryId: z.coerce.number({ invalid_type_error: 'Kategori wajib dipilih.' }).int().positive('Kategori wajib dipilih.'),
  provinceId: z.coerce.number({ invalid_type_error: 'Provinsi wajib dipilih.' }).int().positive('Provinsi wajib dipilih.'),
  regencyId: z.coerce.number({ invalid_type_error: 'Kabupaten/Kota wajib dipilih.' }).int().positive('Kabupaten/Kota wajib dipilih.'),
  districtId: optInt,
  villageId: optInt,
  districtName: optStr(100),
  villageName: optStr(100),
  addressDetail: optStr(300),
  latitude: z.coerce.number({ invalid_type_error: 'Titik lokasi wajib dipilih di peta.' }).min(-11.5, 'Titik lokasi harus berada di wilayah Indonesia.').max(6.5, 'Titik lokasi harus berada di wilayah Indonesia.'),
  longitude: z.coerce.number({ invalid_type_error: 'Titik lokasi wajib dipilih di peta.' }).min(94.5, 'Titik lokasi harus berada di wilayah Indonesia.').max(141.5, 'Titik lokasi harus berada di wilayah Indonesia.'),
  captchaId: z.string({ required_error: 'CAPTCHA wajib diisi.' }).min(1, 'CAPTCHA wajib diisi.'),
  captchaAnswer: z.union([z.string(), z.number()]).refine((v) => String(v).trim() !== '', 'Jawaban CAPTCHA wajib diisi.'),
});

async function uniqueTrackingCode() {
  for (let i = 0; i < 20; i += 1) {
    const code = generateTrackingCode();
    // eslint-disable-next-line no-await-in-loop
    const exists = await prisma.aspiration.findUnique({ where: { trackingCode: code }, select: { id: true } });
    if (!exists) return code;
  }
  return `${generateTrackingCode()}${Math.floor(Math.random() * 10)}`;
}

// POST /api/aspirations (multipart/form-data, file: evidence)
async function createAspiration(req, res) {
  const cleanup = () => req.file && removeLocalUpload(publicPath('evidence', req.file.filename));
  const parsed = createSchema.safeParse(req.body || {});
  if (!parsed.success) {
    cleanup();
    return res.status(400).json({ message: parsed.error.issues[0].message, issues: parsed.error.issues });
  }
  const d = parsed.data;

  if (!verifyCaptcha(d.captchaId, d.captchaAnswer)) {
    cleanup();
    return res.status(400).json({ message: 'Jawaban CAPTCHA salah atau sudah kedaluwarsa. Silakan muat soal baru.', code: 'CAPTCHA_INVALID' });
  }

  const phone = normalizeIndonesianPhone(d.phone);
  if (!phone.valid) {
    cleanup();
    return res.status(400).json({ message: phone.message });
  }

  const [category, regency] = await Promise.all([
    prisma.category.findUnique({ where: { id: d.categoryId } }),
    prisma.regency.findUnique({ where: { id: d.regencyId } }),
  ]);
  if (!category) {
    cleanup();
    return res.status(400).json({ message: 'Kategori tidak valid.' });
  }
  if (!regency || regency.provinceId !== d.provinceId) {
    cleanup();
    return res.status(400).json({ message: 'Kabupaten/Kota tidak sesuai dengan provinsi yang dipilih.' });
  }

  let district = null;
  let village = null;
  if (d.districtId) {
    district = await prisma.district.findUnique({ where: { id: d.districtId } });
    if (!district || district.regencyId !== regency.id) district = null;
  }
  if (d.villageId && district) {
    village = await prisma.village.findUnique({ where: { id: d.villageId } });
    if (!village || village.districtId !== district.id) village = null;
  }

  const trackingCode = await uniqueTrackingCode();
  const created = await prisma.aspiration.create({
    data: {
      trackingCode,
      senderName: d.senderName || 'Warga Masyarakat',
      phone: phone.local,
      maskedPhone: maskPhone(phone.local),
      phoneVerified: true,
      title: d.title,
      content: d.content,
      categoryId: category.id,
      provinceId: d.provinceId,
      regencyId: regency.id,
      districtId: district ? district.id : null,
      villageId: village ? village.id : null,
      districtName: district ? district.name : d.districtName || null,
      villageName: village ? village.name : d.villageName || null,
      addressDetail: d.addressDetail || null,
      latitude: d.latitude,
      longitude: d.longitude,
      evidenceImage: req.file ? publicPath('evidence', req.file.filename) : null,
      histories: {
        create: { oldStatus: null, newStatus: 'MENUNGGU_VERIFIKASI', note: 'Aspirasi diterima sistem dan menunggu verifikasi petugas.', updatedBy: 'Sistem' },
      },
    },
    include: detailInclude,
  });

  return res.status(201).json({
    message: 'Aspirasi berhasil dikirim. Simpan kode tiket Anda untuk melacak progres.',
    trackingCode,
    aspiration: toPublic(created),
  });
}

// ---------- Dukungan publik (+1 Saya Juga Terdampak) ----------
const upvoteLog = new Map(); // `${ip}:${id}` -> timestamp
const UPVOTE_WINDOW_MS = 24 * 60 * 60 * 1000;

// POST /api/aspirations/:id/upvote
async function upvote(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'ID tidak valid.' });
  const key = `${req.ip}:${id}`;
  const last = upvoteLog.get(key);
  if (last && Date.now() - last < UPVOTE_WINDOW_MS) {
    return res.status(409).json({ message: 'Anda sudah memberikan dukungan untuk aspirasi ini.' });
  }
  const exists = await prisma.aspiration.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return res.status(404).json({ message: 'Aspirasi tidak ditemukan.' });

  const updated = await prisma.aspiration.update({
    where: { id },
    data: { upvotesCount: { increment: 1 } },
    select: { id: true, upvotesCount: true },
  });
  upvoteLog.set(key, Date.now());
  if (upvoteLog.size > 50000) upvoteLog.clear();
  return res.json({ message: 'Terima kasih! Dukungan Anda telah tercatat.', ...updated });
}

// ---------- ADMIN ----------
// GET /api/admin/aspirations (nomor WA asli hanya terlihat oleh admin)
async function adminList(req, res) {
  const q = req.query;
  const where = buildWhere(q);
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 20));
  const orderBy = SORTS[q.sort] || SORTS.newest;
  const [total, rows] = await Promise.all([
    prisma.aspiration.count({ where }),
    prisma.aspiration.findMany({ where, include: detailInclude, orderBy, skip: (page - 1) * limit, take: limit }),
  ]);
  return res.json({ data: rows, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
}

const statusSchema = z.object({
  status: z.enum(STATUSES, { errorMap: () => ({ message: 'Status tidak valid.' }) }),
  note: z.preprocess((v) => (v === '' || v === null ? undefined : v), z.string().trim().max(1000).optional()),
});

// PATCH /api/admin/aspirations/:id/status (multipart opsional: resolutionImage)
async function updateStatus(req, res) {
  const id = Number(req.params.id);
  const cleanup = () => req.file && removeLocalUpload(publicPath('evidence', req.file.filename));
  const parsed = statusSchema.safeParse(req.body || {});
  if (!Number.isInteger(id) || !parsed.success) {
    cleanup();
    return res.status(400).json({ message: parsed.success ? 'ID tidak valid.' : parsed.error.issues[0].message });
  }
  const current = await prisma.aspiration.findUnique({ where: { id } });
  if (!current) {
    cleanup();
    return res.status(404).json({ message: 'Aspirasi tidak ditemukan.' });
  }
  const { status, note } = parsed.data;
  const data = { status };
  if (note) data.adminNote = note;
  if (req.file) {
    removeLocalUpload(current.resolutionImage);
    data.resolutionImage = publicPath('evidence', req.file.filename);
  }

  const [updated] = await prisma.$transaction([
    prisma.aspiration.update({ where: { id }, data, include: detailInclude }),
    prisma.aspirationStatusHistory.create({
      data: {
        aspirationId: id,
        oldStatus: current.status,
        newStatus: status,
        note: note || (req.file ? 'Foto bukti penyelesaian diunggah.' : null),
        updatedBy: (req.admin && req.admin.name) || 'Administrator',
      },
    }),
  ]);
  const fresh = await prisma.aspiration.findUnique({ where: { id }, include: detailInclude });
  return res.json({ message: 'Status aspirasi berhasil diperbarui.', aspiration: fresh || updated });
}

// DELETE /api/admin/aspirations/:id
async function deleteAspiration(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'ID tidak valid.' });
  const current = await prisma.aspiration.findUnique({ where: { id } });
  if (!current) return res.status(404).json({ message: 'Aspirasi tidak ditemukan.' });
  await prisma.aspiration.delete({ where: { id } });
  removeLocalUpload(current.evidenceImage);
  removeLocalUpload(current.resolutionImage);
  return res.json({ message: `Aspirasi ${current.trackingCode} telah dihapus.` });
}

module.exports = {
  verifyWhatsapp,
  listAspirations,
  mapPoints,
  trackByCode,
  getAspiration,
  createAspiration,
  upvote,
  adminList,
  updateStatus,
  deleteAspiration,
};
