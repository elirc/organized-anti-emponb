import { PrismaClient } from '@prisma/client';

// Configure prisma client instance with debug querying logs in development
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['error', 'warn'] 
    : ['error'],
});

export default prisma;
