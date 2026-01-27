import request from 'supertest';
import app from '../../src/app';
import {
    createTestAdmin,
    createTestTeacher,
    createTestStudent,
    generateAuthToken,
    hashFingerprint,
} from '../helpers/testHelpers';

describe('Authentication API Tests', () => {

    // ============================================
    // LOGIN TESTS
    // ============================================

    describe('POST /api/auth/login', () => {

        it('should login admin successfully', async () => {
            const admin = await createTestAdmin({
                email: 'admin@test.com',
                password: 'admin123',
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'admin123',
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.role).toBe('admin');
            expect(response.body.token).toBeDefined();
        });

        it('should login teacher successfully', async () => {
            const teacher = await createTestTeacher({
                email: 'teacher@test.com',
                password: 'teacher123',
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'teacher@test.com',
                    password: 'teacher123',
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.role).toBe('teacher');
            expect(response.body.token).toBeDefined();
        });

        it('should login student successfully with fingerprint', async () => {
            const fingerprint = 'test-fingerprint-123';
            const student = await createTestStudent({
                email: 'student@test.com',
                password: 'student123',
                fingerprintHash: hashFingerprint(fingerprint),
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'student@test.com',
                    password: 'student123',
                    fingerprint: fingerprint,
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.role).toBe('student');
            expect(response.body.token).toBeDefined();
        });

        it('should save fingerprint on first student login', async () => {
            const student = await createTestStudent({
                password: 'student123',
                fingerprintHash: undefined, // No fingerprint yet
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: student.email,
                    password: 'student123',
                    fingerprint: 'new-fingerprint-456',
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.token).toBeDefined();
        });

        it('should fail with invalid credentials', async () => {
            const admin = await createTestAdmin({
                password: 'admin123',
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: admin.email,
                    password: 'wrongpassword',
                });

            expect(response.status).toBe(401);
            // 🎓 LESSON: في REST APIs، 4xx errors ترجع "fail" (خطأ من المستخدم)
            // و 5xx errors ترجع "error" (خطأ من السيرفر)
            expect(response.body.status).toBe('fail');
        });

        it('should fail with non-existent email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'password123',
                });

            expect(response.status).toBe(401);
            expect(response.body.status).toBe('fail');
        });

        it('should fail with fingerprint mismatch for student', async () => {
            const student = await createTestStudent({
                password: 'student123',
                fingerprintHash: hashFingerprint('original-fingerprint'),
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: student.email,
                    password: 'student123',
                    fingerprint: 'different-fingerprint',
                });

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('different browser or device');
        });

        it('should require password change for new student', async () => {
            const student = await createTestStudent({
                password: 'temp123',
                mustChangePassword: true,
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: student.email,
                    password: 'temp123',
                    fingerprint: 'some-fingerprint',
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('must_change_password');
            expect(response.body.redirect).toBe('/change-password');
        });
    });

    // ============================================
    // TEACHER SIGNUP TESTS (Admin Only)
    // ============================================

    describe('POST /api/auth/admin/signin/teacher', () => {

        it('should create teacher as admin', async () => {
            const admin = await createTestAdmin();
            const token = generateAuthToken({
                id: admin.id.toString(),
                email: admin.email,
                role: 'admin',
            });

            const response = await request(app)
                .post('/api/auth/admin/signin/teacher')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'New Teacher',
                    email: 'newteacher@test.com',
                    departmentId: null,
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.tempPassword).toBeDefined();
            expect(response.body.user.email).toBe('newteacher@test.com');
        });

        it('should fail without admin authentication', async () => {
            const response = await request(app)
                .post('/api/auth/admin/signin/teacher')
                .send({
                    name: 'New Teacher',
                    email: 'newteacher@test.com',
                });

            expect(response.status).toBe(401);
        });

        it('should fail with duplicate email', async () => {
            const admin = await createTestAdmin();
            await createTestTeacher({ email: 'existing@test.com' });

            const token = generateAuthToken({
                id: admin.id.toString(),
                email: admin.email,
                role: 'admin',
            });

            const response = await request(app)
                .post('/api/auth/admin/signin/teacher')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Another Teacher',
                    email: 'existing@test.com',
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('already exists');
        });
    });

    // ============================================
    // STUDENT SIGNUP TESTS (Admin Only)
    // ============================================

    describe('POST /api/auth/admin/signin/student', () => {

        it('should create student as admin', async () => {
            const admin = await createTestAdmin();
            const token = generateAuthToken({
                id: admin.id.toString(),
                email: admin.email,
                role: 'admin',
            });

            const response = await request(app)
                .post('/api/auth/admin/signin/student')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'New Student',
                    email: 'newstudent@test.com',
                    studentId: 'STU999',
                    departmentId: null,
                    stageId: null,
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.tempPassword).toBeDefined();
            expect(response.body.user.email).toBe('newstudent@test.com');
        });

        it('should fail without admin authentication', async () => {
            const response = await request(app)
                .post('/api/auth/admin/signin/student')
                .send({
                    name: 'New Student',
                    email: 'newstudent@test.com',
                    studentId: 'STU999',
                });

            expect(response.status).toBe(401);
        });

        it('should fail with duplicate email', async () => {
            const admin = await createTestAdmin();
            await createTestStudent({ email: 'existing@test.com' });

            const token = generateAuthToken({
                id: admin.id.toString(),
                email: admin.email,
                role: 'admin',
            });

            const response = await request(app)
                .post('/api/auth/admin/signin/student')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Another Student',
                    email: 'existing@test.com',
                    studentId: 'STU888',
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('already exists');
        });

        it('should fail with duplicate student ID', async () => {
            const admin = await createTestAdmin();
            await createTestStudent({ studentId: 'STU001' });

            const token = generateAuthToken({
                id: admin.id.toString(),
                email: admin.email,
                role: 'admin',
            });

            const response = await request(app)
                .post('/api/auth/admin/signin/student')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Another Student',
                    email: 'different@test.com',
                    studentId: 'STU001',
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('already exists');
        });
    });

    // ============================================
    // PASSWORD CHANGE TESTS
    // ============================================

    describe('POST /api/auth/student/change-password/:studentId', () => {

        it('should change student password when authenticated', async () => {
            const student = await createTestStudent({
                password: 'oldpass123',
            });

            const token = generateAuthToken({
                id: student.id.toString(),
                email: student.email,
                role: 'student',
            });

            const response = await request(app)
                .post(`/api/auth/student/change-password/${student.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    oldPassword: 'oldpass123',
                    newPassword: 'newpass456',
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.message).toContain('Password changed successfully');
        });

        it('should fail without authentication', async () => {
            const student = await createTestStudent();

            const response = await request(app)
                .post(`/api/auth/student/change-password/${student.id}`)
                .send({
                    oldPassword: 'oldpass123',
                    newPassword: 'newpass456',
                });

            expect(response.status).toBe(401);
        });

        it('should fail with wrong old password', async () => {
            const student = await createTestStudent({
                password: 'correctpass',
            });

            const token = generateAuthToken({
                id: student.id.toString(),
                email: student.email,
                role: 'student',
            });

            const response = await request(app)
                .post(`/api/auth/student/change-password/${student.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    oldPassword: 'wrongpass',
                    newPassword: 'newpass456',
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toContain('Old password is incorrect');
        });

        it('should fail when changing another user\'s password', async () => {
            const student1 = await createTestStudent({ email: 'student1@test.com' });
            const student2 = await createTestStudent({ email: 'student2@test.com' });

            const token = generateAuthToken({
                id: student1.id.toString(),
                email: student1.email,
                role: 'student',
            });

            const response = await request(app)
                .post(`/api/auth/student/change-password/${student2.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    oldPassword: 'student123',
                    newPassword: 'newpass456',
                });

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('Cannot change another user\'s password');
        });
    });

    describe('POST /api/auth/teacher/change-password/:teacherId', () => {

        it('should change teacher password when authenticated', async () => {
            const teacher = await createTestTeacher({
                password: 'oldpass123',
            });

            const token = generateAuthToken({
                id: teacher.id.toString(),
                email: teacher.email,
                role: 'teacher',
            });

            const response = await request(app)
                .post(`/api/auth/teacher/change-password/${teacher.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    oldPassword: 'oldpass123',
                    newPassword: 'newpass456',
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
        });

        it('should fail without authentication', async () => {
            const teacher = await createTestTeacher();

            const response = await request(app)
                .post(`/api/auth/teacher/change-password/${teacher.id}`)
                .send({
                    oldPassword: 'oldpass123',
                    newPassword: 'newpass456',
                });

            expect(response.status).toBe(401);
        });
    });

    // ============================================
    // PASSWORD RESET TESTS (Admin Only)
    // ============================================

    describe('POST /api/auth/student/reset-password/:studentId', () => {

        it('should reset student password as admin', async () => {
            const admin = await createTestAdmin();
            const student = await createTestStudent();

            const token = generateAuthToken({
                id: admin.id.toString(),
                email: admin.email,
                role: 'admin',
            });

            const response = await request(app)
                .post(`/api/auth/student/reset-password/${student.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send();

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.tempPassword).toBeDefined();
        });

        it('should fail without admin authentication', async () => {
            const student = await createTestStudent();

            const response = await request(app)
                .post(`/api/auth/student/reset-password/${student.id}`)
                .send();

            expect(response.status).toBe(401);
        });

        it('should fail for non-existent student', async () => {
            const admin = await createTestAdmin();

            const token = generateAuthToken({
                id: admin.id.toString(),
                email: admin.email,
                role: 'admin',
            });

            const response = await request(app)
                .post('/api/auth/student/reset-password/999999')
                .set('Authorization', `Bearer ${token}`)
                .send();

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('not found');
        });
    });
});
