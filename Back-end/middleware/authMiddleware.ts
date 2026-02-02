import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";
import { hashFingerprint } from "../controllers/AuthController"
import logger from "../utils/logger";

dotenv.config();


export const authMiddleware = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        throw new AppError("No token provided", 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; email: string; role: string };
        req.user = decoded;
        next();
    } catch (err) {
        throw new AppError("Invalid or expired token", 401);
    }
});


export const studentAuthMiddleware = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        throw new AppError("No token provided", 401);
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

        if (decoded.role !== "student") {
            throw new AppError("Access denied: Student role required", 403);
        }

        const student = await prisma.student.findUnique({
            where: { id: BigInt(decoded.id) },
        });

        if (!student) {
            throw new AppError("Student not found", 404);
        }

        req.user = decoded;
        req.student = student;
        next();
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Invalid or expired token", 401);
    }
});


export const adminAuthMiddleware = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        throw new AppError("No token provided", 401);
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

        if (decoded.role !== "admin") {
            throw new AppError("Access denied: Admin role required", 403);
        }

        logger.debug('[authMiddleware] Decoded JWT', {
            id: decoded.id,
            email: decoded.email
        });

        // Fetch full admin data from database to get department_id
        const admin = await prisma.admin.findUnique({
            where: { id: BigInt(decoded.id) },
            select: {
                id: true,
                name: true,
                email: true,
                department_id: true
            }
        });

        logger.debug('[authMiddleware] Fetched admin from DB', {
            id: admin?.id?.toString(),
            email: admin?.email,
            department_id: admin?.department_id?.toString() || 'NULL/undefined'
        });

        if (!admin) {
            throw new AppError("Admin not found", 404);
        }

        // Set req.user with full admin data
        req.user = {
            id: admin.id,
            email: admin.email,
            department_id: admin.department_id
        } as any;
        req.admin = admin as any;

        logger.debug('[authMiddleware] Set req.user', {
            id: (req.user as any).id?.toString(),
            department_id: (req.user as any).department_id?.toString() || 'NULL/undefined'
        });

        next();
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Invalid or expired token", 401);
    }
});


export const teacherAuthMiddleware = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        throw new AppError("No token provided", 401);
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

        if (decoded.role !== "teacher") {
            throw new AppError("Access denied: Teacher role required", 403);
        }

        logger.debug(`Looking for teacher`, { id: decoded.id, type: typeof decoded.id });

        const teacher = await prisma.teacher.findUnique({
            where: { id: BigInt(decoded.id) },
        });

        logger.debug(`Teacher found: ${teacher ? 'YES' : 'NO'}`);

        if (!teacher) {
            throw new AppError("Teacher not found", 404);
        }

        req.user = decoded;
        req.teacher = teacher;
        next();
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Invalid or expired token", 401);
    }
});

export const studentFingerprintMiddleware = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role === "student") {
        const fingerprint = req.headers["x-fingerprint"] as string;

        if (!fingerprint) {
            throw new AppError("Fingerprint required", 400);
        }

        const hashed = hashFingerprint(fingerprint);

        if (!req.student) {
            throw new AppError("Student authentication required", 401);
        }

        if (req.student.fingerprint_hash !== hashed) {
            throw new AppError("Device verification failed", 403);
        }
    }
    next();
});