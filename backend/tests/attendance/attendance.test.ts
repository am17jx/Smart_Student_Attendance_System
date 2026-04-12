import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Attendance API Tests', () => {
    let teacherToken: string;
    let teacherId: string;
    let studentId: string;
    let sessionId: string;
    let attendanceId: string;

    // Setup: Create teacher, student, session, and attendance before all tests
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

        // Create attendance record
        const attendance = await prisma.attendanceRecord.create({
            data: {
                student_id: BigInt(studentId),
                session_id: BigInt(sessionId),
                token_hash: 'test_token_hash'
            }
        });
        attendanceId = attendance.id.toString();
    });

    // Clean attendance records before each test (except the one created in beforeAll)
    beforeEach(async () => {
        // Keep the main attendance record, delete others
        await prisma.attendanceRecord.deleteMany({
            where: {
                id: { not: BigInt(attendanceId) }
            }
        });
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

    // ==================== GET /api/attendance/session/:sessionId ====================
    describe('GET /api/attendance/session/:sessionId', () => {
        test('returns attendance records for a session', async () => {
            const response = await request(app)
                .get(`/api/attendance/session/${sessionId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveProperty('records');
            expect(Array.isArray(response.body.data.records)).toBe(true);
            expect(response.body.data.records.length).toBeGreaterThan(0);
        });

        test('returns empty array for session with no attendance', async () => {
            // Create new session without attendance
            const newSession = await prisma.session.create({
                data: {
                    material_id: BigInt((await prisma.material.findFirst())!.id),
                    teacher_id: BigInt(teacherId),
                    geofence_id: BigInt((await prisma.geofence.findFirst())!.id),
                    qr_secret: '654321',
                    expires_at: new Date(Date.now() + 60 * 60 * 1000),
                    is_active: true
                }
            });

            const response = await request(app)
                .get(`/api/attendance/session/${newSession.id.toString()}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.data.records).toEqual([]);
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .get(`/api/attendance/session/${sessionId}`)
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== GET /api/attendance/student/:studentId ====================
    describe('GET /api/attendance/student/:studentId', () => {
        test('returns attendance records for a student', async () => {
            const response = await request(app)
                .get(`/api/attendance/student/${studentId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveProperty('records');
            expect(Array.isArray(response.body.data.records)).toBe(true);
        });

        test('returns empty array for student with no attendance', async () => {
            // Create new student without attendance
            const newStudent = await prisma.student.create({
                data: {
                    student_id: 'ST002',
                    name: 'New Student',
                    email: 'newstudent@test.com',
                    password: await bcrypt.hash('Student@123', 10),
                    fingerprint_hash: 'new_fingerprint_hash'
                }
            });

            const response = await request(app)
                .get(`/api/attendance/student/${newStudent.id.toString()}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.data.records).toEqual([]);
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .get(`/api/attendance/student/${studentId}`)
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== GET /api/attendance/report/:sessionId ====================
    describe('GET /api/attendance/report/:sessionId', () => {
        test('generates attendance report for a session', async () => {
            const response = await request(app)
                .get(`/api/attendance/report/${sessionId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body).toHaveProperty('results');
            expect(response.body.data).toHaveProperty('records');
            expect(Array.isArray(response.body.data.records)).toBe(true);
        });

        test('report includes student information', async () => {
            const response = await request(app)
                .get(`/api/attendance/report/${sessionId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            if (response.body.data.records.length > 0) {
                expect(response.body.data.records[0]).toHaveProperty('student');
                expect(response.body.data.records[0].student).toHaveProperty('name');
            }
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .get(`/api/attendance/report/${sessionId}`)
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== PUT /api/attendance/:id ====================
    describe('PUT /api/attendance/:id', () => {
        test('updates attendance record successfully', async () => {
            const response = await request(app)
                .put(`/api/attendance/${attendanceId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    // Add any updatable fields here
                })
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveProperty('record');
        });

        test('returns 404 for non-existent attendance record', async () => {
            const response = await request(app)
                .put('/api/attendance/999999')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({})
                .expect(404);

            expect(response.body).toHaveProperty('status', 'fail');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .put(`/api/attendance/${attendanceId}`)
                .send({})
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });
});
