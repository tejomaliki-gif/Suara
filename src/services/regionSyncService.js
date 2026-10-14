/**
 * Hybrid Smart Region Service (Auto-Fetch & Local Cache)
 * -------------------------------------------------------
 * Data lokal SQLite di-seed dengan 38 provinsi + Kab/Kota utama.
 * Ketika user membuka wilayah yang datanya belum lengkap, service ini mengambil data dari
 * dataset terbuka emsifa/api-wilayah-indonesia lalu menyimpannya ke SQLite, sehingga akses
 * berikutnya instan dan bisa offline.
 *
 * Catatan pemekaran Papua 2022: dataset emsifa masih memakai 34 provinsi (Papua & Papua Barat
 * lama). Karena itu Kab/Kota 6 provinsi Tanah Papua sudah di-seed LENGKAP, dan Kecamatan/Desa
 * di wilayah tersebut dicari dengan pencocokan nama di provinsi induk lama.
 */
const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');
const { normalizeRegionName, toTitleCase } = require('../utils/helpers');
const { provinces: SEED_PROVINCES, PAPUA_GROUP } = require('../../prisma/seedData');

const BASE = process.env.REGION_API_BASE || 'https://emsifa.github.io/api-wilayah-indonesia/api';
const TIMEOUT = Number(process.env.REGION_SYNC_TIMEOUT_MS || 10000);
const STATE_FILE = path.join(__dirname, '..', '..', 'cache', 'region-sync-state.json');

const EXPECTED_REGENCIES = Object.fromEntries(SEED_PROVINCES.map((p) => [p[0], p[4]]));

// ---------- state cache (penanda wilayah yang sudah tersinkron penuh) ----------
let state = { regencies: {}, districts: {}, villages: {} };
try {
  if (fs.existsSync(STATE_FILE)) state = { ...state, ...JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) };
} catch (_) {
  /* abaikan file rusak */
}
function saveState() {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    console.warn('[regionSync] gagal menyimpan state:', e.message);
  }
}

// ---------- HTTP dengan timeout + memo in-memory ----------
const memo = new Map();
async function fetchJson(url) {
  if (memo.has(url)) return memo.get(url);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    memo.set(url, json);
    return json;
  } finally {
    clearTimeout(t);
  }
}

