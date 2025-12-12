import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
        ],
    });
};

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// Log slow queries in development
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
        if (e.duration > 1000) {
            logger.warn({ duration: e.duration, query: e.query }, 'Slow query detected');
        }
    });
}

// Graceful shutdown
export const disconnectDatabase = async () => {
    await prisma.$disconnect();
    logger.info('Database connection closed');
};

// Health check
export const checkDatabaseHealth = async () => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        logger.error({ error }, 'Database health check failed');
        return false;
    }
};
