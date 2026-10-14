const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const loginSchema = z.object({
  email: z.string().trim().email('Format email tidak valid.'),
  password: z.string().min(1, 'Password wajib diisi.'),
});

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });

  const { email, password } = parsed.data;
  const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
  const ok = admin && (await bcrypt.compare(password, admin.password));
  if (!ok) return res.status(401).json({ message: 'Email atau password salah.' });

  const token = jwt.sign({ id: admin.id, email: admin.email, name: admin.name, role: admin.role }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
  return res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
}

async function me(req, res) {
  const admin = await prisma.admin.findUnique({
    where: { id: req.admin.id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!admin) return res.status(401).json({ message: 'Akun tidak ditemukan.' });
  return res.json({ admin });
}

module.exports = { login, me };
