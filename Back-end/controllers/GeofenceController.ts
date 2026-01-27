import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";

export const createGeofence = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, latitude, longitude, radius_meters } = req.body;

    // Validation
    if (!name || name.trim() === '') {
        return next(new AppError('Geofence name is required', 400));
    }

    if (latitude === undefined || latitude === null) {
        return next(new AppError('Latitude is required', 400));
    }

    if (longitude === undefined || longitude === null) {
        return next(new AppError('Longitude is required', 400));
    }

    if (radius_meters === undefined || radius_meters === null) {
        return next(new AppError('Radius is required', 400));
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
        return next(new AppError('Latitude must be between -90 and 90', 400));
    }

    if (longitude < -180 || longitude > 180) {
        return next(new AppError('Longitude must be between -180 and 180', 400));
    }

    // Validate radius
    if (typeof radius_meters !== 'number' || radius_meters <= 0) {
        return next(new AppError('Radius must be a positive number', 400));
    }

    // Check for duplicate name
    const existing = await prisma.geofence.findFirst({
        where: { name: name.trim() }
    });

    if (existing) {
        return next(new AppError('Geofence with this name already exists', 400));
    }

    const geofence = await prisma.geofence.create({
        data: {
            name: name.trim(),
            latitude,
            longitude,
            radius_meters,
        },
    });

    res.status(201).json({
        status: "success",
        data: {
            geofence: {
                ...geofence,
                id: geofence.id.toString(),
            },
        },
    });
});

export const getAllGeofences = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const geofences = await prisma.geofence.findMany({
        orderBy: {
            name: 'asc'
        }
    });

    const safeGeofences = geofences.map(g => ({
        ...g,
        id: g.id.toString(),
    }));

    res.status(200).json({
        status: "success",
        data: {
            geofences: safeGeofences,
        },
    });
});

export const updateGeofence = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, latitude, longitude, radius_meters } = req.body;

    // Check if geofence exists
    const existing = await prisma.geofence.findUnique({
        where: { id: BigInt(id) }
    });

    if (!existing) {
        return next(new AppError('Geofence not found', 404));
    }

    // Validation
    if (!name || name.trim() === '') {
        return next(new AppError('Geofence name is required', 400));
    }

    if (latitude === undefined || latitude === null) {
        return next(new AppError('Latitude is required', 400));
    }

    if (longitude === undefined || longitude === null) {
        return next(new AppError('Longitude is required', 400));
    }

    if (radius_meters === undefined || radius_meters === null) {
        return next(new AppError('Radius is required', 400));
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
        return next(new AppError('Latitude must be between -90 and 90', 400));
    }

    if (longitude < -180 || longitude > 180) {
        return next(new AppError('Longitude must be between -180 and 180', 400));
    }

    // Validate radius
    if (typeof radius_meters !== 'number' || radius_meters <= 0) {
        return next(new AppError('Radius must be a positive number', 400));
    }

    const geofence = await prisma.geofence.update({
        where: { id: BigInt(id) },
        data: {
            name: name.trim(),
            latitude,
            longitude,
            radius_meters,
        },
    });

    res.status(200).json({
        status: "success",
        data: {
            geofence: {
                ...geofence,
                id: geofence.id.toString(),
            },
        },
    });
});

export const deleteGeofence = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Check if geofence exists
    const existing = await prisma.geofence.findUnique({
        where: { id: BigInt(id) }
    });

    if (!existing) {
        return next(new AppError('Geofence not found', 404));
    }

    await prisma.geofence.delete({
        where: { id: BigInt(id) },
    });

    res.status(200).json({
        status: "success",
        message: "Geofence deleted successfully"
    });
});
