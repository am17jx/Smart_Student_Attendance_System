import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";

export const createStage = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, level } = req.body;

    // Validation
    if (!name || name.trim() === '') {
        return next(new AppError('Stage name is required', 400));
    }

    if (!level || typeof level !== 'number') {
        return next(new AppError('Stage level is required and must be a number', 400));
    }

    // Check for duplicate
    const existing = await prisma.stage.findFirst({
        where: {
            name: name.trim(),
            level: level
        }
    });

    if (existing) {
        return next(new AppError('Stage with this name and level already exists', 400));
    }

    const stage = await prisma.stage.create({
        data: {
            name: name.trim(),
            level: level
        },
    });

    res.status(201).json({
        status: "success",
        data: {
            stage: { ...stage, id: stage.id.toString() },
        },
    });
});

export const getAllStages = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const stages = await prisma.stage.findMany({
        orderBy: {
            level: 'asc' // Sort by level
        }
    });
    const safeStages = stages.map(s => ({ ...s, id: s.id.toString() }));

    res.status(200).json({
        status: "success",
        data: {
            stages: safeStages,
        },
    });
});

export const deleteStage = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Check if stage exists
    const existing = await prisma.stage.findUnique({
        where: { id: BigInt(id as string) }
    });

    if (!existing) {
        return next(new AppError('Stage not found', 404));
    }

    await prisma.stage.delete({
        where: {
            id: BigInt(id as string),
        },
    });

    res.status(200).json({
        status: "success",
        message: "Stage deleted successfully"
    });
});

export const updateStage = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, level } = req.body;

    // Validation
    if (!name || name.trim() === '') {
        return next(new AppError('Stage name is required', 400));
    }

    if (level && typeof level !== 'number') {
        return next(new AppError('Stage level must be a number', 400));
    }

    // Check if stage exists
    const existing = await prisma.stage.findUnique({
        where: { id: BigInt(id as string) }
    });

    if (!existing) {
        return next(new AppError('Stage not found', 404));
    }

    const stage = await prisma.stage.update({
        where: {
            id: BigInt(id as string),
        },
        data: {
            name: name.trim(),
            ...(level && { level }) // Only update level if provided
        },
    });

    res.status(200).json({
        status: "success",
        data: {
            stage: { ...stage, id: stage.id.toString() },
        },
    });
});
