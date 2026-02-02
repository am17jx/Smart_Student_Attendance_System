import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import crypto from "crypto";
import AppError from "../utils/AppError";
import logger from "../utils/logger";
import absenceWarningService from "../utils/absenceWarningService";

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
            material_id: BigInt(materialId as string),
            teacher_id: BigInt(teacherId as string),
            geofence_id: BigInt(geofenceId as string),
            qr_secret: crypto.randomInt(100000, 999999).toString(),
            expires_at: new Date(Date.now() + 5 * 60 * 1000),
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

    const session = await prisma.session.findUnique({
        where: { id: BigInt(id as string) },
        include: {
            material: {
                include: {
                    department: true,
                    stage: true
                }
            },
            teacher: {
                include: {
                    department: true
                }
            },
            geofence: true
        }
    });

    if (!session) {
        throw new AppError("Session not found", 404);
    }

    // Serialize BigInt values
    const serializedSession = {
        ...session,
        id: session.id.toString(),
        material_id: session.material_id.toString(),
        teacher_id: session.teacher_id.toString(),
        geofence_id: session.geofence_id.toString(),
        material: session.material ? {
            ...session.material,
            id: session.material.id.toString(),
            department_id: session.material.department_id.toString(),
            stage_id: session.material.stage_id.toString(),
            department: session.material.department ? {
                ...session.material.department,
                id: session.material.department.id.toString()
            } : undefined,
            stage: session.material.stage ? {
                ...session.material.stage,
                id: session.material.stage.id.toString()
            } : undefined
        } : undefined,
        teacher: session.teacher ? {
            ...session.teacher,
            id: session.teacher.id.toString(),
            department_id: session.teacher.department_id?.toString(),
            department: session.teacher.department ? {
                ...session.teacher.department,
                id: session.teacher.department.id.toString()
            } : undefined
        } : undefined,
        geofence: session.geofence ? {
            ...session.geofence,
            id: session.geofence.id.toString()
        } : undefined
    };

    res.status(200).json({
        status: "success",
        data: {
            session: serializedSession
        },
    });
})

export const endSession = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const sessionId = BigInt(id as string);

    // 1. Get session with material details to know the target students
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            material: true
        }
    });

    if (!session) {
        return next(new AppError('Session not found', 404));
    }

    // 2. Mark session as inactive
    const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: { is_active: false }
    });

    // 3. Automatic Absence Marking
    // Get all students supposed to be in this session (same department & stage)
    const allStudents = await prisma.student.findMany({
        where: {
            department_id: session.material.department_id,
            stage_id: session.material.stage_id
        },
        select: { id: true }
    });

    // Get students who already marked attendance
    const presentRecords = await prisma.attendanceRecord.findMany({
        where: {
            session_id: sessionId
        },
        select: { student_id: true }
    });

    const presentStudentIds = new Set(presentRecords.map(r => r.student_id));

    // Identify absent students
    const absentStudents = allStudents.filter(s => !presentStudentIds.has(s.id));

    logger.info(`📊 Ending Session ${sessionId}: Found ${absentStudents.length} absent students to mark.`);

    // Bulk create absence records
    if (absentStudents.length > 0) {
        await prisma.attendanceRecord.createMany({
            data: absentStudents.map(s => ({
                session_id: sessionId,
                student_id: s.id,
                status: 'ABSENT', // Using string literal if enum import is tricky, or ensure generic compatibility
                marked_at: new Date(),
                marked_by: 'system_auto'
            })),
            skipDuplicates: true
        });

        // Get material_id from session for warning checks
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            select: { material_id: true }
        });

        if (session) {
            // Check and send warnings for each absent student (async, don't block response)
            absentStudents.forEach(student => {
                absenceWarningService.checkAndSendWarning(student.id, session.material_id)
                    .catch(err => logger.error(`Warning check failed for student ${student.id}: ${err}`));
            });
        }
    }

    res.status(200).json({
        status: "success",
        data: {
            session: {
                ...updatedSession,
                id: updatedSession.id.toString(),
                material_id: updatedSession.material_id.toString(),
                teacher_id: updatedSession.teacher_id.toString(),
                geofence_id: updatedSession.geofence_id.toString(),
                marked_absent_count: absentStudents.length
            }
        }
    });
});

// ... existing code ...
export const getTeacherSessions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // req.user is populated by teacherAuthMiddleware
    const teacherId = req.user?.id;

    if (!teacherId) {
        throw new AppError("Teacher ID not found in request", 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || "";
    const skip = (page - 1) * limit;

    const where: any = {
        teacher_id: BigInt(teacherId)
    };

    if (search) {
        where.OR = [
            { material: { name: { contains: search } } },
            { geofence: { name: { contains: search } } }
        ];
    }

    const [total, sessions] = await Promise.all([
        prisma.session.count({ where }),
        prisma.session.findMany({
            where,
            include: {
                material: true,
                teacher: true,
                geofence: true
            },
            orderBy: {
                created_at: 'desc'
            },
            skip,
            take: limit
        })
    ]);

    const safeSessions = sessions.map(s => ({
        ...s,
        id: s.id.toString(),
        material_id: s.material_id.toString(),
        teacher_id: s.teacher_id.toString(),
        geofence_id: s.geofence_id.toString(),
        material: s.material ? { ...s.material, id: s.material.id.toString() } : undefined,
        teacher: s.teacher ? { ...s.teacher, id: s.teacher.id.toString(), department_id: s.teacher.department_id?.toString() } : undefined,
        geofence: s.geofence ? { ...s.geofence, id: s.geofence.id.toString() } : undefined
    }));

    res.status(200).json({
        status: "success",
        data: {
            sessions: safeSessions,
            meta: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        },
    });
});

export const getAllSessions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // ... existing code ...
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || "";
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
        where.OR = [
            { material: { name: { contains: search } } }, // Removed mode: 'insensitive' as detailed in previous issues often causing db specific errors if not configured, keeping simple for now or assuming default collation
            { teacher: { name: { contains: search } } },
            { geofence: { name: { contains: search } } }
        ];
    }

    const [total, sessions] = await Promise.all([
        prisma.session.count({ where }),
        prisma.session.findMany({
            where,
            include: {
                material: true,
                teacher: true,
                geofence: true
            },
            orderBy: {
                created_at: 'desc'
            },
            skip,
            take: limit
        })
    ]);

    const safeSessions = sessions.map(s => ({
        ...s,
        id: s.id.toString(),
        material_id: s.material_id.toString(),
        teacher_id: s.teacher_id.toString(),
        geofence_id: s.geofence_id.toString(),
        material: s.material ? { ...s.material, id: s.material.id.toString() } : undefined,
        teacher: s.teacher ? { ...s.teacher, id: s.teacher.id.toString(), department_id: s.teacher.department_id?.toString() } : undefined,
        geofence: s.geofence ? { ...s.geofence, id: s.geofence.id.toString() } : undefined
    }));

    res.status(200).json({
        status: "success",
        data: {
            sessions: safeSessions,
            meta: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        },
    });
})


export const updateSession = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { materialId, geofenceId } = req.body;

    // Check if session exists first
    const existing = await prisma.session.findUnique({
        where: { id: BigInt(id as string) }
    });

    if (!existing) {
        return next(new AppError('Session not found', 404));
    }

    // Build update data with proper field names and types
    const updateData: any = {};
    if (materialId) {
        updateData.material_id = BigInt(materialId as string);
    }
    if (geofenceId) {
        updateData.geofence_id = BigInt(geofenceId as string);
    }

    const session = await prisma.session.update({
        where: { id: BigInt(id as string) },
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
