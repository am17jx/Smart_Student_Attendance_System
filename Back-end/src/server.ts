import dotenv from 'dotenv';
import app from './app';
import { startCleanupJobs } from '../utils/cleanupJobs';
import { prisma } from '../prisma/client';
import logger from '../utils/logger';

dotenv.config();

logger.debug('Checking environment variables...');
logger.debug(`PORT from env: ${process.env.PORT}`);
logger.debug(`DATABASE_URL is defined: ${!!process.env.DATABASE_URL}`);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    // Start cleanup jobs
    startCleanupJobs();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.warn('SIGTERM received. Shutting down gracefully...');
    server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
});

process.on('unhandledRejection', (err: any) => {
    logger.error('UNHANDLED REJECTION! Shutting down...');
    logger.error(`${err.name}: ${err.message}`, { stack: err.stack });
    server.close(async () => {
        await prisma.$disconnect();
        process.exit(1);
    });
});

process.on('uncaughtException', (err: any) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...');
    logger.error(`${err.name}: ${err.message}`, { stack: err.stack });
    process.exit(1);
});
