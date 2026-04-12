import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";
import { getDepartmentFilter, validateDepartmentAccess } from "../utils/accessControl";
import logger from "../utils/logger";

export const createMaterial = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, departmentId, stageId, semester } = req.body;
    const admin = (req as any).user;

    // Validation
    if (!name || name.trim() === '') {
        return next(new AppError('Material name is required', 400));
    }

    if (!departmentId) {
        return next(new AppError('Department ID is required', 400));
    }

    // Validate department access
    validateDepartmentAccess(admin, BigInt(departmentId));

    if (!stageId) {
        return next(new AppError('Stage ID is required', 400));
    }

    // Check if department exists
    const department = await prisma.department.findUnique({
        where: { id: BigInt(departmentId) }
    });

    if (!department) {
        return next(new AppError('Department not found', 404));
    }

    // Check if stage exists
    const stage = await prisma.stage.findUnique({
        where: { id: BigInt(stageId) }
    });

    if (!stage) {
        return next(new AppError('Stage not found', 404));
    }

    // Check for duplicate
    const existing = await prisma.material.findFirst({
        where: {
            name: name.trim(),
            department_id: BigInt(departmentId),
            stage_id: BigInt(stageId)
        }
    });

    if (existing) {
        return next(new AppError('Material with this name already exists for this department and stage', 400));
    }

    const material = await prisma.material.create({
        data: {
            name: name.trim(),
            department_id: BigInt(departmentId),
            stage_id: BigInt(stageId),
            semester: semester || 'FULL_YEAR'
        },
    });

    res.status(201).json({
        status: "success",
        data: {
            material: {
                ...material,
                id: material.id.toString(),
                department_id: material.department_id.toString(),
                stage_id: material.stage_id.toString()
            },
        },
    });
});

export const getAllMaterials = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).user;

    // Apply department filter based on admin role
    const deptFilter = getDepartmentFilter(admin);
    const where = deptFilter || {};

    const materials = await prisma.material.findMany({
        where,
        include: {
            department: true,
            stage: true,
            _count: {
                select: { teacherMaterials: true }
            }
        },
        orderBy: {
            name: 'asc'
        }
    });

    const safeMaterials = materials.map(m => ({
        ...m,
        id: m.id.toString(),
        department_id: m.department_id.toString(),
        stage_id: m.stage_id.toString(),
        department: {
            ...m.department,
            id: m.department.id.toString()
        },
        stage: {
            ...m.stage,
            id: m.stage.id.toString()
        },
        teachersCount: (m as any)._count?.teacherMaterials || 0
    }));

    res.status(200).json({
        status: "success",
        data: {
            materials: safeMaterials,
        },
    });
});

export const deleteMaterial = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Check if material exists
    const existing = await prisma.material.findUnique({
        where: { id: BigInt(id as string) }
    });

    if (!existing) {
        return next(new AppError('Material not found', 404));
    }

    await prisma.material.delete({
        where: {
            id: BigInt(id as string),
        },
    });

    res.status(200).json({
        status: "success",
        message: "Material deleted successfully"
    });
});

export const updateMaterial = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, departmentId, stageId, semester } = req.body;

    // Validation
    if (!name || name.trim() === '') {
        return next(new AppError('Material name is required', 400));
    }

    // Check if material exists
    const existing = await prisma.material.findUnique({
        where: { id: BigInt(id as string) }
    });

    if (!existing) {
        return next(new AppError('Material not found', 404));
    }

    // If departmentId provided, check if it exists
    if (departmentId) {
        const department = await prisma.department.findUnique({
            where: { id: BigInt(departmentId) }
        });

        if (!department) {
            return next(new AppError('Department not found', 404));
        }
    }

    // If stageId provided, check if it exists
    if (stageId) {
        const stage = await prisma.stage.findUnique({
            where: { id: BigInt(stageId) }
        });

        if (!stage) {
            return next(new AppError('Stage not found', 404));
        }
    }

    const material = await prisma.material.update({
        where: {
            id: BigInt(id as string),
        },
        data: {
            name: name.trim(),
            ...(departmentId && { department_id: BigInt(departmentId) }),
            ...(stageId && { stage_id: BigInt(stageId) }),
            ...(semester && { semester: semester })
        },
    });

    res.status(200).json({
        status: "success",
        data: {
            material: {
                ...material,
                id: material.id.toString(),
                department_id: material.department_id.toString(),
                stage_id: material.stage_id.toString()
            },
        },
    });
});

export const getMaterialsByDepartment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { departmentId } = req.params;

    // Check if department exists
    const department = await prisma.department.findUnique({
        where: { id: BigInt(departmentId as string) }
    });

    if (!department) {
        return next(new AppError('Department not found', 404));
    }

    const materials = await prisma.material.findMany({
        where: {
            department_id: BigInt(departmentId as string),
        },
        include: {
            stage: true
        },
        orderBy: {
            name: 'asc'
        }
    });

    const safeMaterials = materials.map(m => ({
        ...m,
        id: m.id.toString(),
        department_id: m.department_id.toString(),
        stage_id: m.stage_id.toString(),
        stage: {
            ...m.stage,
            id: m.stage.id.toString()
        }
    }));

    res.status(200).json({
        status: "success",
        data: {
            materials: safeMaterials,
        },
    });
});