// Cegah sinkronisasi ganda untuk wilayah yang sama secara bersamaan
const inflight = new Map();
function once(key, fn) {
  if (inflight.has(key)) return inflight.get(key);
  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

const typeFromName = (name) => (/^KOTA\b/i.test(name) ? 'KOTA' : 'KABUPATEN');

// ---------- KABUPATEN / KOTA ----------
async function ensureRegencies(province) {
  if (!province || PAPUA_GROUP.includes(province.code)) return { synced: false, reason: 'complete-seed' };
  if (state.regencies[province.code]) return { synced: false, reason: 'cached' };

  const localCount = await prisma.regency.count({ where: { provinceId: province.id } });
  const expected = EXPECTED_REGENCIES[province.code];
  const allOfficial = localCount > 0 && (await prisma.regency.count({ where: { provinceId: province.id, code: { startsWith: 'S' } } })) === 0;
  if (expected && localCount >= expected && allOfficial) {
    state.regencies[province.code] = true;
    saveState();
    return { synced: false, reason: 'complete' };
  }

  return once(`reg:${province.code}`, async () => {
    const remote = await fetchJson(`${BASE}/regencies/${province.code}.json`);
    const locals = await prisma.regency.findMany({ where: { provinceId: province.id } });
    const ops = [];
    for (const r of remote) {
      const type = typeFromName(r.name);
      const byCode = locals.find((l) => l.code === r.id);
      if (byCode) continue;
      const norm = normalizeRegionName(r.name);
      const byName = locals.find((l) => l.type === type && normalizeRegionName(l.name) === norm);
      if (byName) {
        ops.push(prisma.regency.update({ where: { id: byName.id }, data: { code: r.id } }));
      } else {
        ops.push(
          prisma.regency.create({ data: { code: r.id, name: toTitleCase(r.name), type, provinceId: province.id } })
        );
      }
    }
    if (ops.length) await prisma.$transaction(ops);
    state.regencies[province.code] = true;
    saveState();
    return { synced: true, added: ops.length };
  });
}

// cari ID Kab/Kota versi emsifa (untuk wilayah seed berkode sementara / Tanah Papua)
async function resolveRemoteRegencyId(regency) {
  const province = regency.province || (await prisma.province.findUnique({ where: { id: regency.provinceId } }));
  const isPapua = PAPUA_GROUP.includes(province.code);
  if (!isPapua && /^\d{4}$/.test(regency.code)) return regency.code;

  let parentIds = [province.code];
  if (isPapua) {
    const provs = await fetchJson(`${BASE}/provinces.json`);
    parentIds = provs.filter((p) => /PAPUA/i.test(p.name)).map((p) => p.id);
  }
  const norm = normalizeRegionName(regency.name);
  for (const pid of parentIds) {
    const list = await fetchJson(`${BASE}/regencies/${pid}.json`);
    const hit = list.find((r) => typeFromName(r.name) === regency.type && normalizeRegionName(r.name) === norm);
    if (hit) return hit.id;
  }
  return null;
}

// ---------- KECAMATAN ----------
async function ensureDistricts(regency) {
  if (!regency || state.districts[regency.id]) return { synced: false, reason: 'cached' };
  return once(`dist:${regency.id}`, async () => {
    const remoteId = await resolveRemoteRegencyId(regency);
    if (!remoteId) return { synced: false, reason: 'not-found' };
    const remote = await fetchJson(`${BASE}/districts/${remoteId}.json`);
    const locals = await prisma.district.findMany({ where: { regencyId: regency.id } });
    const taken = new Set((await prisma.district.findMany({ where: { code: { in: remote.map((d) => d.id) } }, select: { code: true } })).map((d) => d.code));
    const ops = [];
    for (const d of remote) {
      if (locals.find((l) => l.code === d.id)) continue;
      const norm = normalizeRegionName(d.name);
      const byName = locals.find((l) => normalizeRegionName(l.name) === norm);
      if (byName) {
        if (!taken.has(d.id)) ops.push(prisma.district.update({ where: { id: byName.id }, data: { code: d.id } }));
      } else if (!taken.has(d.id)) {
        ops.push(prisma.district.create({ data: { code: d.id, name: toTitleCase(d.name), regencyId: regency.id } }));
      }
    }
    if (ops.length) await prisma.$transaction(ops);
    state.districts[regency.id] = true;
    saveState();
    return { synced: true, added: ops.length };
  });
}

// ---------- DESA / KELURAHAN ----------
async function ensureVillages(district) {
  if (!district || state.villages[district.id]) return { synced: false, reason: 'cached' };
  return once(`vil:${district.id}`, async () => {
    let current = district;
    if (!/^\d{7}$/.test(current.code)) {
      const regency = await prisma.regency.findUnique({ where: { id: current.regencyId }, include: { province: true } });
      await ensureDistricts(regency);
      current = await prisma.district.findUnique({ where: { id: district.id } });
      if (!/^\d{7}$/.test(current.code)) return { synced: false, reason: 'not-found' };
    }
    const remote = await fetchJson(`${BASE}/villages/${current.code}.json`);
    const locals = await prisma.village.findMany({ where: { districtId: current.id } });
    const taken = new Set((await prisma.village.findMany({ where: { code: { in: remote.map((v) => v.id) } }, select: { code: true } })).map((v) => v.code));
    const ops = [];
    for (const v of remote) {
      if (locals.find((l) => l.code === v.id)) continue;
      const norm = normalizeRegionName(v.name);
      const byName = locals.find((l) => normalizeRegionName(l.name) === norm);
      if (byName) {
        if (!taken.has(v.id)) ops.push(prisma.village.update({ where: { id: byName.id }, data: { code: v.id } }));
      } else if (!taken.has(v.id)) {
        ops.push(prisma.village.create({ data: { code: v.id, name: toTitleCase(v.name), districtId: current.id } }));
      }
    }
    if (ops.length) await prisma.$transaction(ops);
    state.villages[district.id] = true;
    saveState();
    return { synced: true, added: ops.length };
  });
}

/** Jalankan sync tanpa menggagalkan request bila offline. */
async function safeSync(fn, arg) {
  try {
    return await fn(arg);
  } catch (e) {
    console.warn(`[regionSync] sinkronisasi dilewati (offline/sumber tidak tersedia): ${e.message}`);
    return { synced: false, reason: 'offline', error: e.message };
  }
}

module.exports = { ensureRegencies, ensureDistricts, ensureVillages, safeSync };
