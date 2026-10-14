const { z } = require('zod');
const prisma = require('../lib/prisma');
const { publicPath, removeLocalUpload } = require('../middleware/uploadMiddleware');

async function getOrCreateConfig() {
  return prisma.siteConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

const logoUrl = z
  .union([
    z.literal(''),
    z.null(),
    z.string().trim().url('URL logo harus berupa tautan http(s) yang valid.').refine((u) => /^https?:\/\//i.test(u), 'URL logo harus diawali http:// atau https://'),
  ])
  .optional();

const updateSchema = z.object({
  appName: z.string().trim().min(2, 'Nama aplikasi minimal 2 karakter.').max(60).optional(),
  appSubtitle: z.string().trim().max(120).optional(),
  heroTitle: z.string().trim().min(5).max(160).optional(),
  heroDescription: z.string().trim().max(600).optional(),
  partnerName: z.string().trim().min(2).max(120).optional(),
  partnerLabel: z.string().trim().max(60).optional(),
  showPartnerLogo: z.union([z.boolean(), z.enum(['true', 'false']).transform((v) => v === 'true')]).optional(),
  primaryLogoUrl: logoUrl,
  partnerLogoUrl: logoUrl,
});

// GET /api/config
async function getConfig(req, res) {
  const config = await getOrCreateConfig();
  res.set('Cache-Control', 'no-store');
  return res.json(config);
}

// PUT /api/admin/config
async function updateConfig(req, res) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const current = await getOrCreateConfig();
  const data = { ...parsed.data };

  for (const key of ['primaryLogoUrl', 'partnerLogoUrl']) {
    if (key in data) {
      if (data[key] === '' || data[key] === null) data[key] = null;
      if (data[key] !== current[key]) removeLocalUpload(current[key]);
    }
  }
  const config = await prisma.siteConfig.update({ where: { id: 1 }, data });
  return res.json({ message: 'Pengaturan branding berhasil disimpan.', config });
}

const targetSchema = z.enum(['primary', 'partner'], { errorMap: () => ({ message: 'Target logo harus "primary" atau "partner".' }) });

// POST /api/admin/config/upload-logo  (multipart: target=primary|partner, logo=<file>)
async function uploadLogo(req, res) {
  const target = targetSchema.safeParse(req.body.target);
  if (!target.success) {
    if (req.file) removeLocalUpload(publicPath('branding', req.file.filename));
    return res.status(400).json({ message: target.error.issues[0].message });
  }
  if (!req.file) return res.status(400).json({ message: 'File logo wajib diunggah.' });

  const field = target.data === 'primary' ? 'primaryLogoUrl' : 'partnerLogoUrl';
  const current = await getOrCreateConfig();
  removeLocalUpload(current[field]);
  const config = await prisma.siteConfig.update({
    where: { id: 1 },
    data: { [field]: publicPath('branding', req.file.filename) },
  });
  return res.json({ message: `Logo ${target.data === 'primary' ? 'kiri (utama)' : 'kanan (instansi)'} berhasil diperbarui.`, config });
}

// POST /api/admin/config/reset-logo  { target: primary|partner|all }
async function resetLogo(req, res) {
  const t = String(req.body.target || 'all');
  if (!['primary', 'partner', 'all'].includes(t)) return res.status(400).json({ message: 'Target tidak valid.' });
  const current = await getOrCreateConfig();
  const data = {};
  if (t === 'primary' || t === 'all') {
    removeLocalUpload(current.primaryLogoUrl);
    data.primaryLogoUrl = null;
  }
  if (t === 'partner' || t === 'all') {
    removeLocalUpload(current.partnerLogoUrl);
    data.partnerLogoUrl = null;
  }
  const config = await prisma.siteConfig.update({ where: { id: 1 }, data });
  return res.json({ message: 'Logo dikembalikan ke SVG default.', config });
}

module.exports = { getConfig, updateConfig, uploadLogo, resetLogo };
