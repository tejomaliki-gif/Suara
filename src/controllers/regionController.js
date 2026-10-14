const prisma = require('../lib/prisma');
const { ensureRegencies, ensureDistricts, ensureVillages, safeSync } = require('../services/regionSyncService');

const byName = (a, b) => a.name.localeCompare(b.name, 'id');

function applySearch(list, search) {
  const q = String(search || '').trim().toLowerCase();
  if (!q) return list;
  return list.filter((x) => x.name.toLowerCase().includes(q));
}

function requireInt(value, label, res) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    res.status(400).json({ message: `Parameter ${label} wajib diisi dengan angka yang valid.` });
    return null;
  }
  return n;
}

// GET /api/regions/provinces?search=
async function getProvinces(req, res) {
  const list = await prisma.province.findMany({ select: { id: true, code: true, name: true, latitude: true, longitude: true } });
  return res.json(applySearch(list, req.query.search).sort(byName));
}

// GET /api/regions/regencies?provinceId=&search=
async function getRegencies(req, res) {
  const provinceId = requireInt(req.query.provinceId, 'provinceId', res);
  if (!provinceId) return undefined;
  const province = await prisma.province.findUnique({ where: { id: provinceId } });
  if (!province) return res.status(404).json({ message: 'Provinsi tidak ditemukan.' });

  const sync = await safeSync(ensureRegencies, province);
  const list = await prisma.regency.findMany({
    where: { provinceId },
    select: { id: true, code: true, name: true, type: true, latitude: true, longitude: true, provinceId: true },
  });
  res.set('X-Region-Sync', sync.reason || (sync.synced ? 'synced' : 'local'));
  return res.json(applySearch(list, req.query.search).sort(byName));
}

// GET /api/regions/districts?regencyId=&search=
async function getDistricts(req, res) {
  const regencyId = requireInt(req.query.regencyId, 'regencyId', res);
  if (!regencyId) return undefined;
  const regency = await prisma.regency.findUnique({ where: { id: regencyId }, include: { province: true } });
  if (!regency) return res.status(404).json({ message: 'Kabupaten/Kota tidak ditemukan.' });

  const sync = await safeSync(ensureDistricts, regency);
  const list = await prisma.district.findMany({ where: { regencyId }, select: { id: true, code: true, name: true, regencyId: true } });
  res.set('X-Region-Sync', sync.reason || (sync.synced ? 'synced' : 'local'));
  return res.json(applySearch(list, req.query.search).sort(byName));
}

// GET /api/regions/villages?districtId=&search=
async function getVillages(req, res) {
  const districtId = requireInt(req.query.districtId, 'districtId', res);
  if (!districtId) return undefined;
  const district = await prisma.district.findUnique({ where: { id: districtId } });
  if (!district) return res.status(404).json({ message: 'Kecamatan tidak ditemukan.' });

  const sync = await safeSync(ensureVillages, district);
  const list = await prisma.village.findMany({ where: { districtId }, select: { id: true, code: true, name: true, districtId: true } });
  res.set('X-Region-Sync', sync.reason || (sync.synced ? 'synced' : 'local'));
  return res.json(applySearch(list, req.query.search).sort(byName));
}

// GET /api/categories (pelengkap form & filter)
async function getCategories(req, res) {
  const list = await prisma.category.findMany({ orderBy: { id: 'asc' } });
  return res.json(list);
}

module.exports = { getProvinces, getRegencies, getDistricts, getVillages, getCategories };
