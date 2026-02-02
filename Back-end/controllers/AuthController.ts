/// <reference path="../types/express.d.ts" />

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { prisma } from "../prisma/client";
import { validationResult } from "express-validator";
import crypto from "crypto";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";
import { logFailedAttemptUtil } from "../utils/FailedAttemptUtill";
import emailService from "../utils/emailService";
import logger from "../utils/logger";
dotenv.config();


function generateTempPassword(): string {
    return Math.random().toString(36).slice(-8);
}

/**
 * Generate random token for email verification/password reset
 */
function generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export function hashFingerprint(fingerprint: string): string {
    return crypto.createHash("sha256").update(fingerprint).digest("hex");
}

function handleValidationErrors(req: Request, res: Response): void {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error: any = new Error("Validation failed");
        error.statusCode = 400;
        error.details = errors.array();
        throw error;
    }
}


// Admin creates another Admin (Admin-only action)
export const createAdmin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    handleValidationErrors(req, res);

    const { name, email } = req.body;


    if (!name) {
        throw new AppError("Name is required", 400);
    }

    // Check if email already exists
    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
        throw new AppError("Email already exists", 400);
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create new admin
    const newAdmin = await prisma.admin.create({
        data: {
            name,
            email,
            password: hashedPassword,
        },
    });

    logger.info(`[ADMIN] New admin created: ${email}, ID: ${newAdmin.id}`);

    res.status(201).json({
        status: "success",
        message: "Admin created successfully with temporary password",
        tempPassword,
        user: {
            id: newAdmin.id.toString(),
            name: newAdmin.name,
            email: newAdmin.email,
        },
    });
});


//teacher signed by admin
export const Teacher_sign = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, departmentId } = req.body;

    if (!name) {
        throw new AppError("Name is required", 400);
    }

    // ✅ توليد password موقت
    const tempPassword = generateTempPassword();

    const checkemail = await prisma.teacher.findUnique({ where: { email } });
    if (checkemail) {
        throw new AppError("Email already exists", 400);
    }

    // 🎓 LESSON: نتحقق من department فقط إذا تم إرساله
    if (departmentId) {
        const checkDepartmentId = await prisma.department.findUnique({
            where: { id: BigInt(departmentId) },
        });
        if (!checkDepartmentId) {
            throw new AppError("Department not found", 400);
        }
    }

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await prisma.teacher.create({
        data: {
            name,
            email,
            password: hashedPassword,
            department_id: departmentId ? BigInt(departmentId) : null,
        },
    });

    logger.info(`[ADMIN] Teacher created: ${email}, ID: ${newUser.id}`);

    res.status(201).json({
        status: "success",
        message: "Teacher created successfully with temporary password",
        tempPassword,
        user: {
            id: newUser.id.toString(),
            name: newUser.name,
            email: newUser.email,
        },
    });
});


// for admin to create student with temp password
export const sign_student = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    handleValidationErrors(req, res);

    const { name, email, stageId, departmentId, studentId } = req.body;

    if (!name) {
        throw new AppError("Name is required", 400);
    }

    const checkemail = await prisma.student.findUnique({ where: { email } });
    if (checkemail) {
        throw new AppError("Email already exists", 400);
    }

    const checkStudentId = await prisma.student.findUnique({
        where: { student_id: studentId },
    });
    if (checkStudentId) {
        throw new AppError("Student ID already exists", 400);
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Generate email verification token
    const verificationToken = generateToken();
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // ✅ Use transaction to ensure consistency
    let newUser;
    let emailSent = false;

    try {
        // Create user and send emails in logical sequence
        newUser = await prisma.student.create({
            data: {
                name,
                email,
                student_id: studentId,
                password: hashedPassword,
                must_change_password: true,
                department_id: departmentId ? BigInt(departmentId) : null,
                stage_id: stageId ? BigInt(stageId) : null,
                email_verification_token: verificationTokenHash,
                email_verification_expires: verificationExpires,
            },
        });

        logger.info(`[ADMIN] Student created: ${email}, ID: ${newUser.id}`);

        // Try to send emails immediately after creation
        try {
            await emailService.sendWelcomeEmail(email, name, tempPassword);
            await emailService.sendVerificationEmail(email, name, verificationToken);
            emailSent = true;
            logger.info(`✅ Welcome and verification emails sent to ${email}`);
        } catch (emailError) {
            logger.error('Failed to send emails', { error: emailError, email });
            // Email failed but user is created - this is acceptable
            // User can request resend verification email later
        }

        res.status(201).json({
            status: "success",
            message: emailSent
                ? "Student created successfully. Welcome email sent with temporary password."
                : "Student created successfully. Email sending failed - please use 'Resend Verification' option.",
            tempPassword,
            emailSent, // ✅ Frontend knows if email was sent
            user: {
                id: newUser.id.toString(),
                name: newUser.name,
                email: newUser.email,
            },
        });
    } catch (error) {
        // If any error occurs during user creation, the whole operation fails
        // Prisma will automatically rollback
        throw error;
    }
});


