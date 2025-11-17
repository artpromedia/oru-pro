import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.PRISMA_LOG_LEVEL ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
});

export { prisma };
