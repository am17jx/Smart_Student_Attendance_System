import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID Middleware
 * Adds unique ID to each request for tracking and debugging
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Generate unique request ID
    const requestId = uuidv4();

    // Attach to request object
    (req as any).id = requestId;

    // Add to response headers
    res.setHeader('X-Request-ID', requestId);

    next();
};
