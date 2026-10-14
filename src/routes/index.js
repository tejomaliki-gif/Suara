const express = require('express');
const rateLimit = require('express-rate-limit');
const { requireAdmin } = require('../middleware/authMiddleware');
const { uploadEvidence, uploadBranding } = require('../middleware/uploadMiddleware');

const auth = require('../controllers/authController');
const config = require('../controllers/configController');
const region = require('../controllers/regionController');
const aspiration = require('../controllers/aspirationController');
const captcha = require('../controllers/captchaController');
const analytics = require('../controllers/analyticsController');

const router = express.Router();

// bungkus handler async agar error diteruskan ke error handler
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Terlalu banyak pengiriman aspirasi. Silakan coba lagi beberapa menit lagi.' },
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
});
const upvoteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Terlalu banyak permintaan dukungan. Coba lagi sebentar.' },
});

router.get('/health', (req, res) => res.json({ status: 'ok', app: 'SuaraNusantara GIS API', time: new Date().toISOString() }));

// 6.1 Konfigurasi & Dual-Logo Branding
router.get('/config', h(config.getConfig));
router.put('/admin/config', requireAdmin, h(config.updateConfig));
router.post('/admin/config/upload-logo', requireAdmin, uploadBranding.single('logo'), h(config.uploadLogo));
router.post('/admin/config/reset-logo', requireAdmin, h(config.resetLogo));

// 6.2 Wilayah Administratif Indonesia
router.get('/regions/provinces', h(region.getProvinces));
router.get('/regions/regencies', h(region.getRegencies));
router.get('/regions/districts', h(region.getDistricts));
router.get('/regions/villages', h(region.getVillages));
router.get('/categories', h(region.getCategories));

// 6.3 Aspirasi & Partisipasi Publik
router.post('/whatsapp/verify', aspiration.verifyWhatsapp);
router.get('/captcha', captcha.getCaptcha);
router.get('/aspirations', h(aspiration.listAspirations));
router.get('/aspirations/map-points', h(aspiration.mapPoints));
router.get('/aspirations/track/:trackingCode', h(aspiration.trackByCode));
router.get('/aspirations/:id', h(aspiration.getAspiration));
router.post('/aspirations', submitLimiter, uploadEvidence.single('evidence'), h(aspiration.createAspiration));
router.post('/aspirations/:id/upvote', upvoteLimiter, h(aspiration.upvote));

// 6.4 Admin & Analitik DSS
router.post('/auth/login', loginLimiter, h(auth.login));
router.get('/auth/me', requireAdmin, h(auth.me));
router.get('/admin/aspirations', requireAdmin, h(aspiration.adminList));
router.patch('/admin/aspirations/:id/status', requireAdmin, uploadEvidence.single('resolutionImage'), h(aspiration.updateStatus));
router.delete('/admin/aspirations/:id', requireAdmin, h(aspiration.deleteAspiration));
router.get('/analytics/summary', h(analytics.summary));
router.get('/analytics/priority-regions', h(analytics.priorityRegions));

module.exports = router;
