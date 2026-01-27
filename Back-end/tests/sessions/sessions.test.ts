import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Session API Tests', () => {
    let teacherToken: string;
    let teacherId: string;
    let materialId: string;
    let geofenceId: string;
    let sessionId: string;

    // Setup: Create teacher, material, geofence before all tests
    beforeAll(async () => {
        // Clean database
        await prisma.session.deleteMany();
        await prisma.material.deleteMany();
        await prisma.stage.deleteMany();
        await prisma.department.deleteMany();
        await prisma.geofence.deleteMany();
        await prisma.teacher.deleteMany();
        await prisma.admin.deleteMany();

        // Create admin for teacher creation
        await prisma.admin.create({
            data: {
                name: 'Test Admin',
                email: 'admin@test.com',
                password: await bcrypt.hash('Admin@123', 10)
            }
        });

        // Create teacher
        const teacher = await prisma.teacher.create({
            data: {
                name: 'Test Teacher',
                email: 'teacher@test.com',
                password: await bcrypt.hash('Teacher@123', 10)
            }
        });
        teacherId = teacher.id.toString();

        // Login as teacher to get token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'teacher@test.com',
                password: 'Teacher@123'
            });

        teacherToken = loginResponse.body.token;

        console.log('✅ Teacher created with ID:', teacherId);
        console.log('🎫 Teacher token:', teacherToken ? 'EXISTS' : 'MISSING');

        // Verify teacher exists in database
        const verifyTeacher = await prisma.teacher.findUnique({
            where: { id: BigInt(teacherId) }
        });
        console.log('🔍 Teacher verification:', verifyTeacher ? 'FOUND' : 'NOT FOUND');

        // Create department
        const dept = await prisma.department.create({
            data: { name: 'Computer Science' }
        });

        // Create stage
        const stage = await prisma.stage.create({
            data: { name: 'First Year', level: 1 }
        });

        // Create material
        const material = await prisma.material.create({
            data: {
                name: 'Data Structures',
                department_id: dept.id,
                stage_id: stage.id
            }
        });
        materialId = material.id.toString();

        // Create geofence
        const geofence = await prisma.geofence.create({
            data: {
                name: 'Main Campus',
                latitude: 33.3152,
                longitude: 44.3661,
                radius_meters: 100
            }
        });
        geofenceId = geofence.id.toString();
    });

    // Clean sessions before each test
    beforeEach(async () => {
        await prisma.session.deleteMany();
    });

    // Cleanup after all tests
    afterAll(async () => {
        await prisma.session.deleteMany();
        await prisma.material.deleteMany();
        await prisma.stage.deleteMany();
        await prisma.department.deleteMany();
        await prisma.geofence.deleteMany();
        await prisma.teacher.deleteMany();
        await prisma.admin.deleteMany();
        await prisma.$disconnect();
    });

    // ==================== GET /api/sessions ====================
    describe('GET /api/sessions', () => {
        test('returns empty array when no sessions exist', async () => {
            const response = await request(app)
                .get('/api/sessions')
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.sessions).toEqual([]);
        });

        test('returns all sessions when they exist', async () => {
            // Create test sessions
            await prisma.session.create({
                data: {
                    material_id: BigInt(materialId),
                    teacher_id: BigInt(teacherId),
                    geofence_id: BigInt(geofenceId),
                    qr_secret: '123456',
                    expires_at: new Date(Date.now() + 60 * 60 * 1000)
                }
            });

            const response = await request(app)
                .get('/api/sessions')
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.sessions).toHaveLength(1);
            expect(response.body.data.sessions[0]).toHaveProperty('id');
            expect(response.body.data.sessions[0]).toHaveProperty('qr_secret');
            expect(response.body.data.sessions[0]).toHaveProperty('is_active');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .get('/api/sessions')
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== POST /api/sessions ====================
    describe('POST /api/sessions', () => {
        test('creates session with valid data', async () => {
            const sessionData = {
                materialId: materialId,
                teacherId: teacherId,
                geofenceId: geofenceId
            };

            const response = await request(app)
                .post('/api/sessions')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(sessionData)
                .expect(201);

            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body.data.session).toHaveProperty('id');
            expect(response.body.data.session).toHaveProperty('qr_secret');
            expect(response.body.data.session.material_id).toBe(materialId);
            expect(response.body.data.session.teacher_id).toBe(teacherId);
            expect(response.body.data.session.geofence_id).toBe(geofenceId);
            expect(response.body.data.session.is_active).toBe(true);

            // Verify in database
            const dbSession = await prisma.session.findFirst({
                where: { teacher_id: BigInt(teacherId) }
            });
            expect(dbSession).not.toBeNull();
        });

        test('session has QR secret generated', async () => {
            const response = await request(app)
                .post('/api/sessions')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    materialId: materialId,
                    teacherId: teacherId,
                    geofenceId: geofenceId
                })
                .expect(201);

            expect(response.body.data.session.qr_secret).toBeDefined();
            expect(response.body.data.session.qr_secret).toMatch(/^\d{6}$/); // 6 digits
        });

        test('session has expiration time set', async () => {
            const response = await request(app)
                .post('/api/sessions')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    materialId: materialId,
                    teacherId: teacherId,
                    geofenceId: geofenceId
                })
                .expect(201);

            expect(response.body.data.session.expires_at).toBeDefined();
            const expiresAt = new Date(response.body.data.session.expires_at);
            const now = new Date();
            const diff = expiresAt.getTime() - now.getTime();
            expect(diff).toBeGreaterThan(0); // Should be in future
            expect(diff).toBeLessThanOrEqual(60 * 60 * 1000 + 5000); // ~1 hour
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .post('/api/sessions')
                .send({
                    materialId: materialId,
                    teacherId: teacherId,
                    geofenceId: geofenceId
                })
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== GET /api/sessions/:id ====================
    describe('GET /api/sessions/:id', () => {
        beforeEach(async () => {
            const session = await prisma.session.create({
                data: {
                    material_id: BigInt(materialId),
                    teacher_id: BigInt(teacherId),
                    geofence_id: BigInt(geofenceId),
                    qr_secret: '123456',
                    expires_at: new Date(Date.now() + 60 * 60 * 1000)
                }
            });
            sessionId = session.id.toString();
        });

        test('returns session by ID', async () => {
            const response = await request(app)
                .get(`/api/sessions/${sessionId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.session.id).toBe(sessionId);
            expect(response.body.data.session).toHaveProperty('qr_secret');
        });

        test('returns 404 for non-existent session', async () => {
            const response = await request(app)
                .get('/api/sessions/999999')
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(404);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('not found');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .get(`/api/sessions/${sessionId}`)
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== PUT /api/sessions/:id ====================
    describe('PUT /api/sessions/:id', () => {
        beforeEach(async () => {
            const session = await prisma.session.create({
                data: {
                    material_id: BigInt(materialId),
                    teacher_id: BigInt(teacherId),
                    geofence_id: BigInt(geofenceId),
                    qr_secret: '123456',
                    expires_at: new Date(Date.now() + 60 * 60 * 1000)
                }
            });
            sessionId = session.id.toString();
        });

        test('updates session successfully', async () => {
            // Create new geofence for update
            const newGeofence = await prisma.geofence.create({
                data: {
                    name: 'Library',
                    latitude: 33.3160,
                    longitude: 44.3670,
                    radius_meters: 50
                }
            });

            const response = await request(app)
                .put(`/api/sessions/${sessionId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    geofenceId: newGeofence.id.toString()
                })
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.session.geofence_id).toBe(newGeofence.id.toString());
        });

        test('returns 404 for non-existent session', async () => {
            const response = await request(app)
                .put('/api/sessions/999999')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({})
                .expect(404);

            expect(response.body).toHaveProperty('status', 'fail');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .put(`/api/sessions/${sessionId}`)
                .send({})
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== POST /api/sessions/:id/close ====================
    describe('POST /api/sessions/:id/close', () => {
        beforeEach(async () => {
            const session = await prisma.session.create({
                data: {
                    material_id: BigInt(materialId),
                    teacher_id: BigInt(teacherId),
                    geofence_id: BigInt(geofenceId),
                    qr_secret: '123456',
                    expires_at: new Date(Date.now() + 60 * 60 * 1000),
                    is_active: true
                }
            });
            sessionId = session.id.toString();
        });

        test('closes active session', async () => {
            const response = await request(app)
                .post(`/api/sessions/${sessionId}/close`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.session.is_active).toBe(false);

            // Verify in database
            const dbSession = await prisma.session.findUnique({
                where: { id: BigInt(sessionId) }
            });
            expect(dbSession?.is_active).toBe(false);
        });

        test('returns 404 for non-existent session', async () => {
            const response = await request(app)
                .post('/api/sessions/999999/close')
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(404);

            expect(response.body).toHaveProperty('status', 'fail');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .post(`/api/sessions/${sessionId}/close`)
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });
});
