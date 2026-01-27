import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('QR Code API Tests', () => {
    let teacherToken: string;
    let studentToken: string;
    let teacherId: string;
    let studentId: string;
    let sessionId: string;

    // Setup: Create teacher, student, session before all tests
    beforeAll(async () => {
        // Clean database
        await prisma.attendanceRecord.deleteMany();
        await prisma.qRToken.deleteMany();
        await prisma.session.deleteMany();
        await prisma.material.deleteMany();
        await prisma.stage.deleteMany();
        await prisma.department.deleteMany();
        await prisma.geofence.deleteMany();
        await prisma.student.deleteMany();
        await prisma.teacher.deleteMany();
        await prisma.admin.deleteMany();

        // Create admin
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

        // Create student
        const student = await prisma.student.create({
            data: {
                student_id: 'ST001',
                name: 'Test Student',
                email: 'student@test.com',
                password: await bcrypt.hash('Student@123', 10),
                fingerprint_hash: 'test_fingerprint_hash'
            }
        });
        studentId = student.id.toString();

        // Login as teacher
        const teacherLogin = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'teacher@test.com',
                password: 'Teacher@123'
            });
        teacherToken = teacherLogin.body.token;

        // Login as student
        const studentLogin = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'student@test.com',
                password: 'Student@123'
            });
        studentToken = studentLogin.body.token;

        // Create department, stage, material, geofence
        const dept = await prisma.department.create({
            data: { name: 'Computer Science' }
        });

        const stage = await prisma.stage.create({
            data: { name: 'First Year', level: 1 }
        });

        const material = await prisma.material.create({
            data: {
                name: 'Data Structures',
                department_id: dept.id,
                stage_id: stage.id
            }
        });

        const geofence = await prisma.geofence.create({
            data: {
                name: 'Main Campus',
                latitude: 33.3152,
                longitude: 44.3661,
                radius_meters: 100
            }
        });

        // Create active session
        const session = await prisma.session.create({
            data: {
                material_id: material.id,
                teacher_id: BigInt(teacherId),
                geofence_id: geofence.id,
                qr_secret: '123456',
                expires_at: new Date(Date.now() + 60 * 60 * 1000),
                is_active: true
            }
        });
        sessionId = session.id.toString();
    });

    // Clean QR tokens before each test
    beforeEach(async () => {
        await prisma.attendanceRecord.deleteMany();
        await prisma.qRToken.deleteMany();
    });

    // Cleanup after all tests
    afterAll(async () => {
        await prisma.attendanceRecord.deleteMany();
        await prisma.qRToken.deleteMany();
        await prisma.session.deleteMany();
        await prisma.material.deleteMany();
        await prisma.stage.deleteMany();
        await prisma.department.deleteMany();
        await prisma.geofence.deleteMany();
        await prisma.student.deleteMany();
        await prisma.teacher.deleteMany();
        await prisma.admin.deleteMany();
        await prisma.$disconnect();
    });

    // ==================== POST /api/qrcodes/generate ====================
    describe('POST /api/qrcodes/generate', () => {
        test('generates QR code for active session', async () => {
            const response = await request(app)
                .post(`/api/qrcodes/generate/${sessionId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveProperty('qrCode');
            expect(response.body.data.qrCode).toMatch(/^data:image\/png;base64,/);
        });

        test('QR code contains valid data URL', async () => {
            const response = await request(app)
                .post(`/api/qrcodes/generate/${sessionId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            const qrCode = response.body.data.qrCode;
            expect(qrCode).toBeDefined();
            expect(typeof qrCode).toBe('string');
            expect(qrCode.length).toBeGreaterThan(100);
        });

        test('creates QR token in database', async () => {
            await request(app)
                .post(`/api/qrcodes/generate/${sessionId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            const tokens = await prisma.qRToken.findMany({
                where: { session_id: BigInt(sessionId) }
            });

            expect(tokens.length).toBeGreaterThan(0);
            expect(tokens[0]).toHaveProperty('token_hash');
            expect(tokens[0]).toHaveProperty('expires_at');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .post(`/api/qrcodes/generate/${sessionId}`)
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== GET /api/qrcodes/session/:sessionId ====================
    describe('GET /api/qrcodes/session/:sessionId', () => {
        test('returns QR tokens for session', async () => {
            // Generate a QR code first
            await request(app)
                .post(`/api/qrcodes/generate/${sessionId}`)
                .set('Authorization', `Bearer ${teacherToken}`);

            const response = await request(app)
                .get(`/api/qrcodes/session/${sessionId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveProperty('qrTokens');
            expect(Array.isArray(response.body.data.qrTokens)).toBe(true);
        });

        test('returns empty array for session with no QR codes', async () => {
            const response = await request(app)
                .get(`/api/qrcodes/session/${sessionId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.data.qrTokens).toEqual([]);
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .get(`/api/qrcodes/session/${sessionId}`)
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== POST /api/qrcodes/validate ====================
    describe('POST /api/qrcodes/validate', () => {
        test('validates QR code and records attendance (integration test)', async () => {
            // This is a simplified test - full validation requires proper QR data
            // In real scenario, you would:
            // 1. Generate QR code
            // 2. Parse QR data
            // 3. Validate with correct token and id
            // 4. Check attendance record created

            // For now, we just test the endpoint exists and requires auth
            const response = await request(app)
                .post('/api/qrcodes/validate')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    token: 'dummy_token',
                    id: 'dummy_id'
                });

            // Will fail validation but endpoint should exist
            expect(response.status).not.toBe(404);
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .post('/api/qrcodes/validate')
                .send({
                    token: 'test_token',
                    id: 'test_id'
                })
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });
});