export const getMaterialsByStage = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { stageId } = req.params;

    // Check if stage exists
    const stage = await prisma.stage.findUnique({
        where: { id: BigInt(stageId as string) }
    });

    if (!stage) {
        return next(new AppError('Stage not found', 404));
    }

    const materials = await prisma.material.findMany({
        where: {
            stage_id: BigInt(stageId as string),
        },
        include: {
            department: true
        },
        orderBy: {
            name: 'asc'
        }
    });

    const safeMaterials = materials.map(m => ({
        ...m,
        id: m.id.toString(),
        department_id: m.department_id.toString(),
        stage_id: m.stage_id.toString(),
        department: {
            ...m.department,
            id: m.department.id.toString()
        }
    }));

    res.status(200).json({
        status: "success",
        data: {
            materials: safeMaterials,
        },
    });
});


// Get teacher materials
export const getTeacherMaterials = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // req.teacher is populated by teacherAuthMiddleware
    const teacher = (req as any).teacher;

    if (!teacher) {
        return next(new AppError('Teacher not found', 401));
    }

    logger.info(' [getTeacherMaterials] Fetching materials for teacher:', teacher.id.toString());

    // Find all materials assigned to this teacher via TeacherMaterial junction table
    const materials = await prisma.material.findMany({
        where: {
            teacherMaterials: {
                some: {
                    teacher_id: teacher.id
                }
            }
        },
        include: {
            department: true,
            stage: true,
            _count: {
                select: { teacherMaterials: true }
            }
        },
        orderBy: {
            name: 'asc'
        }
    });

    const safeMaterials = materials.map(m => ({
        ...m,
        id: m.id.toString(),
        department_id: m.department_id.toString(),
        stage_id: m.stage_id.toString(),
        department: {
            ...m.department,
            id: m.department.id.toString()
        },
        stage: {
            ...m.stage,
            id: m.stage.id.toString()
        },
        teachersCount: (m as any)._count?.teacherMaterials || 0
    }));

    logger.info(' [getTeacherMaterials] Found', safeMaterials.length, 'materials');

    res.status(200).json({
        status: "success",
        results: safeMaterials.length,
        data: {
            materials: safeMaterials,
        },
    });
});

/**
 * Assign teacher to material

 * Creates a record in TeacherMaterial junction table
 * POST /api/v1/materials/:id/assign-teacher
 */
export const assignTeacherToMaterial = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { teacherId } = req.body;

    if (!teacherId) {
        return next(new AppError('Teacher ID is required', 400));
    }

    // Check if material exists
    const material = await prisma.material.findUnique({
        where: { id: BigInt(id as string) },
        include: {
            department: true,
            stage: true
        }
    });

    if (!material) {
        return next(new AppError('Material not found', 404));
    }

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
        where: { id: BigInt(teacherId) },
        include: {
            department: true
        }
    });

    if (!teacher) {
        return next(new AppError('Teacher not found', 404));
    }

    // Check if teacher belongs to the same department as the material
    if (teacher.department_id && material.department_id !== teacher.department_id) {
        return next(new AppError('Teacher does not belong to the same department as this material', 400));
    }

    // Check if teacher is already assigned
    const existing = await prisma.teacherMaterial.findFirst({
        where: {
            teacher_id: BigInt(teacherId),
            material_id: BigInt(id as string)
        }
    });

    if (existing) {
        return next(new AppError('Teacher is already assigned to this material', 400));
    }

    // Create the assignment
    const assignment = await prisma.teacherMaterial.create({
        data: {
            teacher_id: BigInt(teacherId),
            material_id: BigInt(id as string)
        }
    });

    res.status(201).json({
        status: "success",
        message: "Teacher assigned to material successfully",
        data: {
            assignment: {
                id: assignment.id.toString(),
                teacher_id: assignment.teacher_id.toString(),
                material_id: assignment.material_id.toString(),
                created_at: assignment.created_at
            },
            material: {
                id: material.id.toString(),
                name: material.name,
                department: material.department.name,
                stage: material.stage.name
            },
            teacher: {
                id: teacher.id.toString(),
                name: teacher.name,
                email: teacher.email,
                department: teacher.department?.name || 'N/A'
            }
        }
    });
});



export const removeTeacherFromMaterial = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { teacherId } = req.body;

    if (!teacherId) {
        return next(new AppError('Teacher ID is required', 400));
    }

    // Check if material exists
    const material = await prisma.material.findUnique({
        where: { id: BigInt(id as string) }
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

    // Find the assignment
    const assignment = await prisma.teacherMaterial.findFirst({
        where: {
            teacher_id: BigInt(teacherId),
            material_id: BigInt(id as string)
        }
    });

    if (!assignment) {
        return next(new AppError('Teacher is not assigned to this material', 404));
    }

    // Delete the assignment
    await prisma.teacherMaterial.delete({
        where: {
            id: assignment.id
        }
    });

    res.status(200).json({
        status: "success",
        message: "Teacher removed from material successfully",
        data: {
            teacher: {
                id: teacher.id.toString(),
                name: teacher.name
            },
            material: {
                id: material.id.toString(),
                name: material.name
            }
        }
    });
});
