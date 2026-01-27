import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import catchAsync from "./catchAsync";

// Utility function for logging failed attempts (no response sent)
export async function logFailedAttemptUtil(data: {
    errorType: string;
    errorMessage: string;
    studentId?: string | null;
    sessionId?: string | null;
    fingerprintHash?: string | null;
    deviceInfo?: string;
    ipAddress?: string;
}): Promise<void> {
    try {
        await prisma.failedAttempt.create({
            data: {
                error_type: data.errorType,
                error_message: data.errorMessage,
                student_id: data.studentId ? BigInt(data.studentId) : null,
                session_id: data.sessionId ? BigInt(data.sessionId) : null,
                fingerprint_hash: data.fingerprintHash || null,
                device_info: data.deviceInfo || "Unknown",
                ip_address: data.ipAddress || "Unknown",
            },
        });
    } catch (error) {
        console.error("[ERROR] Failed to log failed attempt:", error);
        // Don't throw - we don't want logging failures to break the main flow
    }
}

// Route handler for logging failed attempts via API
export const logFailedAttempt = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { errorType, errorMessage, studentId, sessionId, fingerprintHash, deviceInfo, ipAddress } = req.body;

    await logFailedAttemptUtil({
        errorType,
        errorMessage,
        studentId,
        sessionId,
        fingerprintHash,
        deviceInfo,
        ipAddress,
    });

    res.status(200).json({
        status: "success",
        message: "Failed attempt logged",
    });
});