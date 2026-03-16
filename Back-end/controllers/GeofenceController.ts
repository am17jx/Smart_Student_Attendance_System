import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";

/**
 * Validates geofence coordinate fields and returns an AppError if invalid,
 * or null if all values are acceptable.
 */
function validateGeofenceCoordinates(
    name: string,
    latitude: number,
    longitude: number,
    radius_meters: number
): AppError | null {
    if (!name || name.trim() === '') {
        return new AppError('Geofence name is required', 400);
    }
    if (latitude === undefined || latitude === null) {
        return new AppError('Latitude is required', 400);
    }
    if (longitude === undefined || longitude === null) {
        return new AppError('Longitude is required', 400);
    }
    if (radius_meters === undefined || radius_meters === null) {
        return new AppError('Radius is required', 400);
    }
    if (latitude < -90 || latitude > 90) {
        return new AppError('Latitude must be between -90 and 90', 400);
    }
    if (longitude < -180 || longitude > 180) {
        return new AppError('Longitude must be between -180 and 180', 400);
    }
    if (typeof radius_meters !== 'number' || radius_meters <= 0) {
        return new AppError('Radius must be a positive number', 400);
    }
    return null;
}

export const createGeofence = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, latitude, longitude, radius_meters } = req.body;

    const validationError = validateGeofenceCoordinates(name, latitude, longitude, radius_meters);
    if (validationError) {
        return next(validationError);
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
        where: { id: BigInt(id as string) }
    });

    if (!existing) {
        return next(new AppError('Geofence not found', 404));
    }

    // Validation
    const validationError = validateGeofenceCoordinates(name, latitude, longitude, radius_meters);
    if (validationError) {
        return next(validationError);
    }

    const geofence = await prisma.geofence.update({
        where: { id: BigInt(id as string) },
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
        where: { id: BigInt(id as string) }
    });

    if (!existing) {
        return next(new AppError('Geofence not found', 404));
    }

    await prisma.geofence.delete({
        where: { id: BigInt(id as string) },
    });

    res.status(200).json({
        status: "success",
        message: "Geofence deleted successfully"
    });
});
