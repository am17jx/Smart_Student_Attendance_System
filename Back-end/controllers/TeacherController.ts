import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import bcrypt from "bcryptjs";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";

export const createTeacher = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, departmentId, materialIds } = req.body;

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
            department_id: departmentId ? BigInt(departmentId) : null,
            teacher_materials: materialIds && Array.isArray(materialIds) ? {
                create: materialIds.map((id: string) => ({
                    material_id: BigInt(id)
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
    const teachers = await prisma.teacher.findMany({
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
        where: { id: BigInt(id) },
        data: {
            name,
            email,
            department_id: departmentId ? BigInt(departmentId) : undefined,
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
        where: { id: BigInt(id) }
    });

    res.status(200).json({
        status: "success",
        message: "Teacher deleted successfully"
    });
});

