import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";
import { prisma } from "../prisma/client";
import { NextFunction } from "express";
import { calculateDistance } from "../utils/geofenceUtil";
import { logFailedAttemptUtil } from "../utils/FailedAttemptUtill";
import { Request, Response } from "express";


export const checkGeofence = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        // ✅ Skip geofence check for teachers and admins - only check students
        if (req.user?.role === "teacher" || req.user?.role === "admin") {
            console.log(`[GEOFENCE] Skipping check for ${req.user.role}: ${req.user.email}`);
            return next();
        }

        // Only students need location verification
        const { sessionId, latitude, longitude } = req.body;

        // Validate that location is provided for students
        if (!latitude || !longitude) {
            throw new AppError("Location is required for students", 400);
        }

        // 1. Get the session
        const session = await prisma.session.findUnique({
            where: { id: BigInt(sessionId) },
            include: { geofence: true },
        });

        if (!session || !session.geofence) {
            throw new AppError("Geofence not configured for this session", 400);
        }

        // 2. Calculate the distance
        const distance = calculateDistance(
            latitude,
            longitude,
            Number(session.geofence.latitude),
            Number(session.geofence.longitude)
        );

        // 3. Check if inside the bounds
        if (distance > Number(session.geofence.radius_meters)) {
            // Log failed attempt
            await logFailedAttemptUtil({
                errorType: "GEOFENCE_VIOLATION",
                errorMessage: `Student outside geofence. Distance: ${distance.toFixed(2)}m`,
                studentId: req.user?.id || null,
                sessionId: sessionId,
                deviceInfo: req.headers["user-agent"] || "Unknown",
                ipAddress: req.ip || "Unknown",
            });

            throw new AppError(
                `You are outside the allowed area. Distance: ${distance.toFixed(0)}m`,
                403
            );
        }

        console.log(`[GEOFENCE] Student verified inside bounds. Distance: ${distance.toFixed(2)}m`);

        // ✅ Inside the bounds - Continue
        next();
    }
);