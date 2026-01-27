import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Stage API Tests', () => {
    let adminToken: string;
    let stageId: string;

    // Setup: Create admin and get token before all tests
    beforeAll(async () => {
        // Clean database
        await prisma.stage.deleteMany();
        await prisma.admin.deleteMany();

        // Create admin user
        const admin = await prisma.admin.create({
            data: {
                name: 'Test Admin',
                email: 'admin@test.com',
                password: await bcrypt.hash('Admin@123', 10)
            }
        });

        // Login to get token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@test.com',
                password: 'Admin@123'
            });

        adminToken = loginResponse.body.token;
    });

    // Clean stages before each test
    beforeEach(async () => {
        await prisma.stage.deleteMany();
    });

    // Cleanup after all tests
    afterAll(async () => {
        await prisma.stage.deleteMany();
        await prisma.admin.deleteMany();
        await prisma.$disconnect();
    });

    // ==================== GET /api/stages ====================
    describe('GET /api/stages', () => {
        test('returns empty array when no stages exist', async () => {
            const response = await request(app)
                .get('/api/stages')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.stages).toEqual([]);
        });

        test('returns all stages when they exist', async () => {
            // Create test stages
            await prisma.stage.create({ data: { name: 'First Year', level: 1 } });
            await prisma.stage.create({ data: { name: 'Second Year', level: 2 } });

            const response = await request(app)
                .get('/api/stages')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.stages).toHaveLength(2);
            expect(response.body.data.stages[0]).toHaveProperty('id');
            expect(response.body.data.stages[0]).toHaveProperty('name');
            expect(response.body.data.stages[0]).toHaveProperty('level');
        });

        test('stages are sorted by level', async () => {
            // Create stages in random order
            await prisma.stage.create({ data: { name: 'Third Year', level: 3 } });
            await prisma.stage.create({ data: { name: 'First Year', level: 1 } });
            await prisma.stage.create({ data: { name: 'Second Year', level: 2 } });

            const response = await request(app)
                .get('/api/stages')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const stages = response.body.data.stages;
            expect(stages[0].level).toBe(1);
            expect(stages[1].level).toBe(2);
            expect(stages[2].level).toBe(3);
        });

        test('each stage has correct structure', async () => {
            await prisma.stage.create({ data: { name: 'First Year', level: 1 } });

            const response = await request(app)
                .get('/api/stages')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const stage = response.body.data.stages[0];
            expect(stage).toHaveProperty('id');
            expect(stage).toHaveProperty('name');
            expect(stage).toHaveProperty('level');
            expect(stage).toHaveProperty('created_at');
            expect(stage).toHaveProperty('updated_at');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .get('/api/stages')
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== POST /api/stages ====================
    describe('POST /api/stages', () => {
        test('creates stage with valid data', async () => {
            const stageData = {
                name: 'First Year',
                level: 1
            };

            const response = await request(app)
                .post('/api/stages')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(stageData)
                .expect(201);

            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body.data.stage).toHaveProperty('id');
            expect(response.body.data.stage.name).toBe(stageData.name);
            expect(response.body.data.stage.level).toBe(stageData.level);

            // Verify in database
            const dbStage = await prisma.stage.findFirst({
                where: { name: stageData.name, level: stageData.level }
            });
            expect(dbStage).not.toBeNull();
            expect(dbStage?.name).toBe(stageData.name);
            expect(dbStage?.level).toBe(stageData.level);
        });

        test('returns 400 for empty stage name', async () => {
            const response = await request(app)
                .post('/api/stages')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: '', level: 1 })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('name is required');
        });

        test('returns 400 for missing name field', async () => {
            const response = await request(app)
                .post('/api/stages')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ level: 1 })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
        });

        test('returns 400 for missing level field', async () => {
            const response = await request(app)
                .post('/api/stages')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'First Year' })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('level is required');
        });

        test('returns 400 for invalid level type', async () => {
            const response = await request(app)
                .post('/api/stages')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'First Year', level: 'one' })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('must be a number');
        });

        test('returns 400 for duplicate stage', async () => {
            // Create first stage
            await prisma.stage.create({ data: { name: 'First Year', level: 1 } });

            // Try to create duplicate
            const response = await request(app)
                .post('/api/stages')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'First Year', level: 1 })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('already exists');
        });

        test('allows same name with different level', async () => {
            // Create first stage
            await prisma.stage.create({ data: { name: 'Computer Science', level: 1 } });

            // Create stage with same name but different level
            const response = await request(app)
                .post('/api/stages')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Computer Science', level: 2 })
                .expect(201);

            expect(response.body).toHaveProperty('status', 'success');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .post('/api/stages')
                .send({ name: 'New Stage', level: 1 })
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== PUT /api/stages/:id ====================
    describe('PUT /api/stages/:id', () => {
        beforeEach(async () => {
            // Create a stage for update tests
            const stage = await prisma.stage.create({
                data: { name: 'Original Name', level: 1 }
            });
            stageId = stage.id.toString();
        });

        test('updates stage with valid data', async () => {
            const updatedData = {
                name: 'Updated Name',
                level: 2
            };

            const response = await request(app)
                .put(`/api/stages/${stageId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatedData)
                .expect(200);

            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body.data.stage.name).toBe(updatedData.name);
            expect(response.body.data.stage.level).toBe(updatedData.level);

            // Verify in database
            const dbStage = await prisma.stage.findUnique({
                where: { id: BigInt(stageId) }
            });
            expect(dbStage?.name).toBe(updatedData.name);
            expect(dbStage?.level).toBe(updatedData.level);
        });

        test('updates only name when level not provided', async () => {
            const response = await request(app)
                .put(`/api/stages/${stageId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Updated Name Only' })
                .expect(200);

            expect(response.body.data.stage.name).toBe('Updated Name Only');
            expect(response.body.data.stage.level).toBe(1); // Original level
        });

        test('returns 404 for non-existent stage', async () => {
            const response = await request(app)
                .put('/api/stages/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Updated Name', level: 2 })
                .expect(404);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('not found');
        });

        test('returns 400 for empty name', async () => {
            const response = await request(app)
                .put(`/api/stages/${stageId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: '' })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
        });

        test('returns 400 for invalid level type', async () => {
            const response = await request(app)
                .put(`/api/stages/${stageId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Updated', level: 'invalid' })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .put(`/api/stages/${stageId}`)
                .send({ name: 'Updated Name' })
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== DELETE /api/stages/:id ====================
    describe('DELETE /api/stages/:id', () => {
        beforeEach(async () => {
            // Create a stage for delete tests
            const stage = await prisma.stage.create({
                data: { name: 'To Be Deleted', level: 1 }
            });
            stageId = stage.id.toString();
        });

        test('deletes existing stage', async () => {
            const response = await request(app)
                .delete(`/api/stages/${stageId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body.data).toHaveProperty('stage');

            // Verify deletion in database
            const dbStage = await prisma.stage.findUnique({
                where: { id: BigInt(stageId) }
            });
            expect(dbStage).toBeNull();
        });

        test('returns 404 for non-existent stage', async () => {
            const response = await request(app)
                .delete('/api/stages/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('not found');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .delete(`/api/stages/${stageId}`)
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });

        test('verifies stage is actually deleted from database', async () => {
            // Delete the stage
            await request(app)
                .delete(`/api/stages/${stageId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            // Try to get it again
            const dbStage = await prisma.stage.findUnique({
                where: { id: BigInt(stageId) }
            });

            expect(dbStage).toBeNull();

            // Verify count is zero
            const count = await prisma.stage.count();
            expect(count).toBe(0);
        });
    });
});