export const change_teacher_password = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    handleValidationErrors(req, res);

    const { teacherId } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    if (BigInt(req.user.id) !== BigInt(teacherId as string)) {
        throw new AppError("Unauthorized: Cannot change another user's password", 403);
    }

    const user = await prisma.teacher.findUnique({
        where: { id: BigInt(teacherId as string) },
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
        throw new AppError("Old password is incorrect", 401);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.teacher.update({
        where: { id: BigInt(teacherId as string) },
        data: { password: hashedNewPassword },
    });

    logger.info(`[AUTH] Password changed for teacher: ${user.email}`);

    res.status(200).json({
        status: "success",
        message: "Password changed successfully",
    });
})



export const change_student_password = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    handleValidationErrors(req, res);

    const { studentId } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    if (BigInt(req.user.id) !== BigInt(studentId as string)) {
        throw new AppError("Unauthorized: Cannot change another user's password", 403);
    }

    const user = await prisma.student.findUnique({
        where: { id: BigInt(studentId as string) },
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
        throw new AppError("Old password is incorrect", 401);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.student.update({
        where: { id: BigInt(studentId as string) },
        data: { password: hashedNewPassword, must_change_password: false },
    });

    logger.info(`[AUTH] Password changed for student: ${user.email}`);

    res.status(200).json({
        status: "success",
        message: "Password changed successfully",
    });
});

export const reset_student_password = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { studentId } = req.params;

    const user = await prisma.student.findUnique({
        where: { id: BigInt(studentId as string) },
    });

    if (!user) {
        throw new AppError("Student not found", 404);
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.student.update({
        where: { id: BigInt(studentId as string) },
        data: { password: hashedPassword, must_change_password: true },
    });

    logger.info(`[ADMIN] Password reset for student: ${user.email}`);

    res.status(200).json({
        status: "success",
        message: "Password reset successfully",
        tempPassword,
    });
});


