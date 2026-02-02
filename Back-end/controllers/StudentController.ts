import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import { getDepartmentFilter, validateDepartmentAccess } from "../utils/accessControl";
import AppError from "../utils/AppError";
import logger from "../utils/logger";


export const getAllStudents = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string || "";
        const departmentId = req.query.departmentId as string;
        const stageId = req.query.stageId as string;
        const skip = (page - 1) * limit;

        // Get admin user from request (set by auth middleware)
        const admin = (req as any).user;

        logger.info(`🔍 [getAllStudents] Received request with params:`, {
            page, limit, search, departmentId, stageId, skip,
            adminId: admin?.id?.toString(),
            adminDeptId: admin?.department_id?.toString() || 'NULL/undefined'
        });

        const where: any = {};

        // Apply department filter based on admin role
        const deptFilter = getDepartmentFilter(admin);
        if (deptFilter) {
            Object.assign(where, deptFilter);
            logger.info(`🔒 [getAllStudents] Applied department filter:`, deptFilter);
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } }
            ];
        }

        // Allow additional department filtering if admin has access
        if (departmentId) {
            const requestedDeptId = BigInt(departmentId);
            // Validate admin has access to requested department
            validateDepartmentAccess(admin, requestedDeptId);
            where.department_id = requestedDeptId;
            logger.info(`🔍 [getAllStudents] Filtering by departmentId: ${departmentId}`);
        }

        if (stageId) {
            where.stage_id = BigInt(stageId);
            logger.info(`🔍 [getAllStudents] Filtering by stageId: ${stageId}`);
        }

        logger.info(`🔍 [getAllStudents] Query where clause:`, JSON.stringify(where, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        const [total, students] = await Promise.all([
            prisma.student.count({ where }),
            prisma.student.findMany({
                where,
                include: {
                    department: true,
                    stage: true
                },
                skip,
                take: limit
            })
        ]);

        logger.info(`✅ [getAllStudents] Found ${total} total students, returning ${students.length} students`);

        if (students.length > 0) {
            logger.info(`📝 [getAllStudents] First student:`, {
                id: students[0].id.toString(),
                name: students[0].name,
                dept_id: students[0].department_id?.toString(),
                stage_id: students[0].stage_id?.toString()
            });
        }

        const safeStudents = students.map(s => ({
            ...s,
            id: s.id.toString(),
            department_id: s.department_id?.toString(),
            stage_id: s.stage_id?.toString(),
            // Convert BigInts to strings if any others exist, usually just ID and FKs
            department: s.department ? {
                ...s.department,
                id: s.department.id.toString()
            } : undefined,
            stage: s.stage ? {
                ...s.stage,
                id: s.stage.id.toString()
            } : undefined,
        }));

        const response = {
            status: "success",
            data: {
                students: safeStudents,
                meta: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            },
        };

        logger.info(`📤 [getAllStudents] Sending response with ${safeStudents.length} students`);
        res.status(200).json(response);
    } catch (error) {
        logger.error('[getAllStudents] Error', { error });
        throw error;
    }
});

export const updateStudent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, email, departmentId, stageId } = req.body;

    const student = await prisma.student.update({
        where: { id: BigInt(id as string) },
        data: {
            name,
            email,
            department_id: departmentId ? BigInt(departmentId as string) : undefined,
            stage_id: stageId ? BigInt(stageId as string) : undefined
        },
        include: {
            department: true,
            stage: true
        }
    });

    res.status(200).json({
        status: "success",
        data: {
            student: {
                ...student,
                id: student.id.toString(),
                department_id: student.department_id?.toString(),
                stage_id: student.stage_id?.toString()
            }
        }
    });
});

export const deleteStudent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    await prisma.student.delete({
        where: { id: BigInt(id as string) }
    });

    res.status(200).json({
        status: "success",
        message: "Student deleted successfully"
    });
});

export const resetFingerprint = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const student = await prisma.student.update({
        where: { id: BigInt(id as string) },
        data: {
            fingerprint_hash: null
        }
    });

    logger.info(`[ADMIN] Fingerprint reset for student: ${id}`);

    res.status(200).json({
        status: "success",
        message: "تم إعادة تعيين بصمة الجهاز للطالب بنجاح"
    });
});

