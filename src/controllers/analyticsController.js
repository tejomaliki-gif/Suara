const prisma = require('../lib/prisma');
const { getPriorityRegions } = require('../services/dssService');
const { STATUSES, STATUS_LABELS } = require('../utils/helpers');

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// GET /api/analytics/summary
async function summary(req, res) {
  const [rows, categories, provinces, totalProvinces] = await Promise.all([
    prisma.aspiration.findMany({ select: { status: true, createdAt: true, categoryId: true, provinceId: true, upvotesCount: true } }),
    prisma.category.findMany({ select: { id: true, name: true, color: true, icon: true, isCritical: true } }),
    prisma.province.findMany({ select: { id: true, name: true, code: true, latitude: true, longitude: true } }),
    prisma.province.count(),
  ]);

  const count = (fn) => rows.filter(fn).length;
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  rows.forEach((r) => {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  });

  // tren 12 bulan terakhir
  const now = new Date();
  const monthly = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthly.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: `${MONTHS_ID[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, total: 0, resolved: 0 });
  }
  const mIndex = Object.fromEntries(monthly.map((m, i) => [m.key, i]));
  rows.forEach((r) => {
    const d = new Date(r.createdAt);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (k in mIndex) {
      monthly[mIndex[k]].total += 1;
      if (r.status === 'SELESAI') monthly[mIndex[k]].resolved += 1;
    }
  });

  const categoryDistribution = categories
    .map((c) => ({ ...c, count: count((r) => r.categoryId === c.id) }))
    .sort((a, b) => b.count - a.count);

  const provinceDistribution = provinces
    .map((p) => {
      const list = rows.filter((r) => r.provinceId === p.id);
      return {
        ...p,
        count: list.length,
        resolved: list.filter((r) => r.status === 'SELESAI').length,
        upvotes: list.reduce((s, r) => s + r.upvotesCount, 0),
      };
    })
    .sort((a, b) => b.count - a.count);

  const total = rows.length;
  const resolved = byStatus.SELESAI;
  return res.json({
    totals: {
      totalAspirations: total,
      provincesReached: new Set(rows.map((r) => r.provinceId)).size,
      totalProvinces,
      inProcess: byStatus.TERVERIFIKASI + byStatus.DIPROSES,
      resolved,
      pending: byStatus.MENUNGGU_VERIFIKASI,
      rejected: byStatus.DITOLAK,
      totalUpvotes: rows.reduce((s, r) => s + r.upvotesCount, 0),
      resolutionRate: total ? Math.round((resolved / total) * 1000) / 10 : 0,
    },
    statusDistribution: STATUSES.map((s) => ({ status: s, label: STATUS_LABELS[s], count: byStatus[s] })),
    monthlyTrend: monthly,
    categoryDistribution,
    provinceDistribution,
  });
}

// GET /api/analytics/priority-regions?level=province|regency&provinceId=&categoryId=
async function priorityRegions(req, res) {
  const level = req.query.level === 'regency' ? 'regency' : 'province';
  const result = await getPriorityRegions({ level, provinceId: req.query.provinceId, categoryId: req.query.categoryId });
  return res.json(result);
}

module.exports = { summary, priorityRegions };
