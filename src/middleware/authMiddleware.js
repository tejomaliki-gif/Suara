const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'suaranusantara-dev-secret';

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Akses ditolak. Silakan login sebagai admin.' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Sesi login tidak valid atau telah berakhir.' });
  }
}

module.exports = { requireAdmin, JWT_SECRET };
