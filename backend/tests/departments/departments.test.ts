import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Department API Tests', () => {
    let adminToken: string;
    let departmentId: string;

    // Setup: Create admin and get token before all tests
    beforeAll(async () => {
        // Clean database
        await prisma.department.deleteMany();
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

    // Clean departments before each test
    beforeEach(async () => {
        await prisma.department.deleteMany();
    });

    // Cleanup after all tests
    afterAll(async () => {
        await prisma.department.deleteMany();
        await prisma.admin.deleteMany();
        await prisma.$disconnect();
    });

    // ==================== GET /api/departments ====================
    describe('GET /api/departments', () => {
        test('returns empty array when no departments exist', async () => {
            const response = await request(app)
                .get('/api/departments')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.departments).toEqual([]);
        });

        test('returns all departments when they exist', async () => {
            // Create test departments
            await prisma.department.create({ data: { name: 'Computer Science' } });
            await prisma.department.create({ data: { name: 'Mathematics' } });

            const response = await request(app)
                .get('/api/departments')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.departments).toHaveLength(2);
            expect(response.body.data.departments[0]).toHaveProperty('id');
            expect(response.body.data.departments[0]).toHaveProperty('name');
            expect(response.body.data.departments[0]).toHaveProperty('created_at');
        });

        test('each department has correct structure', async () => {
            await prisma.department.create({ data: { name: 'Physics' } });

            const response = await request(app)
                .get('/api/departments')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const department = response.body.data.departments[0];
            expect(department).toHaveProperty('id');
            expect(department).toHaveProperty('name');
            expect(department).toHaveProperty('created_at');
            expect(department).toHaveProperty('updated_at');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .get('/api/departments')
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== POST /api/departments ====================
    describe('POST /api/departments', () => {
        test('creates department with valid data', async () => {
            const departmentData = {
                name: 'Computer Science'
            };

            const response = await request(app)
                .post('/api/departments')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(departmentData)
                .expect(201);

            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body.data.department).toHaveProperty('id');
            expect(response.body.data.department.name).toBe(departmentData.name);

            // Verify in database
            const dbDepartment = await prisma.department.findFirst({
                where: { name: departmentData.name }
            });
            expect(dbDepartment).not.toBeNull();
            expect(dbDepartment?.name).toBe(departmentData.name);
        });

        test('returns 400 for empty department name', async () => {
            const response = await request(app)
                .post('/api/departments')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: '' })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
        });

        test('returns 400 for missing name field', async () => {
            const response = await request(app)
                .post('/api/departments')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
        });

        test('returns 400 for duplicate department name', async () => {
            // Create first department
            await prisma.department.create({ data: { name: 'Computer Science' } });

            // Try to create duplicate
            const response = await request(app)
                .post('/api/departments')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Computer Science' })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .post('/api/departments')
                .send({ name: 'New Department' })
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== PUT /api/departments/:id ====================
    describe('PUT /api/departments/:id', () => {
        beforeEach(async () => {
            // Create a department for update tests
            const dept = await prisma.department.create({
                data: { name: 'Original Name' }
            });
            departmentId = dept.id.toString();
        });

        test('updates department with valid data', async () => {
            const updatedData = {
                name: 'Updated Name'
            };

            const response = await request(app)
                .put(`/api/departments/${departmentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatedData)
                .expect(200);

            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body.data.department.name).toBe(updatedData.name);

            // Verify in database
            const dbDepartment = await prisma.department.findUnique({
                where: { id: BigInt(departmentId) }
            });
            expect(dbDepartment?.name).toBe(updatedData.name);
        });

        test('returns 404 for non-existent department', async () => {
            const response = await request(app)
                .put('/api/departments/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Updated Name' })
                .expect(404);

            expect(response.body).toHaveProperty('status', 'fail');
        });

        test('returns 400 for empty name', async () => {
            const response = await request(app)
                .put(`/api/departments/${departmentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: '' })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .put(`/api/departments/${departmentId}`)
                .send({ name: 'Updated Name' })
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== DELETE /api/departments/:id ====================
    describe('DELETE /api/departments/:id', () => {
        beforeEach(async () => {
            // Create a department for delete tests
            const dept = await prisma.department.create({
                data: { name: 'To Be Deleted' }
            });
            departmentId = dept.id.toString();
        });

        test('deletes existing department', async () => {
            const response = await request(app)
                .delete(`/api/departments/${departmentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body.data).toHaveProperty('department');

            // Verify deletion in database
            const dbDepartment = await prisma.department.findUnique({
                where: { id: BigInt(departmentId) }
            });
            expect(dbDepartment).toBeNull();
        });

        test('returns 404 for non-existent department', async () => {
            const response = await request(app)
                .delete('/api/departments/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body).toHaveProperty('status', 'fail');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .delete(`/api/departments/${departmentId}`)
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });

        test('verifies department is actually deleted from database', async () => {
            // Delete the department
            await request(app)
                .delete(`/api/departments/${departmentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            // Try to get it again
            const dbDepartment = await prisma.department.findUnique({
                where: { id: BigInt(departmentId) }
            });

            expect(dbDepartment).toBeNull();

            // Verify count is zero
            const count = await prisma.department.count();
            expect(count).toBe(0);
        });
    });
});
