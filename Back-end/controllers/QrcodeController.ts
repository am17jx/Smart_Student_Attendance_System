import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";
import QRCode from "qrcode";
import crypto from "crypto";
import logger from "../utils/logger";

// Helper: Constant-time comparison
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    return crypto.timingSafeEqual(bufA, bufB);
}

export const generateQrForSession = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { session_id } = req.params;

    const session = await prisma.session.findUnique({
        where: { id: BigInt(session_id as string) },
    });

    if (!session?.is_active) {
        return next(new AppError('Session not found or inactive', 404));
    }

    // Generate unique token
    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken + session.qr_secret)
        .digest("hex");

    // Create QR token (ID will be auto-generated)
    const qrToken = await prisma.qRToken.create({
        data: {
            token_hash: tokenHash,
            session_id: BigInt(session_id as string),
            expires_at: new Date(Date.now() + 90 * 1000), // 90 seconds (30s rotation + 60s buffer for scanning)
        },
    });

    // Send tokenId with rawToken in QR
    const qrData = JSON.stringify({
        token: rawToken,
        id: qrToken.id.toString() // Use the auto-generated ID
    });

    const qrCode = await QRCode.toDataURL(qrData);

    res.status(200).json({
        status: "success",
        data: { qrCode },
    });
});

// Helper: Calculate distance in meters using Haversine formula
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat1)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d * 1000; // Distance in meters
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}

