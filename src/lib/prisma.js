const { PrismaClient } = require('@prisma/client');

const prisma = global.__suaraPrisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.__suaraPrisma = prisma;

module.exports = prisma;
