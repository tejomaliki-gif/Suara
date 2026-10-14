const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const routes = require('./routes');
const { UPLOAD_ROOT } = require('./middleware/uploadMiddleware');

const app = express();
// Railway & proxy reverse support (X-Forwarded-For)
app.set('trust proxy', 1);

const origins = (
  process.env.CORS_ORIGIN ||
  'https://bajarayanussantara.com,https://www.bajarayanussantara.com,http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // gambar /uploads bisa tampil di frontend
  })
);
app.use(
  cors({
    origin: (origin, cb) => {
      // Izinkan jika tanpa header origin (mobile/curl), atau ada wildcard '*', atau cocok dengan daftar origins
      if (!origin || origins.includes('*') || origins.includes(origin)) {
        return cb(null, true);
      }
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Terlalu banyak permintaan. Coba lagi beberapa saat.' },
  })
);

// File publik (bukti foto & logo). SVG disajikan dengan CSP ketat agar aman.
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; script-src 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  },
  express.static(UPLOAD_ROOT, { maxAge: '1h', fallthrough: true })
);

app.use('/api', routes);

app.get('/', (req, res) =>
  res.json({ name: 'SuaraNusantara GIS API', docs: 'Lihat README.md', health: '/api/health' })
);

app.use('/api', (req, res) => res.status(404).json({ message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.` }));

// error handler terpusat
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Ukuran file terlalu besar (maks. 5 MB untuk bukti, 2 MB untuk logo).' : err.message;
    return res.status(400).json({ message: msg });
  }
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('[ERROR]', err);
  return res.status(status).json({ message: status >= 500 ? 'Terjadi kesalahan pada server.' : err.message });
});

module.exports = app;
