import dotenv from 'dotenv';
import app from './app';
import { startCleanupJobs } from '../utils/cleanupJobs';
import { prisma } from '../prisma/client';

dotenv.config();

console.log('🔍 Debug: Checking environment variables...');
console.log('🔍 Debug: PORT from env:', process.env.PORT);
console.log('🔍 Debug: DATABASE_URL is defined:', !!process.env.DATABASE_URL);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}...`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    // Start cleanup jobs
    startCleanupJobs();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
});

process.on('unhandledRejection', (err: any) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(async () => {
        await prisma.$disconnect();
        process.exit(1);
    });
});

process.on('uncaughtException', (err: any) => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});
