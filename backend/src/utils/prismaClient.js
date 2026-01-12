// backend/src/utils/prismaClient.js
// Prisma client is generated in root node_modules since it's shared
// We need to resolve it with correct Node path resolution

let PrismaClient;
try {
  // Try to import from local node_modules first (standard resolution)
  // This matches the schema.prisma output path: "../backend/node_modules/.prisma/client"
  PrismaClient = require('@prisma/client').PrismaClient;
} catch (e) {
  // Fallback to root node_modules if local fails
  try {
    PrismaClient = require('../../../node_modules/@prisma/client').PrismaClient;
  } catch (fallbackErr) {
    console.error('Failed to load Prisma Client:', fallbackErr.message);
    console.error('Make sure to run: npm install && npx prisma generate');
    process.exit(1);
  }
}

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;
