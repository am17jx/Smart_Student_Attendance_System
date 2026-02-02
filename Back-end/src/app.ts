import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import AppError from '../utils/AppError';
import { prisma } from '../prisma/client';
import { requestIdMiddleware } from '../middleware/requestIdMiddleware';
import authRoutes from '../routes/authRoutes';
import departmentRoutes from '../routes/departmentRoutes';
import stageRoutes from '../routes/stageRoutes';
import materialRoutes from '../routes/materialRoutes';
import geofenceRoutes from '../routes/geofenceRoutes';
import sessionRoutes from '../routes/sessionRoutes';
import qrcodeRoutes from '../routes/qrcodeRoutes';
import attendanceRoutes from '../routes/attendanceRoutes';
import dashboardRoutes from '../routes/dashboardRoutes';
import teacherRoutes from '../routes/teacherRoutes';
import studentRoutes from '../routes/studentRoutes';
import promotionRoutes from '../routes/promotionRoutes';
import enrollmentRoutes from '../routes/enrollmentRoutes';


// Handle BigInt serialization
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

const app = express();



app.use((req, res, next) => {
    console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Security Middleware
// 1. Helmet - Set security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// 2. CORS - Configure Cross-Origin Resource Sharing
const corsOptions = {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Fingerprint'],
    exposedHeaders: ['X-Request-ID', 'Content-Disposition', 'Content-Length'],
    maxAge: 86400,
};

app.use(cors(corsOptions));

// 3. Compression - Compress all responses
app.use(compression());

// Request ID Middleware - Add unique ID to each request
app.use(requestIdMiddleware);

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes (API v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/stages', stageRoutes);
app.use('/api/v1/materials', materialRoutes);
app.use('/api/v1/geofences', geofenceRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/qrcodes', qrcodeRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/teachers', teacherRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/promotion', promotionRoutes);
app.use('/api/v1/enrollment', enrollmentRoutes);
// API Status - Simple check
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'success',
        message: 'Privacy-Preserving Student Attendance API is running',
        version: '1.0.0',
        endpoints: {
            api: '/api/v1'
        }
    });
});

// 404 Handler - must come after all routes
app.use((req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

export default app;
