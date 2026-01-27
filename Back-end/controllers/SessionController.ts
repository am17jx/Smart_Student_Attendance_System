import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import crypto from "crypto";
import AppError from "../utils/AppError";

export const createSession = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { materialId, teacherId, geofenceId } = req.body;

    // Validate required fields
    if (!materialId || !teacherId || !geofenceId) {
        return next(new AppError('Missing required fields', 400));
    }

    // Check if material exists
    const material = await prisma.material.findUnique({
        where: { id: BigInt(materialId) }
    });
    if (!material) {
        return next(new AppError('Material not found', 404));
    }

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
        where: { id: BigInt(teacherId) }
    });
    if (!teacher) {
        return next(new AppError('Teacher not found', 404));
    }

    // Check if geofence exists
    const geofence = await prisma.geofence.findUnique({
        where: { id: BigInt(geofenceId) }
    });
    if (!geofence) {
        return next(new AppError('Geofence not found', 404));
    }



    const session = await prisma.session.create({
        data: {
            material_id: BigInt(materialId),
            teacher_id: BigInt(teacherId),
            geofence_id: BigInt(geofenceId),
            qr_secret: crypto.randomInt(100000, 999999).toString(),
            expires_at: new Date(Date.now() + 60 * 60 * 1000),
        },
    })
    res.status(201).json({
        status: "success",
        data: {
            session: {
                ...session,
                id: session.id.toString(),
                material_id: session.material_id.toString(),
                teacher_id: session.teacher_id.toString(),
                geofence_id: session.geofence_id.toString()
            },
        },
    })


})

export const getSessionById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const session = await prisma.session.findUnique({ where: { id: BigInt(id) } })
    if (!session) {
        throw new AppError("Session not found", 404)
    }
    res.status(200).json({
        status: "success",
        data: {
            session: {
                ...session,
                id: session.id.toString(),
                material_id: session.material_id.toString(),
                teacher_id: session.teacher_id.toString(),
                geofence_id: session.geofence_id.toString()
            },
        },
    })
})

export const endSession = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Check if session exists first
    const existing = await prisma.session.findUnique({
        where: { id: BigInt(id) }
    });

    if (!existing) {
        return next(new AppError('Session not found', 404));
    }

    const session = await prisma.session.update({
        where: { id: BigInt(id) },
        data: { is_active: false }
    });

    res.status(200).json({
        status: "success",
        data: {
            session: {
                ...session,
                id: session.id.toString(),
                material_id: session.material_id.toString(),
                teacher_id: session.teacher_id.toString(),
                geofence_id: session.geofence_id.toString()
            },
        },
    });
});

export const getAllSessions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const sessions = await prisma.session.findMany()
    const safeSessions = sessions.map(s => ({
        ...s,
        id: s.id.toString(),
        material_id: s.material_id.toString(),
        teacher_id: s.teacher_id.toString(),
        geofence_id: s.geofence_id.toString()
    }))
    res.status(200).json({
        status: "success",
        data: {
            sessions: safeSessions,
        },
    })
})


export const updateSession = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { materialId, geofenceId } = req.body;

    // Check if session exists first
    const existing = await prisma.session.findUnique({
        where: { id: BigInt(id) }
    });

    if (!existing) {
        return next(new AppError('Session not found', 404));
    }

    // Build update data with proper field names and types
    const updateData: any = {};
    if (materialId) {
        updateData.material_id = BigInt(materialId);
    }
    if (geofenceId) {
        updateData.geofence_id = BigInt(geofenceId);
    }

    const session = await prisma.session.update({
        where: { id: BigInt(id) },
        data: updateData
    });

    res.status(200).json({
        status: "success",
        data: {
            session: {
                ...session,
                id: session.id.toString(),
                material_id: session.material_id.toString(),
                teacher_id: session.teacher_id.toString(),
                geofence_id: session.geofence_id.toString()
            },
        },
    });
});
