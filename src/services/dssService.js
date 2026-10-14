/**
 * Sistem Pendukung Keputusan (DSS) Prioritas Wilayah Ter-normalisasi
 *
 *   Priority Score = 0.30·V̂ + 0.25·Û + 0.25·Ĉ + 0.20·P̂        (skala 0–100)
 *
 *   V̂ = normalisasi jumlah total aspirasi di wilayah
 *   Û = normalisasi jumlah dukungan publik (upvotes)
 *   Ĉ = normalisasi jumlah laporan kategori kritis (Kesehatan, Infrastruktur, Air Bersih, Keamanan, Bencana)
 *   P̂ = normalisasi jumlah laporan menunggu/belum tertangani (MENUNGGU_VERIFIKASI, TERVERIFIKASI)
 *
 * Normalisasi: x̂ = (x / max(x di seluruh wilayah)) × 100  → nilai 0–100.
 */
const prisma = require('../lib/prisma');

const WEIGHTS = { V: 0.3, U: 0.25, C: 0.25, P: 0.2 };
const PENDING_STATUSES = ['MENUNGGU_VERIFIKASI', 'TERVERIFIKASI'];

function priorityLevel(score) {
  if (score >= 75) return { level: 'SANGAT_TINGGI', label: 'Sangat Tinggi' };
  if (score >= 50) return { level: 'TINGGI', label: 'Tinggi' };
  if (score >= 25) return { level: 'SEDANG', label: 'Sedang' };
  return { level: 'RENDAH', label: 'Rendah' };
}

const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

/**
 * Hitung skor prioritas dari kumpulan baris aspirasi (fungsi murni — mudah diuji).
 * @param {Array<{key:any,name:string,provinceName?:string,upvotes:number,isCritical:boolean,status:string}>} rows
 */
function computePriority(rows) {
  const groups = new Map();
  for (const r of rows) {
    if (r.status === 'DITOLAK') continue; // laporan ditolak tidak dihitung
    if (!groups.has(r.key)) {
      groups.set(r.key, { key: r.key, name: r.name, provinceName: r.provinceName, latitude: r.latitude, longitude: r.longitude, V: 0, U: 0, C: 0, P: 0, resolved: 0 });
    }
    const g = groups.get(r.key);
    g.V += 1;
    g.U += r.upvotes || 0;
    if (r.isCritical) g.C += 1;
    if (PENDING_STATUSES.includes(r.status)) g.P += 1;
    if (r.status === 'SELESAI') g.resolved += 1;
  }
  const list = [...groups.values()];
  const max = {
    V: Math.max(0, ...list.map((g) => g.V)),
    U: Math.max(0, ...list.map((g) => g.U)),
    C: Math.max(0, ...list.map((g) => g.C)),
    P: Math.max(0, ...list.map((g) => g.P)),
  };
  const norm = (x, m) => (m > 0 ? (x / m) * 100 : 0);

  const ranked = list
    .map((g) => {
      const n = { V: norm(g.V, max.V), U: norm(g.U, max.U), C: norm(g.C, max.C), P: norm(g.P, max.P) };
      const score = WEIGHTS.V * n.V + WEIGHTS.U * n.U + WEIGHTS.C * n.C + WEIGHTS.P * n.P;
      return {
        regionId: g.key,
        regionName: g.name,
        provinceName: g.provinceName,
        latitude: g.latitude,
        longitude: g.longitude,
        raw: { totalAspirations: g.V, totalUpvotes: g.U, criticalCount: g.C, pendingCount: g.P, resolvedCount: g.resolved },
        normalized: { V: round(n.V), U: round(n.U), C: round(n.C), P: round(n.P) },
        score: round(score),
        ...priorityLevel(score),
      };
    })
    .sort((a, b) => b.score - a.score || b.raw.totalUpvotes - a.raw.totalUpvotes)
    .map((r, i) => ({ rank: i + 1, ...r }));

  return { weights: WEIGHTS, max, regions: ranked };
}

/** Ambil data dari DB lalu hitung ranking per provinsi atau per kabupaten/kota. */
async function getPriorityRegions({ level = 'province', provinceId, categoryId } = {}) {
  const where = {};
  if (provinceId) where.provinceId = Number(provinceId);
  if (categoryId) where.categoryId = Number(categoryId);

  const items = await prisma.aspiration.findMany({
    where,
    select: {
      status: true,
      upvotesCount: true,
      category: { select: { isCritical: true } },
      province: { select: { id: true, name: true, latitude: true, longitude: true } },
      regency: { select: { id: true, name: true, latitude: true, longitude: true } },
    },
  });

  const rows = items.map((a) => {
    const isReg = level === 'regency';
    const reg = isReg ? a.regency : a.province;
    return {
      key: reg.id,
      name: reg.name,
      provinceName: isReg ? a.province.name : undefined,
      latitude: reg.latitude ?? a.province.latitude,
      longitude: reg.longitude ?? a.province.longitude,
      upvotes: a.upvotesCount,
      isCritical: a.category.isCritical,
      status: a.status,
    };
  });

  return { level, formula: 'Priority = 0.30·V̂ + 0.25·Û + 0.25·Ĉ + 0.20·P̂', ...computePriority(rows) };
}

module.exports = { computePriority, getPriorityRegions, WEIGHTS };
