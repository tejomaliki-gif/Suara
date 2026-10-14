const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const DIRS = {
  evidence: path.join(UPLOAD_ROOT, 'evidence'),
  branding: path.join(UPLOAD_ROOT, 'branding'),
};
Object.values(DIRS).forEach((d) => fs.mkdirSync(d, { recursive: true }));

const EXT_BY_MIME = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};

function makeUploader(kind, { allowSvg = false, maxMb = 5 } = {}) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, DIRS[kind]),
    filename: (req, file, cb) => {
      const ext = EXT_BY_MIME[file.mimetype] || path.extname(file.originalname).toLowerCase() || '.bin';
      cb(null, `${kind}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    },
  });
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', ...(allowSvg ? ['image/svg+xml'] : [])];
  return multer({
    storage,
    limits: { fileSize: maxMb * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (allowed.includes(file.mimetype)) return cb(null, true);
      const err = new Error(`Format file tidak didukung. Gunakan ${allowSvg ? 'PNG/JPG/WebP/SVG' : 'PNG/JPG/WebP'}.`);
      err.status = 400;
      return cb(err);
    },
  });
}

const uploadEvidence = makeUploader('evidence', { maxMb: 5 });
const uploadBranding = makeUploader('branding', { allowSvg: true, maxMb: 2 });

/** Path publik (relatif) untuk disimpan di DB, mis. /uploads/evidence/xxx.jpg */
const publicPath = (kind, filename) => `/uploads/${kind}/${filename}`;

/** Hapus file lokal hasil upload sebelumnya (abaikan URL eksternal) */
function removeLocalUpload(publicUrl) {
  if (!publicUrl || !publicUrl.startsWith('/uploads/')) return;
  const abs = path.join(UPLOAD_ROOT, publicUrl.replace(/^\/uploads\//, ''));
  if (abs.startsWith(UPLOAD_ROOT)) fs.promises.unlink(abs).catch(() => {});
}

module.exports = { uploadEvidence, uploadBranding, publicPath, removeLocalUpload, UPLOAD_ROOT };
