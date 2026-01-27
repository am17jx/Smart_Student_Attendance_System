import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";
import QRCode from "qrcode";
import crypto from "crypto";

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
        where: { id: BigInt(session_id) },
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
            session_id: BigInt(session_id),
            expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
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

export const scanQrAndAttend = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { token, id } = req.body;
    const studentId = req.student?.id;

    if (!studentId) {
        throw new AppError("Student not authenticated", 401);
    }

    // ✅ التحقق من وجود البيانات المطلوبة
    if (!token || !id) {
        throw new AppError("Token and ID are required", 400);
    }

    // ✅ البحث عن token محدد بدلاً من كل الـ tokens
    const qrToken = await prisma.qRToken.findUnique({
        where: { id: BigInt(id) },
        include: { session: true },
    });

    // التحقق من صلاحية الـ token
    if (!qrToken) {
        throw new AppError("Invalid QR code", 400);
    }

    if (qrToken.used_at) {
        throw new AppError("QR code already used", 400);
    }

    if (qrToken.expires_at < new Date()) {
        throw new AppError("QR code expired", 400);
    }

    // ✅ التحقق من الـ hash باستخدام constant-time comparison
    const expectedHash = crypto
        .createHash("sha256")
        .update(token + qrToken.session.qr_secret)
        .digest("hex");

    if (!timingSafeEqual(expectedHash, qrToken.token_hash)) {
        throw new AppError("Invalid QR code", 400);
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
            },
        }),
    ]);

    res.status(200).json({
        status: "success",
        message: "Attendance recorded successfully",
    });
});

//   - [ ] GET /qrcode/session/:sessionId (Get session QRs - Teacher)

export const getSessionQrCodes = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { session_id } = req.params;

    const qrTokens = await prisma.qRToken.findMany({
        where: { session_id: BigInt(session_id) },
    });

    res.status(200).json({
        status: "success",
        data: { qrTokens },
    });
});
