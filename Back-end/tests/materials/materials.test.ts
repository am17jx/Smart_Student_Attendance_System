import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Material API Tests', () => {
    let adminToken: string;
    let departmentId: string;
    let stageId: string;
    let materialId: string;

    // Setup: Create admin, department, stage before all tests
    beforeAll(async () => {
        // Clean database
        await prisma.material.deleteMany();
        await prisma.stage.deleteMany();
        await prisma.department.deleteMany();
        await prisma.admin.deleteMany();

        // Create admin user
        await prisma.admin.create({
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

    // Recreate department and stage before each test
    beforeEach(async () => {
        // Clean in correct order (materials first due to foreign keys)
        await prisma.material.deleteMany();
        await prisma.stage.deleteMany();
        await prisma.department.deleteMany();

        // Recreate test department
        const dept = await prisma.department.create({
            data: { name: 'Computer Science' }
        });
        departmentId = dept.id.toString();

        // Recreate test stage
        const stage = await prisma.stage.create({
            data: { name: 'First Year', level: 1 }
        });
        stageId = stage.id.toString();
    });

    // Cleanup after all tests
    afterAll(async () => {
        await prisma.material.deleteMany();
        await prisma.stage.deleteMany();
        await prisma.department.deleteMany();
        await prisma.admin.deleteMany();
        await prisma.$disconnect();
    });

    // ==================== GET /api/materials ====================
    describe('GET /api/materials', () => {
        test('returns empty array when no materials exist', async () => {
            const response = await request(app)
                .get('/api/materials')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.materials).toEqual([]);
        });

        test('returns all materials with department and stage info', async () => {
            // Create test materials
            await prisma.material.create({
                data: {
                    name: 'Data Structures',
                    department_id: BigInt(departmentId),
                    stage_id: BigInt(stageId)
                }
            });

            const response = await request(app)
                .get('/api/materials')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.materials).toHaveLength(1);
            expect(response.body.data.materials[0]).toHaveProperty('id');
            expect(response.body.data.materials[0]).toHaveProperty('name');
            expect(response.body.data.materials[0]).toHaveProperty('department');
            expect(response.body.data.materials[0]).toHaveProperty('stage');
        });

        test('materials are sorted alphabetically by name', async () => {
            await prisma.material.create({
                data: {
                    name: 'Calculus',
                    department_id: BigInt(departmentId),
                    stage_id: BigInt(stageId)
                }
            });
            await prisma.material.create({
                data: {
                    name: 'Algorithms',
                    department_id: BigInt(departmentId),
                    stage_id: BigInt(stageId)
                }
            });

            const response = await request(app)
                .get('/api/materials')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const materials = response.body.data.materials;
            expect(materials[0].name).toBe('Algorithms');
            expect(materials[1].name).toBe('Calculus');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .get('/api/materials')
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== POST /api/materials ====================
    describe('POST /api/materials', () => {
        test('creates material with valid data', async () => {
            const materialData = {
                name: 'Data Structures',
                departmentId: departmentId,
                stageId: stageId
            };

            const response = await request(app)
                .post('/api/materials')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(materialData)
                .expect(201);

            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body.data.material).toHaveProperty('id');
            expect(response.body.data.material.name).toBe(materialData.name);
            expect(response.body.data.material.department_id).toBe(departmentId);
            expect(response.body.data.material.stage_id).toBe(stageId);

            // Verify in database
            const dbMaterial = await prisma.material.findFirst({
                where: { name: materialData.name }
            });
            expect(dbMaterial).not.toBeNull();
        });

        test('returns 400 for empty material name', async () => {
            const response = await request(app)
                .post('/api/materials')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: '',
                    departmentId: departmentId,
                    stageId: stageId
                })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('name is required');
        });

        test('returns 400 for missing departmentId', async () => {
            const response = await request(app)
                .post('/api/materials')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Material',
                    stageId: stageId
                })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('Department ID is required');
        });

        test('returns 400 for missing stageId', async () => {
            const response = await request(app)
                .post('/api/materials')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Material',
                    departmentId: departmentId
                })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('Stage ID is required');
        });

        test('returns 404 for non-existent department', async () => {
            const response = await request(app)
                .post('/api/materials')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Material',
                    departmentId: '999999',
                    stageId: stageId
                })
                .expect(404);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('Department not found');
        });

        test('returns 404 for non-existent stage', async () => {
            const response = await request(app)
                .post('/api/materials')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Material',
                    departmentId: departmentId,
                    stageId: '999999'
                })
                .expect(404);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('Stage not found');
        });

        test('returns 400 for duplicate material', async () => {
            // Create first material
            await prisma.material.create({
                data: {
                    name: 'Data Structures',
                    department_id: BigInt(departmentId),
                    stage_id: BigInt(stageId)
                }
            });

            // Try to create duplicate
            const response = await request(app)
                .post('/api/materials')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Data Structures',
                    departmentId: departmentId,
                    stageId: stageId
                })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('already exists');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .post('/api/materials')
                .send({
                    name: 'Test Material',
                    departmentId: departmentId,
                    stageId: stageId
                })
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== PUT /api/materials/:id ====================
    describe('PUT /api/materials/:id', () => {
        beforeEach(async () => {
            const material = await prisma.material.create({
                data: {
                    name: 'Original Name',
                    department_id: BigInt(departmentId),
                    stage_id: BigInt(stageId)
                }
            });
            materialId = material.id.toString();
        });

        test('updates material with valid data', async () => {
            const updatedData = {
                name: 'Updated Name'
            };

            const response = await request(app)
                .put(`/api/materials/${materialId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatedData)
                .expect(200);

            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body.data.material.name).toBe(updatedData.name);

            // Verify in database
            const dbMaterial = await prisma.material.findUnique({
                where: { id: BigInt(materialId) }
            });
            expect(dbMaterial?.name).toBe(updatedData.name);
        });

        test('updates material with new department and stage', async () => {
            // Create new department and stage
            const newDept = await prisma.department.create({
                data: { name: 'Mathematics' }
            });
            const newStage = await prisma.stage.create({
                data: { name: 'Second Year', level: 2 }
            });

            const response = await request(app)
                .put(`/api/materials/${materialId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Updated Material',
                    departmentId: newDept.id.toString(),
                    stageId: newStage.id.toString()
                })
                .expect(200);

            expect(response.body.data.material.department_id).toBe(newDept.id.toString());
            expect(response.body.data.material.stage_id).toBe(newStage.id.toString());
        });

        test('returns 404 for non-existent material', async () => {
            const response = await request(app)
                .put('/api/materials/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Updated Name' })
                .expect(404);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('Material not found');
        });

        test('returns 400 for empty name', async () => {
            const response = await request(app)
                .put(`/api/materials/${materialId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: '' })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
        });

        test('returns 404 for non-existent department in update', async () => {
            const response = await request(app)
                .put(`/api/materials/${materialId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Updated',
                    departmentId: '999999'
                })
                .expect(404);

            expect(response.body.message).toContain('Department not found');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .put(`/api/materials/${materialId}`)
                .send({ name: 'Updated Name' })
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== DELETE /api/materials/:id ====================
    describe('DELETE /api/materials/:id', () => {
        beforeEach(async () => {
            const material = await prisma.material.create({
                data: {
                    name: 'To Be Deleted',
                    department_id: BigInt(departmentId),
                    stage_id: BigInt(stageId)
                }
            });
            materialId = material.id.toString();
        });

        test('deletes existing material', async () => {
            const response = await request(app)
                .delete(`/api/materials/${materialId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body.data).toHaveProperty('material');

            // Verify deletion
            const dbMaterial = await prisma.material.findUnique({
                where: { id: BigInt(materialId) }
            });
            expect(dbMaterial).toBeNull();
        });

        test('returns 404 for non-existent material', async () => {
            const response = await request(app)
                .delete('/api/materials/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('Material not found');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .delete(`/api/materials/${materialId}`)
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== GET /api/materials/department/:departmentId ====================
    describe('GET /api/materials/department/:departmentId', () => {
        test('returns materials for specific department', async () => {
            // Create materials for this department
            await prisma.material.create({
                data: {
                    name: 'Material 1',
                    department_id: BigInt(departmentId),
                    stage_id: BigInt(stageId)
                }
            });
            await prisma.material.create({
                data: {
                    name: 'Material 2',
                    department_id: BigInt(departmentId),
                    stage_id: BigInt(stageId)
                }
            });

            const response = await request(app)
                .get(`/api/materials/department/${departmentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.materials).toHaveLength(2);
            expect(response.body.data.materials[0]).toHaveProperty('stage');
        });

        test('returns empty array for department with no materials', async () => {
            const newDept = await prisma.department.create({
                data: { name: 'Empty Department' }
            });

            const response = await request(app)
                .get(`/api/materials/department/${newDept.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.materials).toEqual([]);
        });

        test('returns 404 for non-existent department', async () => {
            const response = await request(app)
                .get('/api/materials/department/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.message).toContain('Department not found');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .get(`/api/materials/department/${departmentId}`)
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== GET /api/materials/stage/:stageId ====================
    describe('GET /api/materials/stage/:stageId', () => {
        test('returns materials for specific stage', async () => {
            await prisma.material.create({
                data: {
                    name: 'Stage Material 1',
                    department_id: BigInt(departmentId),
                    stage_id: BigInt(stageId)
                }
            });

            const response = await request(app)
                .get(`/api/materials/stage/${stageId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.materials).toHaveLength(1);
            expect(response.body.data.materials[0]).toHaveProperty('department');
        });

        test('returns empty array for stage with no materials', async () => {
            const newStage = await prisma.stage.create({
                data: { name: 'Empty Stage', level: 5 }
            });

            const response = await request(app)
                .get(`/api/materials/stage/${newStage.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.materials).toEqual([]);
        });

        test('returns 404 for non-existent stage', async () => {
            const response = await request(app)
                .get('/api/materials/stage/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.message).toContain('Stage not found');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .get(`/api/materials/stage/${stageId}`)
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });
});
