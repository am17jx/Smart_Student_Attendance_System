import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import bcrypt from "bcryptjs";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";
import { getDepartmentFilter } from "../utils/accessControl";
import logger from "../utils/logger";

export const createTeacher = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, departmentId, materialIds } = req.body;
    const admin = (req as any).user;

    logger.info('🔍 [createTeacher] Request:', {
        admin_id: admin.id?.toString(),
        admin_dept: admin.department_id?.toString(),
        requested_dept: departmentId
    });

    // Determine final department ID
    let finalDepartmentId: bigint | null = null;

    if (admin.department_id) {
        // Department Head: must create teacher in their department only
        finalDepartmentId = admin.department_id;

        // If departmentId was provided and different, reject
        if (departmentId && BigInt(departmentId) !== admin.department_id) {
            throw new AppError('Department Heads can only create teachers in their own department', 403);
        }

        logger.info('✅ [createTeacher] Department Head - auto-assigned to dept:', admin.department_id.toString());
    } else {
        // Dean: can create teacher in any department
        finalDepartmentId = departmentId ? BigInt(departmentId) : null;
        logger.info('✅ [createTeacher] Dean - assigned to dept:', finalDepartmentId?.toString() || 'NULL');
    }

    const existingTeacher = await prisma.teacher.findUnique({
        where: { email }
    });
    if (existingTeacher) {
        throw new AppError("Email already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = await prisma.teacher.create({
        data: {
            name,
            email,
            password: hashedPassword,
            department_id: finalDepartmentId,
            teacher_materials: materialIds && Array.isArray(materialIds) ? {
                create: materialIds.map((id: string) => ({
                    material_id: BigInt(id as string)
                }))
            } : undefined
        },
        include: {
            department: true,
            teacher_materials: {
                include: {
                    material: true
                }
            }
        }
    });

    res.status(201).json({
        status: "success",

        data: {
            teacher: {
                name: teacher.name,
                email: teacher.email,
                id: teacher.id.toString(),
                department_id: teacher.department_id?.toString(),
                materials: teacher.teacher_materials.map(tm => ({
                    id: tm.material_id.toString(),
                    name: tm.material.name
                }))
            },
        },
    });
});

export const getAllTeachers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).user;

    // Apply department filter based on admin role
    const deptFilter = getDepartmentFilter(admin);
    const where = deptFilter || {};

    const teachers = await prisma.teacher.findMany({
        where,
        include: {
            department: true,
            teacher_materials: {
                include: {
                    material: true
                }
            }
        }
    });
    const safeTeachers = teachers.map(t => ({
        ...t,
        id: t.id.toString(),
        department_id: t.department_id?.toString(),
        department: t.department?.name || "Unassigned",
        materials: t.teacher_materials.map(tm => ({
            id: tm.material_id.toString(),
            name: tm.material.name
        }))
    }));

    res.status(200).json({
        status: "success",
        data: {
            teachers: safeTeachers,
        },
    });
});

export const updateTeacher = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, email, departmentId, materialIds } = req.body;

    const teacher = await prisma.teacher.update({
        where: { id: BigInt(id as string) },
        data: {
            name,
            email,
            department_id: departmentId ? BigInt(departmentId as string) : undefined,
            ...(materialIds && Array.isArray(materialIds) ? {
                teacher_materials: {
                    deleteMany: {}, // Remove all existing assignments
                    create: materialIds.map((mid: string) => ({
                        material_id: BigInt(mid)
                    }))
                }
            } : {})
        },
        include: {
            department: true,
            teacher_materials: {
                include: {
                    material: true
                }
            }
        }
    });

    res.status(200).json({
        status: "success",
        data: {
            teacher: {
                ...teacher,
                id: teacher.id.toString(),
                department_id: teacher.department_id?.toString(),
                materials: teacher.teacher_materials.map(tm => ({
                    id: tm.material_id.toString(),
                    name: tm.material.name
                }))
            }
        }
    });
});

export const deleteTeacher = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    await prisma.teacher.delete({
        where: { id: BigInt(id as string) }
    });

    res.status(200).json({
        status: "success",
        message: "Teacher deleted successfully"
    });
});


/**
 * Get students for logged-in teacher
 * Returns all students in departments/stages matching teacher's assigned materials
 * GET /api/v1/teachers/my-students
 */
export const getMyStudents = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const teacher = (req as any).teacher;

    if (!teacher) {
        return next(new AppError('Teacher not found', 404));
    }

    logger.info('👥 [getMyStudents] Fetching students for teacher:', teacher.id.toString());

    // 1. Get teacher's assigned materials with dept/stage info
    const teacherMaterials = await prisma.teacherMaterial.findMany({
        where: {
            teacher_id: teacher.id
        },
        include: {
            material: {
                select: {
                    id: true,
                    name: true,
                    department_id: true,
                    stage_id: true,
                    department: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    stage: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            }
        }
    });

    logger.info('📚 [getMyStudents] Teacher has', teacherMaterials.length, 'materials');

    if (teacherMaterials.length === 0) {
        return res.status(200).json({
            status: 'success',
            results: 0,
            data: {
                students: [],
                materials: []
            }
        });
    }

    // 2. Extract unique dept/stage combinations
    const deptStageCombinations = new Map<string, { dept_id: bigint, stage_id: bigint }>();

    teacherMaterials.forEach(tm => {
        const key = `${tm.material.department_id.toString()}-${tm.material.stage_id.toString()}`;
        if (!deptStageCombinations.has(key)) {
            deptStageCombinations.set(key, {
                dept_id: tm.material.department_id,
                stage_id: tm.material.stage_id
            });
        }
    });

    logger.info('🔍 [getMyStudents] Unique dept/stage combinations:', deptStageCombinations.size);

    // 3. Fetch all students matching these dept/stage combinations
    const orConditions = Array.from(deptStageCombinations.values()).map(combo => ({
        department_id: combo.dept_id,
        stage_id: combo.stage_id
    }));

    logger.info('🔍 [getMyStudents] OR conditions:', JSON.stringify(orConditions, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));

    const students = await prisma.student.findMany({
        where: {
            OR: orConditions
        },
        select: {
            id: true,
            student_id: true,
            name: true,
            email: true,
            department: {
                select: {
                    id: true,
                    name: true
                }
            },
            stage: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: [
            { department_id: 'asc' },
            { stage_id: 'asc' },
            { name: 'asc' }
        ]
    });

    logger.info('✅ [getMyStudents] Found', students.length, 'students');
    if (students.length > 0) {
        logger.info('Sample student:', students[0].name, 'Dept:', students[0].department?.name);
    }

    // 4. Serialize response
    const serializedStudents = students.map(s => ({
        ...s,
        id: s.id.toString(),
        department: s.department ? {
            ...s.department,
            id: s.department.id.toString()
        } : null,
        stage: s.stage ? {
            ...s.stage,
            id: s.stage.id.toString()
        } : null
    }));

    const serializedMaterials = teacherMaterials.map(tm => ({
        id: tm.material.id.toString(),
        name: tm.material.name,
        department: {
            id: tm.material.department.id.toString(),
            name: tm.material.department.name
        },
        stage: {
            id: tm.material.stage.id.toString(),
            name: tm.material.stage.name
        }
    }));

    res.status(200).json({
        status: 'success',
        results: serializedStudents.length,
        data: {
            students: serializedStudents,
            materials: serializedMaterials
        }
    });
});
