import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";
import { getDepartmentFilter } from "../utils/accessControl";
import { withCache, invalidateCachePattern } from "../utils/cacheUtils";

export const createDepartment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body;

    // Validation
    if (!name || name.trim() === '') {
        return next(new AppError('Department name is required', 400));
    }

    // Check for duplicate
    const existing = await prisma.department.findFirst({
        where: { name: name.trim() }
    });

    if (existing) {
        return next(new AppError('Department with this name already exists', 400));
    }

    const department = await prisma.department.create({
        data: {
            name: name.trim(),
        },
    });

    // Invalidate cache
    await invalidateCachePattern("departments:list:*");

    res.status(201).json({
        status: "success",
        data: {
            department: {
                ...department,
                id: department.id.toString(), // Handle BigInt
            },
        },
    });
});

export const getAllDepartments = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).user;
    const deptFilter = getDepartmentFilter(admin);
    const adminId = admin?.id?.toString() || 'all';
    const deptId = admin?.department_id?.toString() || 'all';
    
    const cacheKey = `departments:list:${adminId}:${deptId}`;

    const safeDepartments = await withCache(cacheKey, 3600, async () => {
        // For Dept Heads, we filter the departments list to only include THEIR department
        const where = deptFilter ? { id: deptFilter.department_id } : {};
        const departments = await prisma.department.findMany({ where });
        
        return departments.map(d => ({
            ...d,
            id: d.id.toString()
        }));
    });

    res.status(200).json({
        status: "success",
        data: {
            departments: safeDepartments,
        },
    });
});

export const deleteDepartment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Check if department exists
    const existing = await prisma.department.findUnique({
        where: { id: BigInt(id as string) }
    });

    if (!existing) {
        return next(new AppError('Department not found', 404));
    }

    await prisma.department.delete({
        where: {
            id: BigInt(id as string),
        },
    });

    // Invalidate cache
    await invalidateCachePattern("departments:list:*");

    res.status(200).json({
        status: "success",
        message: "Department deleted successfully"
    });
});

export const updateDeparment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name } = req.body;

    // Validation
    if (!name || name.trim() === '') {
        return next(new AppError('Department name is required', 400));
    }

    // Check if department exists
    const existing = await prisma.department.findUnique({
        where: { id: BigInt(id as string) }
    });

    if (!existing) {
        return next(new AppError('Department not found', 404));
    }

    const department = await prisma.department.update({
        where: {
            id: BigInt(id as string),
        },
        data: {
            name: name.trim(),
        },
    });

    // Invalidate cache
    await invalidateCachePattern("departments:list:*");

    res.status(200).json({
        status: "success",
        data: {
            department: { ...department, id: department.id.toString() },
        },
    });
});