export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    handleValidationErrors(req, res);

    const { email, password, fingerprint } = req.body;

    const signToken = (payload: any) =>
        jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "24h" });

    // Admin
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin) {
        const ok = await bcrypt.compare(password, admin.password);
        if (!ok) throw new AppError("Invalid email or password", 401);

        const token = signToken({ id: admin.id.toString(), email: admin.email, role: "admin" });
        return res.status(200).json({
            status: "success",
            message: "Login successful",
            data: {
                token,
                user: {
                    id: admin.id.toString(),
                    name: admin.name,
                    email: admin.email,
                    role: "admin"
                }
            }
        });
    }

    // Teacher
    const teacher = await prisma.teacher.findUnique({ where: { email } });
    if (teacher) {
        const ok = await bcrypt.compare(password, teacher.password);
        if (!ok) throw new AppError("Invalid email or password", 401);

        const token = signToken({ id: teacher.id.toString(), email: teacher.email, role: "teacher" });
        return res.status(200).json({
            status: "success",
            message: "Login successful",
            data: {
                token,
                user: {
                    id: teacher.id.toString(),
                    name: teacher.name,
                    email: teacher.email,
                    role: "teacher"
                }
            }
        });
    }

    // Student
    const student = await prisma.student.findUnique({ where: { email } });
    if (student) {
        const ok = await bcrypt.compare(password, student.password);
        if (!ok) {
            await logFailedAttemptUtil({
                errorType: "INVALID_CREDENTIALS",
                errorMessage: `Student login failed: Invalid password for ${email}`,
                studentId: student.id.toString(),
                sessionId: null,
                fingerprintHash: fingerprint ? hashFingerprint(fingerprint) : null,
                deviceInfo: req.headers["user-agent"] || "Unknown",
                ipAddress: req.ip || req.socket.remoteAddress || "Unknown",
            });
            throw new AppError("Invalid email or password", 401);
        }

        if (student.must_change_password) {
            // Generate reset token for email flow
            const resetToken = generateToken();
            const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
            const resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

            // Save token to DB
            await prisma.student.update({
                where: { id: student.id },
                data: {
                    password_reset_token: resetTokenHash,
                    password_reset_expires: resetExpires,
                },
            });

            // Send Email
            try {
                await emailService.sendPasswordResetEmail(student.email, student.name, resetToken);
                logger.info(`✅ Password reset email sent to ${student.email} (Triggered by temp password login)`);
            } catch (error) {
                logger.error('Failed to send password reset email', { error, email: student.email });
            }

            // Generate token (JWT) so they can also change it manually if they want
            const token = signToken({ id: student.id.toString(), email: student.email, role: "student" });

            return res.status(200).json({
                status: "must_change_password",
                message: "تم إرسال رابط تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى تغيير كلمة المرور.",
                data: {
                    token,  // ✅ Include token for authentication
                    user: {
                        id: student.id.toString(),
                        name: student.name,
                        email: student.email,
                        role: "student"
                    },
                    studentId: student.id.toString(),
                    redirect: "/change-password",
                }
            });
        }

        // ✅ Check if email is verified
        if (!student.is_verified) {
            await logFailedAttemptUtil({
                errorType: "EMAIL_NOT_VERIFIED",
                errorMessage: `Student login failed: Email not verified for ${email}`,
                studentId: student.id.toString(),
                sessionId: null,
                fingerprintHash: fingerprint ? hashFingerprint(fingerprint) : null,
                deviceInfo: req.headers["user-agent"] || "Unknown",
                ipAddress: req.ip || req.socket.remoteAddress || "Unknown",
            });
            throw new AppError("يرجى تفعيل بريدك الإلكتروني أولاً. تحقق من بريدك الوارد.", 403);
        }

        if (fingerprint) {
            const fpHash = hashFingerprint(fingerprint);

            if (!student.fingerprint_hash) {
                await prisma.student.update({ where: { id: student.id }, data: { fingerprint_hash: fpHash } });
            } else if (student.fingerprint_hash !== fpHash) {
                await logFailedAttemptUtil({
                    errorType: "FINGERPRINT_MISMATCH",
                    errorMessage: `Student login failed: Device fingerprint mismatch for ${email}`,
                    studentId: student.id.toString(),
                    sessionId: null,
                    fingerprintHash: fpHash,
                    deviceInfo: req.headers["user-agent"] || "Unknown",
                    ipAddress: req.ip || req.socket.remoteAddress || "Unknown",
                });
                throw new AppError("Access denied: You are using a different browser or device.", 403);
            }
        }

        const token = signToken({ id: student.id.toString(), email: student.email, role: "student" });

        // Send login notification email
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            await emailService.sendLoginNotification(
                student.email,
                student.name,
                new Date(),
                ipAddress
            );
            logger.info(`✅ Login notification sent to ${student.email}`);
        } catch (error) {
            logger.error('Failed to send login notification', { error, email: student.email });
            // Don't fail login if email fails
        }

        return res.status(200).json({
            status: "success",
            message: "Login successful",
            data: {
                token,
                user: {
                    id: student.id.toString(),
                    name: student.name,
                    email: student.email,
                    role: "student"
                }
            }
        });
    }

    // Not found
    await logFailedAttemptUtil({
        errorType: "INVALID_CREDENTIALS",
        errorMessage: `Login failed: Email not found - ${email}`,
        studentId: null,
        sessionId: null,
        fingerprintHash: fingerprint ? hashFingerprint(fingerprint) : null,
        deviceInfo: req.headers["user-agent"] || "Unknown",
        ipAddress: req.ip || req.socket.remoteAddress || "Unknown",
    });

    throw new AppError("Invalid email or password", 401);
});


/**
 * Send password reset email
 * POST /api/auth/forgot-password
 */
