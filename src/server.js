require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const app = require('./app');
const prisma = require('./lib/prisma');

const PORT = Number(process.env.PORT || 5000);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n==============================================');
  console.log('  SuaraNusantara GIS API berjalan');
  console.log(`  ➜ Port: ${PORT}`);
  console.log('==============================================\n');
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