export const scanQrAndAttend = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { token, id, latitude, longitude } = req.body;
    const studentId = req.student?.id;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    logger.info(`🔍 [scanQrAndAttend] Request received:`, {
        hasToken: !!token,
        hasId: !!id,
        hasLocation: !!(latitude && longitude),
        studentId: studentId?.toString(),
        tokenId: id
    });

    if (!studentId) {
        throw new AppError("Student not authenticated", 401);
    }

    // ✅ التحقق من وجود البيانات المطلوبة
    if (!token || !id || !latitude || !longitude) {
        // Log attempt if ID is present but location missing? 
        // For now just throw error.
        throw new AppError("Token, ID, and Location (GPS) are required", 400);
    }

    // ✅ البحث عن token محدد
    const qrToken = await prisma.qRToken.findUnique({
        where: { id: BigInt(id as string) },
        include: {
            session: {
                include: {
                    geofence: true,
                    material: true  // ✅ Added to check student eligibility
                }
            }
        },
    });

    // التحقق من صلاحية الـ token
    if (!qrToken) {
        logger.warn(`❌ [scanQrAndAttend] QR Token not found:`, { tokenId: id });
        await prisma.failedAttempt.create({
            data: {
                student_id: studentId,
                error_type: "INVALID_TOKEN",
                error_message: "Invalid QR Token ID",
                ip_address: typeof ip === 'string' ? ip : undefined,
                device_info: userAgent
            }
        });
        throw new AppError("Invalid QR code", 400);
    }

    logger.info(`✅ [scanQrAndAttend] QR Token found:`, {
        tokenId: qrToken.id.toString(),
        sessionId: qrToken.session_id.toString(),
        expiresAt: qrToken.expires_at,
        usedAt: qrToken.used_at,
        now: new Date()
    });

    // Geofence Validation
    if (qrToken.session.geofence) {
        const distance = getDistanceFromLatLonInMeters(
            parseFloat(latitude),
            parseFloat(longitude),
            qrToken.session.geofence.latitude,
            qrToken.session.geofence.longitude
        );

        logger.info(`📍 [scanQrAndAttend] Geofence check:`, {
            distance: Math.round(distance),
            allowed: qrToken.session.geofence.radius_meters
        });

        if (distance > qrToken.session.geofence.radius_meters) {
            logger.warn(`❌ [scanQrAndAttend] Geofence validation failed`);
            await prisma.failedAttempt.create({
                data: {
                    student_id: studentId,
                    session_id: qrToken.session_id,
                    error_type: "GEOFENCE_ERROR",
                    error_message: `Distance: ${Math.round(distance)}m, Allowed: ${qrToken.session.geofence.radius_meters}m`,
                    ip_address: typeof ip === 'string' ? ip : undefined,
                    device_info: userAgent
                }
            });
            throw new AppError(`You are outside the class range (${Math.round(distance)}m away). Max allowed: ${qrToken.session.geofence.radius_meters}m`, 403);
        }
    }

    if (qrToken.used_at) {
        logger.warn(`❌ [scanQrAndAttend] Token already used at:`, qrToken.used_at);
        await prisma.failedAttempt.create({
            data: {
                student_id: studentId,
                session_id: qrToken.session_id,
                error_type: "DUPLICATE_USAGE",
                error_message: "Token already used",
                ip_address: typeof ip === 'string' ? ip : undefined,
                device_info: userAgent
            }
        });
        throw new AppError("QR code already used", 400);
    }

    if (qrToken.expires_at < new Date()) {
        logger.warn(`❌ [scanQrAndAttend] Token expired:`, {
            expiresAt: qrToken.expires_at,
            now: new Date(),
            diff: (new Date().getTime() - qrToken.expires_at.getTime()) / 1000 + 's'
        });
        await prisma.failedAttempt.create({
            data: {
                student_id: studentId,
                session_id: qrToken.session_id,
                error_type: "EXPIRED_TOKEN",
                error_message: "Token expired",
                ip_address: typeof ip === 'string' ? ip : undefined,
                device_info: userAgent
            }
        });
        throw new AppError("QR code expired", 400);
    }

    // ✅ التحقق من الـ hash باستخدام constant-time comparison
    const expectedHash = crypto
        .createHash("sha256")
        .update(token + qrToken.session.qr_secret)
        .digest("hex");

    logger.info(`🔐 [scanQrAndAttend] Hash validation:`, {
        expectedHashPrefix: expectedHash.substring(0, 10) + '...',
        storedHashPrefix: qrToken.token_hash.substring(0, 10) + '...',
        match: expectedHash === qrToken.token_hash
    });

    if (!timingSafeEqual(expectedHash, qrToken.token_hash)) {
        logger.warn(`❌ [scanQrAndAttend] Hash mismatch!`);
        await prisma.failedAttempt.create({
            data: {
                student_id: studentId,
                session_id: qrToken.session_id,
                error_type: "INVALID_HASH",
                error_message: "Token hash mismatch",
                ip_address: typeof ip === 'string' ? ip : undefined,
                device_info: userAgent
            }
        });
        throw new AppError("Invalid QR code", 400);
    }

    // ✅ التحقق من أن الطالب ينتمي لنفس المرحلة/القسم الذي تنتمي له المادة
    const student = await prisma.student.findUnique({
        where: { id: studentId }
    });

    if (!student) {
        throw new AppError("Student not found", 404);
    }

    const material = qrToken.session.material;

    // التحقق من أن الطالب لديه قسم ومرحلة
    if (!student.department_id || !student.stage_id) {
        logger.error(`❌ [scanQrAndAttend] Student missing department or stage:`, {
            studentId: student.id.toString(),
            hasDept: !!student.department_id,
            hasStage: !!student.stage_id
        });
        throw new AppError("بيانات الطالب غير مكتملة. يرجى التواصل مع الإدارة.", 400);
    }

    logger.info(`👤 [scanQrAndAttend] Student authorization check:`, {
        studentId: student.id.toString(),
        studentDept: student.department_id.toString(),
        studentStage: student.stage_id.toString(),
        materialDept: material.department_id.toString(),
        materialStage: material.stage_id.toString(),
        materialName: material.name
    });

    if (student.department_id !== material.department_id || student.stage_id !== material.stage_id) {
        logger.warn(`❌ [scanQrAndAttend] Unauthorized student attempt:`, {
            studentName: student.name,
            materialName: material.name
        });

        await prisma.failedAttempt.create({
            data: {
                student_id: studentId,
                session_id: qrToken.session_id,
                error_type: "UNAUTHORIZED_STUDENT",
                error_message: `Student stage/department mismatch. Student: ${student.stage_id}/${student.department_id}, Material: ${material.stage_id}/${material.department_id}`,
                ip_address: typeof ip === 'string' ? ip : undefined,
                device_info: userAgent
            }
        });
        throw new AppError("عذراً، أنت غير مسجل في هذه المادة. هذه الجلسة مخصصة لطلاب قسم ومرحلة أخرى.", 403);
    }

    // ✅ تسجيل الحضور في معاملة واحدة (transaction)
    await prisma.$transaction([
        prisma.qRToken.update({
            where: { id: qrToken.id },
            data: {
                used_at: new Date(),
                used_by_student_id: studentId,
            },
        }),
        prisma.attendanceRecord.create({
            data: {
                student_id: studentId,
                session_id: qrToken.session_id,
                token_hash: qrToken.token_hash,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            },
        }),
    ]);

    logger.info(`✅ Attendance recorded: Student ${studentId} in Session ${qrToken.session_id}`);

    res.status(200).json({
        status: "success",
        message: "Attendance recorded successfully",
    });
});

//   - [ ] GET /qrcode/session/:sessionId (Get session QRs - Teacher)

export const getSessionQrCodes = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { session_id } = req.params;

    const qrTokens = await prisma.qRToken.findMany({
        where: { session_id: BigInt(session_id as string) },
    });

    res.status(200).json({
        status: "success",
        data: { qrTokens },
    });
});