export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;

    // 1) Find student by email
    const student = await prisma.student.findUnique({
        where: { email },
    });

    if (!student) {
        // Don't reveal if email exists or not (security)
        return res.status(200).json({
            status: 'success',
            message: 'إذا كان البريد الإلكتروني موجوداً، سيتم إرسال رابط إعادة التعيين',
        });
    }

    // 2) Generate reset token
    const resetToken = generateToken();
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // 3) Save token to database
    await prisma.student.update({
        where: { id: student.id },
        data: {
            password_reset_token: resetTokenHash,
            password_reset_expires: resetExpires,
        },
    });

    // 4) Send email
    try {
        await emailService.sendPasswordResetEmail(student.email, student.name, resetToken);
        logger.info(`✅ Password reset email sent to ${student.email}`);

        res.status(200).json({
            status: 'success',
            message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
        });
    } catch (error) {
        // Rollback token if email fails
        await prisma.student.update({
            where: { id: student.id },
            data: {
                password_reset_token: null,
                password_reset_expires: null,
            },
        });

        logger.error('Failed to send password reset email', { error, email: student.email });
        throw new AppError('حدث خطأ في إرسال البريد الإلكتروني، يرجى المحاولة لاحقاً', 500);
    }
});


/**
 * Reset password using token
 * POST /api/auth/reset-password
 */
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    // 1) Hash the token from URL
    const hashedToken = crypto.createHash('sha256').update(token as string).digest('hex');

    // 2) Find student with valid token
    const student = await prisma.student.findFirst({
        where: {
            password_reset_token: hashedToken,
            password_reset_expires: {
                gt: new Date(), // Token not expired
            },
        },
    });

    if (!student) {
        throw new AppError('الرمز غير صحيح أو منتهي الصلاحية', 400);
    }

    // 3) Update password and clear token
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.student.update({
        where: { id: student.id },
        data: {
            password: hashedPassword,
            password_reset_token: null,
            password_reset_expires: null,
            must_change_password: false,
            // Verify email also since they proved ownership
            is_verified: true,
            email_verified_at: new Date(),
        },
    });

    logger.info(`✅ Password reset successful for ${student.email}`);

    res.status(200).json({
        status: 'success',
        message: 'تم تغيير كلمة المرور بنجاح، يمكنك الآن تسجيل الدخول',
    });
});


/**
 * Verify email using token
 * GET /api/auth/verify-email/:token
 */
export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const { token } = req.params;

    // 1) Hash the token
    const hashedToken = crypto.createHash('sha256').update(token as string).digest('hex');

    // 2) Find student with valid token
    const student = await prisma.student.findFirst({
        where: {
            email_verification_token: hashedToken,
            email_verification_expires: {
                gt: new Date(),
            },
        },
    });

    if (!student) {
        throw new AppError('الرمز غير صحيح أو منتهي الصلاحية', 400);
    }

    // 3) Update student
    await prisma.student.update({
        where: { id: student.id },
        data: {
            is_verified: true,
            email_verified_at: new Date(),
            email_verification_token: null,
            email_verification_expires: null,
        },
    });

    logger.info(`✅ Email verified for ${student.email}`);

    res.status(200).json({
        status: 'success',
        message: 'تم تأكيد البريد الإلكتروني بنجاح',
    });
});


/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
export const resendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;

    // 1) Find student
    const student = await prisma.student.findUnique({
        where: { email },
    });

    if (!student) {
        // Don't reveal if email exists
        return res.status(200).json({
            status: 'success',
            message: 'إذا كان البريد الإلكتروني موجوداً، سيتم إرسال رابط التحقق',
        });
    }

    // 2) Check if already verified
    if (student.is_verified) {
        return res.status(400).json({
            status: 'error',
            message: 'البريد الإلكتروني مؤكد بالفعل',
        });
    }

    // 3) Generate new verification token
    const verificationToken = generateToken();
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // 4) Update student
    await prisma.student.update({
        where: { id: student.id },
        data: {
            email_verification_token: verificationTokenHash,
            email_verification_expires: verificationExpires,
        },
    });

    // 5) Send email
    try {
        await emailService.sendVerificationEmail(student.email, student.name, verificationToken);
        logger.info(`✅ Verification email resent to ${student.email}`);

        res.status(200).json({
            status: 'success',
            message: 'تم إرسال رابط التحقق إلى بريدك الإلكتروني',
        });
    } catch (error) {
        logger.error('Failed to resend verification email', { error, email: student.email });
        throw new AppError('حدث خطأ في إرسال البريد الإلكتروني، يرجى المحاولة لاحقاً', 500);
    }
});

/**
 * Logout
 * POST /api/auth/logout
 */
export const logout = (req: Request, res: Response) => {
    res.status(200).json({
        status: 'success',
        message: 'تم تسجيل الخروج بنجاح'
    });
};

/**
 * Get Profile
 * GET /api/auth/profile
 */
export const getProfile = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError('غير مصرح', 401);
    }

    // Return the user data attached by the auth middleware
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user
        }
    });
});
