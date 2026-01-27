import rateLimit from "express-rate-limit";

// 🎓 LESSON: في بيئة الاختبار، نحتاج تعطيل rate limiting
// لأن الاختبارات تشغل طلبات كثيرة بسرعة
const isTestEnvironment = process.env.NODE_ENV === 'test';

// Login Rate Limiter - حماية من Brute Force على تسجيل الدخول
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: isTestEnvironment ? 1000 : 5, // 5 محاولات فقط كل 15 دقيقة
    message: "Too many login attempts from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTestEnvironment,
});

// Signup Rate Limiter - حماية من إنشاء حسابات وهمية
export const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // ساعة واحدة
    max: isTestEnvironment ? 1000 : 10, // 10 حسابات كحد أقصى في الساعة
    message: 'Too many accounts created, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTestEnvironment,
});

// Password Reset Rate Limiter - حماية من إساءة استخدام نظام إعادة التعيين
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // ساعة واحدة
    max: isTestEnvironment ? 1000 : 3, // 3 محاولات فقط في الساعة
    message: 'Too many password reset requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTestEnvironment,
});

// Email Verification Limiter - حماية من spam البريد الإلكتروني
export const emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: isTestEnvironment ? 1000 : 5, // 5 محاولات لإعادة إرسال البريد
    message: 'Too many email requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTestEnvironment,
});

// General API Rate Limiter - للـ routes العامة
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: isTestEnvironment ? 1000 : 100, // 100 طلب كحد أقصى
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTestEnvironment,
});
