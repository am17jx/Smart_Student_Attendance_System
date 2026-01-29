import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";

export const getAllStudents = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || "";
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
        where.OR = [
            { name: { contains: search } },
            { email: { contains: search } }
        ];
    }

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

    res.status(200).json({
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
    });
});

export const updateStudent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, email, departmentId, stageId } = req.body;

    const student = await prisma.student.update({
        where: { id: BigInt(id) },
        data: {
            name,
            email,
            department_id: departmentId ? BigInt(departmentId) : undefined,
            stage_id: stageId ? BigInt(stageId) : undefined
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
        where: { id: BigInt(id) }
    });

    res.status(200).json({
        status: "success",
        message: "Student deleted successfully"
    });
});

export const resetFingerprint = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const student = await prisma.student.update({
        where: { id: BigInt(id) },
        data: {
            fingerprint_hash: null
        }
    });

    console.log(`[ADMIN] Fingerprint reset for student: ${id}`);

    res.status(200).json({
        status: "success",
        message: "تم إعادة تعيين بصمة الجهاز للطالب بنجاح"
    });
});

