import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const prisma = new PrismaClient();

beforeAll(async () => {
    // Run migrations on test database
    try {
        execSync('npx prisma migrate deploy', {
            env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
        });
        console.log('✅ Test database migrations completed');
    } catch (error) {
        console.error('❌ Failed to run migrations:', error);
        throw error;
    }
});

afterAll(async () => {
    // Disconnect from database
    await prisma.$disconnect();
});

// NOTE: No global beforeEach - each test file manages its own cleanup
// This prevents interference when tests run in parallel

export { prisma };
