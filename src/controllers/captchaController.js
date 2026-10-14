/** CAPTCHA matematika sederhana anti-spam (divalidasi di backend, sekali pakai, kedaluwarsa 5 menit). */
const crypto = require('crypto');

const TTL_MS = 5 * 60 * 1000;
const store = new Map(); // captchaId -> { answer, expiresAt }

function cleanup() {
  const now = Date.now();
  for (const [id, v] of store) if (v.expiresAt < now) store.delete(id);
}
setInterval(cleanup, 60 * 1000).unref();

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function makeQuestion() {
  const op = ['+', '-', '×'][rand(0, 2)];
  let a;
  let b;
  let answer;
  if (op === '+') {
    a = rand(2, 30);
    b = rand(2, 30);
    answer = a + b;
  } else if (op === '-') {
    a = rand(10, 40);
    b = rand(1, a - 1);
    answer = a - b;
  } else {
    a = rand(2, 9);
    b = rand(2, 9);
    answer = a * b;
  }
  return { question: `Berapa hasil dari ${a} ${op} ${b}?`, answer };
}

// GET /api/captcha
function getCaptcha(req, res) {
  if (store.size > 20000) cleanup();
  const { question, answer } = makeQuestion();
  const captchaId = crypto.randomUUID();
  store.set(captchaId, { answer, expiresAt: Date.now() + TTL_MS });
  res.set('Cache-Control', 'no-store');
  return res.json({ captchaId, question, expiresInSeconds: TTL_MS / 1000 });
}

/** Verifikasi & hanguskan captcha. @returns {boolean} */
function verifyCaptcha(captchaId, answer) {
  const entry = store.get(String(captchaId || ''));
  if (!entry) return false;
  store.delete(String(captchaId));
  if (entry.expiresAt < Date.now()) return false;
  return Number(String(answer).trim()) === entry.answer;
}

module.exports = { getCaptcha, verifyCaptcha };
