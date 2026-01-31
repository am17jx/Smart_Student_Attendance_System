import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';

/**
 * Middleware للتحقق من أن المستخدم لديه صلاحيات الأدمن
 * يجب استخدامه بعد authMiddleware
 */
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
        throw new AppError('Authentication required', 401);
    }

    if (user.role !== 'admin') {
        throw new AppError('Access denied: Admin role required', 403);
    }

    next();
};
