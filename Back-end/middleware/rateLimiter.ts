import rateLimit from 'express-rate-limit';

// General rate limiter for all routes
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'تم تجاوز عدد الطلبات المسموح بها. يرجى المحاولة لاحقاً.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict limiter for authentication routes
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: 'تم تجاوز عدد محاولات تسجيل الدخول. يرجى المحاولة بعد 15 دقيقة.',
    skipSuccessfulRequests: true, // Don't count successful requests
    standardHeaders: true,
    legacyHeaders: false,
});

// Moderate limiter for QR code scanning
export const qrScanLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 QR scans per minute
    message: 'تم تجاوز عدد محاولات مسح QR المسموح بها. يرجى الانتظار قليلاً.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Limiter for API endpoints that create/update data
export const createLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 create/update requests per minute
    message: 'تم تجاوز عدد العمليات المسموح بها. يرجى الانتظار قليلاً.',
    standardHeaders: true,
    legacyHeaders: false,
});
