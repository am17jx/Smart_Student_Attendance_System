import { Request, Response, NextFunction } from 'express';
import { canAccessDepartment } from '../utils/accessControl';
import AppError from '../utils/AppError';

/**
 * Middleware to check if admin has access to a specific department
 * Expects departmentId in req.params or req.body
 */
export const checkDepartmentAccess = (paramName: string = 'departmentId') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const admin = (req as any).user; // Set by authentication middleware

        if (!admin) {
            return next(new AppError('Not authenticated', 401));
        }

        // Get department ID from params or body
        const departmentId = req.params[paramName] || req.body[paramName];

        if (!departmentId) {
            return next(new AppError('Department ID is required', 400));
        }

        // Check if admin has access
        if (!canAccessDepartment(admin, BigInt(departmentId))) {
            return next(new AppError('Access denied: You do not have permission to access this department', 403));
        }

        next();
    };
};

/**
 * Middleware to attach department filter to request for queries
 * This will be used in controllers to automatically filter by department
 */
export const attachDepartmentFilter = (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).user;

    if (!admin) {
        return next(new AppError('Not authenticated', 401));
    }

    // Attach department filter to request
    (req as any).departmentFilter = admin.role === 'DEAN'
        ? {} // No filter for DEAN
        : { department_id: admin.department_id }; // Filter by department for DEPARTMENT_HEAD

    next();
};
