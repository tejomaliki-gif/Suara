/** Utilitas umum: format nomor WA, masking privasi, kode tiket, normalisasi nama wilayah. */

/**
 * Validasi & normalisasi nomor WhatsApp Indonesia.
 * Menerima: 08xxxxxxxxx, 628xxxxxxxxx, +628xxxxxxxxx (spasi/strip diabaikan).
 * @returns {{valid:boolean, normalized?:string, local?:string, message?:string}}
 */
function normalizeIndonesianPhone(raw) {
  if (!raw || typeof raw !== 'string') return { valid: false, message: 'Nomor WhatsApp wajib diisi.' };
  const digits = raw.replace(/[\s\-().]/g, '').replace(/^\+/, '');
  if (!/^\d+$/.test(digits)) return { valid: false, message: 'Nomor hanya boleh berisi angka.' };

  let local;
  if (digits.startsWith('08')) local = digits;
  else if (digits.startsWith('628')) local = '0' + digits.slice(2);
  else return { valid: false, message: 'Format harus diawali 08 atau 628 (contoh: 081234567890).' };

  // Nomor seluler Indonesia: 08 + 8–11 digit => total 10–13 digit
  if (local.length < 10 || local.length > 13) {
    return { valid: false, message: 'Panjang nomor tidak valid (10–13 digit untuk format 08xx).' };
  }
  return { valid: true, local, normalized: '62' + local.slice(1) };
}

/** Samarkan nomor: 081234567890 -> 0812****890 */
function maskPhone(phone) {
  const r = normalizeIndonesianPhone(phone);
  const local = r.valid ? r.local : String(phone || '').replace(/\D/g, '');
  if (local.length < 8) return '****';
  return `${local.slice(0, 4)}****${local.slice(-3)}`;
}

/** Kode tiket unik: SN-2026-88412 */
function generateTrackingCode(date = new Date()) {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `SN-${date.getFullYear()}-${n}`;
}

/** Normalisasi nama wilayah untuk pencocokan antar-sumber data. */
function normalizeRegionName(name) {
  return String(name || '')
    .toUpperCase()
    .replace(/\bKAB(UPATEN)?\.?\s+/g, '')
    .replace(/\bKOTA\s+(ADM(INISTRASI)?\.?\s+)?/g, '')
    .replace(/\bADM(INISTRASI)?\.?\s+/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

/** Ubah "KABUPATEN ACEH BESAR" -> "Kabupaten Aceh Besar" */
function toTitleCase(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/(^|[\s\-(/.])([a-z])/g, (m, p, c) => p + c.toUpperCase())
    .replace(/\bDki\b/g, 'DKI')
    .replace(/\bDi\b/g, 'DI');
}

/** Jarak haversine dalam kilometer */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const STATUSES = ['MENUNGGU_VERIFIKASI', 'TERVERIFIKASI', 'DIPROSES', 'SELESAI', 'DITOLAK'];

const STATUS_LABELS = {
  MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
  TERVERIFIKASI: 'Terverifikasi',
  DIPROSES: 'Sedang Diproses',
  SELESAI: 'Selesai',
  DITOLAK: 'Ditolak',
};

module.exports = {
  normalizeIndonesianPhone,
  maskPhone,
  generateTrackingCode,
  normalizeRegionName,
  toTitleCase,
  haversineKm,
  STATUSES,
  STATUS_LABELS,
};
