import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Clear all data from the database
 */
export async function clearDatabase() {
    await prisma.failedAttempt.deleteMany();
    await prisma.attendanceRecord.deleteMany();
    await prisma.qRToken.deleteMany();
    await prisma.session.deleteMany();
    await prisma.student.deleteMany();
    await prisma.teacher.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.stage.deleteMany();
    await prisma.department.deleteMany();
}

/**
 * Create a test admin user
 */
export async function createTestAdmin(data?: { email?: string; password?: string; name?: string }) {
    const hashedPassword = await bcrypt.hash(data?.password || 'admin123', 10);

    // Generate unique email if not provided
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const uniqueEmail = data?.email || `admin${randomSuffix}@test.com`;

    return await prisma.admin.create({
        data: {
            name: data?.name || 'Test Admin',
            email: uniqueEmail,
            password: hashedPassword,
        },
    });
}

/**
 * Create a test department
 * 🎓 LESSON: نضيف رقم عشوائي للاسم لتجنب مشكلة Unique Constraint
 */
export async function createTestDepartment(data?: { name?: string }) {
    const randomSuffix = Math.floor(Math.random() * 1000000); // رقم عشوائي من 0 إلى 999999
    const uniqueName = data?.name || `Computer Science ${randomSuffix}`;

    return await prisma.department.create({
        data: {
            name: uniqueName,
        },
    });
}

/**
 * Create a test stage
 */
export async function createTestStage(data?: { name?: string }) {
    return await prisma.stage.create({
        data: {
            name: data?.name || 'Stage 1',
            level: Math.floor(Math.random() * 1000) + 1, // Random level to avoid unique constraint
        },
    });
}

/**
 * Create a test teacher user
 */
export async function createTestTeacher(data?: {
    email?: string;
    password?: string;
    name?: string;
    departmentId?: bigint;
}) {
    const hashedPassword = await bcrypt.hash(data?.password || 'teacher123', 10);
    const department = data?.departmentId
        ? await prisma.department.findUnique({ where: { id: data.departmentId } })
        : await createTestDepartment();

    // Generate unique email if not provided
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const uniqueEmail = data?.email || `teacher${randomSuffix}@test.com`;

    return await prisma.teacher.create({
        data: {
            name: data?.name || 'Test Teacher',
            email: uniqueEmail,
            password: hashedPassword,
            department_id: department!.id,
        },
    });
}

/**
 * Create a test student user
 */
export async function createTestStudent(data?: {
    email?: string;
    password?: string;
    name?: string;
    studentId?: string;
    departmentId?: bigint;
    stageId?: bigint;
    fingerprintHash?: string;
    mustChangePassword?: boolean;
}) {
    const hashedPassword = await bcrypt.hash(data?.password || 'student123', 10);
    const department = data?.departmentId
        ? await prisma.department.findUnique({ where: { id: data.departmentId } })
        : await createTestDepartment();

    const stage = data?.stageId
        ? await prisma.stage.findUnique({ where: { id: data.stageId } })
        : await createTestStage();

    // 🎓 LESSON: نضيف رقم عشوائي لـ student_id لتجنب Unique Constraint
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const uniqueStudentId = data?.studentId || `STU${randomSuffix}`;
    const uniqueEmail = data?.email || `student${randomSuffix}@test.com`;

    return await prisma.student.create({
        data: {
            name: data?.name || 'Test Student',
            email: uniqueEmail,
            student_id: uniqueStudentId,
            password: hashedPassword,
            department_id: department!.id,
            stage_id: stage!.id,
            fingerprint_hash: data?.fingerprintHash || null,
            must_change_password: data?.mustChangePassword ?? false,
        },
    });
}

/**
 * Generate JWT token for testing
 */
export function generateAuthToken(payload: { id: string; email: string; role: string }) {
    return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });
}

/**
 * Generate a test fingerprint hash
 */
export function generateFingerprint(seed?: string): string {
    const data = seed || Math.random().toString();
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Hash a fingerprint (same as in AuthController)
 */
export function hashFingerprint(fingerprint: string): string {
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

export { prisma };
