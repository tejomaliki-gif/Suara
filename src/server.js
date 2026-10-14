require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
// fallback bila file .env belum dibuat (salin dari .env.example)
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';
const app = require('./app');
const prisma = require('./lib/prisma');

const PORT = Number(process.env.PORT || 5000);

const server = app.listen(PORT, () => {
  console.log('\n==============================================');
  console.log('  SuaraNusantara GIS API berjalan');
  console.log(`  ➜ http://localhost:${PORT}/api/health`);
  console.log('==============================================\n');
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
