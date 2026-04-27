/// <reference path="../types/express.d.ts" />

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { prisma } from "../prisma/client";
import { validationResult } from "express-validator";
import crypto from "node:crypto";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";
import { logFailedAttemptUtil } from "../utils/FailedAttemptUtill";
import emailService from "../utils/emailService";
import logger from "../utils/logger";
import { invalidateCachePattern } from "../utils/cacheUtils";
dotenv.config();


function generateTempPassword(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numChars = "0123456789";
    const specialChars = "!@#$%^&*()";

    let password = "";
    password += chars[Math.floor(Math.random() * chars.length)];
    password += upperChars[Math.floor(Math.random() * upperChars.length)];
    password += numChars[Math.floor(Math.random() * numChars.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    const allChars = chars + upperChars + numChars + specialChars;
    for (let i = 0; i < 6; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password.split('').sort(() => 0.5 - Math.random()).join('');
}

export function validateStrongPassword(password: string | undefined): void {
    if (!password) return; // Skip if no password provided (e.g., auto-generate cases)
    const minLength = 8;
    const maxLength = 50;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?\":{}|<>]/.test(password);

    if (password.length < minLength || password.length > maxLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        throw new AppError("كلمة المرور يجب أن تكون بين 8 و 50 حرفاً وأن تحتوي على الأقل على: حرف كبير، حرف صغير، رقم، ورمز خاص.", 400);
    }
}

export function validateEmail(email: string | undefined): void {
    if (!email) {
        throw new AppError("البريد الإلكتروني مطلوب", 400);
    }
    if (email.length > 100) {
        throw new AppError("البريد الإلكتروني يجب أن لا يتجاوز 100 حرف", 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new AppError("البريد الإلكتروني غير صالح", 400);
    }
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

    const { name, email, departmentId, password } = req.body;

    if (!name) {
        throw new AppError("Name is required", 400);
    }

    validateEmail(email);

    // Check if email already exists
    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
        throw new AppError("Email already exists", 400);
    }

    // Generate or use provided password
    const finalPassword = password || generateTempPassword();
    if (password) validateStrongPassword(password);
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    // Create new admin — must_change_password=true only when password was auto-generated
    const newAdmin = await prisma.admin.create({
        data: {
            name,
            email,
            password: hashedPassword,
            department_id: departmentId ? BigInt(departmentId) : null,
            role: departmentId ? 'DEPARTMENT_HEAD' : 'DEAN',
            must_change_password: !password // true if temp-generated, false if admin set it manually
        },
    });

    logger.info(`[ADMIN] New admin created: ${email}, ID: ${newAdmin.id}`);

    emailService.sendTempPasswordEmail(email, name, finalPassword, true)
        .then(() => logger.info(`✅ Welcome email sent to admin: ${email}`))
        .catch(err => logger.error(`❌ Failed to send welcome email to admin ${email}`, err));

    res.status(201).json({
        status: "success",
        message: "Admin created successfully. Password sent via secure channel.",
        user: {
            id: newAdmin.id.toString(),
            name: newAdmin.name,
            email: newAdmin.email,
        },
    });
});


// List all admins
export const getAllAdmins = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const admins = await prisma.admin.findMany({
        include: {
            department: true
        },
        orderBy: { created_at: 'desc' }
    });

    res.status(200).json({
        status: "success",
        results: admins.length,
        data: {
            admins: admins.map(admin => ({
                ...admin,
                id: admin.id.toString(),
                department_id: admin.department_id?.toString(),
            }))
        }
    });
});

// Delete an admin
export const deleteAdmin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const admin = await prisma.admin.findUnique({
        where: { id: BigInt(id as string) }
    });

    if (!admin) {
        throw new AppError("Admin not found", 404);
    }

    // Optional: Prevent deleting self
    if (req.user && req.user.id === admin.id.toString()) {
        throw new AppError("You cannot delete your own account", 400);
    }

    await prisma.admin.delete({
        where: { id: BigInt(id as string) }
    });

    res.status(200).json({
        status: "success",
        message: "Admin deleted successfully"
    });
});


// Update an existing admin
export const updateAdmin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, email, departmentId, password } = req.body;

    const existingAdmin = await prisma.admin.findUnique({
        where: { id: BigInt(id as string) }
    });

    if (!existingAdmin) {
        throw new AppError("Admin not found", 404);
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) {
        validateEmail(email);
        const emailExists = await prisma.admin.findFirst({
            where: {
                email,
                id: { not: BigInt(id as string) }
            }
        });
        if (emailExists) throw new AppError("Email already in use", 400);
        updateData.email = email;
    }

    if (departmentId !== undefined) {
        updateData.department_id = departmentId ? BigInt(departmentId as string) : null;
        updateData.role = departmentId ? 'DEPARTMENT_HEAD' : 'DEAN';
    }

    if (password) {
        validateStrongPassword(password);
        updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedAdmin = await prisma.admin.update({
        where: { id: BigInt(id as string) },
        data: updateData,
        include: { department: true }
    });

    res.status(200).json({
        status: "success",
        data: {
            admin: {
                ...updatedAdmin,
                id: updatedAdmin.id.toString(),
                department_id: updatedAdmin.department_id?.toString()
            }
        }
    });
});


//teacher signed by admin
export const Teacher_sign = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, departmentId, password } = req.body;

    if (!name) {
        throw new AppError("Name is required", 400);
    }

    validateEmail(email);

    // ✅ Generate or use provided password
    const finalPassword = password || generateTempPassword();

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

    if (password) validateStrongPassword(password);
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    const newUser = await prisma.teacher.create({
        data: {
            name,
            email,
            password: hashedPassword,
            department_id: departmentId ? BigInt(departmentId) : null,
            must_change_password: !password // true if temp-generated, false if admin set it manually
        },
    });

    logger.info(`[ADMIN] Teacher created: ${email}, ID: ${newUser.id}`);

    // ✅ Send temporary/initial password in background
    emailService.sendTempPasswordEmail(email, name, finalPassword, true)
        .then(() => logger.info(`✅ Welcome email sent to teacher: ${email}`))
        .catch(err => logger.error(`❌ Failed to send welcome email to teacher ${email}`, err));

    res.status(201).json({
        status: "success",
        message: "Teacher created successfully. Password sent via secure channel.",
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

    const { name, email, stageId, departmentId, studentId, password } = req.body;

    if (!name) {
        throw new AppError("Name is required", 400);
    }

    validateEmail(email);

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

    const tempPassword = password || generateTempPassword();
    if (password) validateStrongPassword(password);
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

        // Invalidate students cache
        await invalidateCachePattern("students:*");

        emailService.sendWelcomeEmail(email, name, tempPassword)
            .then(() => logger.info(`✅ Welcome email sent to ${email}`))
            .catch(err => logger.error(`❌ Failed to send welcome email to ${email}`, err));

        res.status(201).json({
            status: "success",
            message: "Student created successfully. Emails are being sent in the background.",
            user: {
                id: newUser.id.toString(),
                name: newUser.name,
                email: newUser.email,
            },
        });
    } catch (error) {
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

    validateStrongPassword(newPassword);
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

    validateStrongPassword(newPassword);
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.student.update({
        where: { id: BigInt(studentId as string) },
        data: { password: hashedNewPassword, must_change_password: false, is_verified: true },
    });

    logger.info(`[AUTH] Password changed for student: ${user.email}`);

    res.status(200).json({
        status: "success",
        message: "Password changed successfully",
    });
})


// ✅ Change password using JWT identity (no studentId in URL needed)
export const changeMyPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }

    const { newPassword, oldPassword } = req.body;
    const userId = BigInt(req.user.id);
    const role = req.user.role;

    if (!newPassword) {
        throw new AppError("New password is required", 400);
    }
    validateStrongPassword(newPassword);

    if (role === 'student') {
        const user = await prisma.student.findUnique({ where: { id: userId } });
        if (!user) throw new AppError("User not found", 404);

        // If must_change_password, skip old password check (temp password flow)
        if (!user.must_change_password) {
            if (!oldPassword) throw new AppError("Current password is required", 400);
            const valid = await bcrypt.compare(oldPassword, user.password);
            if (!valid) throw new AppError("Current password is incorrect", 401);
        }

        validateStrongPassword(newPassword);
        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.student.update({
            where: { id: userId },
            data: { password: hashed, must_change_password: false, is_verified: true },
        });
    } else if (role === 'teacher') {
        const user = await prisma.teacher.findUnique({ where: { id: userId } });
        if (!user) throw new AppError("User not found", 404);

        // Skip old password check for temp-password flow
        if (!user.must_change_password) {
            if (!oldPassword) throw new AppError("Current password is required", 400);
            const valid = await bcrypt.compare(oldPassword, user.password);
            if (!valid) throw new AppError("Current password is incorrect", 401);
        }

        validateStrongPassword(newPassword);
        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.teacher.update({
            where: { id: userId },
            data: { password: hashed, must_change_password: false },
        });
    } else if (role === 'admin') {
        const user = await prisma.admin.findUnique({ where: { id: userId } });
        if (!user) throw new AppError("User not found", 404);

        // Skip old password check for temp-password flow
        if (!user.must_change_password) {
            if (!oldPassword) throw new AppError("Current password is required", 400);
            const valid = await bcrypt.compare(oldPassword, user.password);
            if (!valid) throw new AppError("Current password is incorrect", 401);
        }

        validateStrongPassword(newPassword);
        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.admin.update({
            where: { id: userId },
            data: { password: hashed, must_change_password: false },
        });
    } else {
        throw new AppError("Not allowed for this role", 403);
    }

    logger.info(`[AUTH] Password changed via /change-my-password for user: ${req.user.id} (${role})`);

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
    validateStrongPassword(tempPassword);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.student.update({
        where: { id: BigInt(studentId as string) },
        data: { password: hashedPassword, must_change_password: true },
    });

    logger.info(`[ADMIN] Password reset for student: ${user.email}`);

    // ✅ Send new temporary password in background
    emailService.sendTempPasswordEmail(user.email, user.name, tempPassword, false)
        .then(() => logger.info(`✅ Reset password email sent to student: ${user.email}`))
        .catch(err => logger.error(`❌ Failed to send reset password email to student ${user.email}`, err));

    res.status(200).json({
        status: "success",
        message: "Password reset successfully. New password sent via email.",
    });
});


export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    handleValidationErrors(req, res);

    const { email, password, fingerprint, role: selectedRole } = req.body;

    validateEmail(email);

    const signToken = (payload: any) =>
        jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "24h" });

    // 1) Find all potential users across tables (Case-Insensitive)
    const [admin, teacher, student] = await Promise.all([
        prisma.admin.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true, name: true, email: true, password: true, role: true, must_change_password: true, department_id: true } }),
        prisma.teacher.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } }),
        prisma.student.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } })
    ]);

    // 2) Verify password for each found record
    const validCandidates: any[] = [];

    if (admin && await bcrypt.compare(password, admin.password)) {
        validCandidates.push({ type: 'admin', user: admin, adminRole: admin.role });
    }
    if (teacher && await bcrypt.compare(password, teacher.password)) {
        validCandidates.push({ type: 'teacher', user: teacher });
    }
    if (student && await bcrypt.compare(password, student.password)) {
        validCandidates.push({ type: 'student', user: student });
    }

    console.log(`[LoginDebug] Email: ${email}, Found records: Admin=${!!admin}, Teacher=${!!teacher}, Student=${!!student}`);
    console.log(`[LoginDebug] Valid candidates found: ${validCandidates.length} (${validCandidates.map(c => c.type).join(', ')})`);

    // 3) Handle no matches
    if (validCandidates.length === 0) {
        // Log failed attempt for student if they exist but password was wrong
        if (student) {
            await logFailedAttemptUtil({
                errorType: "INVALID_CREDENTIALS",
                errorMessage: `Student login failed: Invalid password for ${email}`,
                studentId: student.id.toString(),
                sessionId: null,
                fingerprintHash: fingerprint ? hashFingerprint(fingerprint) : null,
                deviceInfo: req.headers["user-agent"] || "Unknown",
                ipAddress: req.ip || req.socket.remoteAddress || "Unknown",
            });
        }
        throw new AppError("Invalid email or password", 401);
    }

    // 4) Role Selection Logic
    let activeCandidate = null;

    if (selectedRole) {
        activeCandidate = validCandidates.find(c => c.type === selectedRole);
        if (!activeCandidate) {
            throw new AppError(`You do not have the role: ${selectedRole}`, 403);
        }
    } else if (validCandidates.length === 1) {
        activeCandidate = validCandidates[0];
    } else {
        // Multiple valid roles detected, return choice to frontend
        return res.status(200).json({
            status: "multi_role",
            message: "Multiple roles detected. Please select one.",
            data: {
                roles: validCandidates.map(c => ({
                    role: c.type,
                    name: c.user.name,
                    label: c.type === 'admin'
                        ? (c.user.role === 'UNIVERSITY_ADMIN' ? 'مدير جامعة' : c.user.role === 'DEAN' ? 'عميد' : 'رئيس قسم')
                        : (c.type === 'teacher' ? 'أستاذ' : 'طالب')
                }))
            }
        });
    }

    const { type: role, user } = activeCandidate;
    const token = signToken({ id: user.id.toString(), email: user.email, role });

    // 5) Role-Specific Processing (Admin/Teacher)
    if (role === 'admin' || role === 'teacher') {
        if (user.must_change_password) {
            return res.status(200).json({
                status: "must_change_password",
                message: "يرجى تغيير كلمة المرور المؤقتة لمتابعة استخدام النظام.",
                data: {
                    token,
                    user: {
                        id: user.id.toString(),
                        name: user.name,
                        email: user.email,
                        role: role,
                        department_id: user.department_id ? user.department_id.toString() : undefined
                    },
                    redirect: "/change-password",
                }
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Login successful",
            data: {
                token,
                user: {
                    id: user.id.toString(),
                    name: user.name,
                    email: user.email,
                    role: role,
                    department_id: user.department_id ? user.department_id.toString() : undefined
                }
            }
        });
    }

    // 6) Student-Specific Processing
    if (role === 'student') {
        const studentUser = user;

        if (studentUser.must_change_password) {
            return res.status(200).json({
                status: "must_change_password",
                message: "يرجى تغيير كلمة المرور المؤقتة لمتابعة استخدام النظام.",
                data: {
                    token,
                    user: {
                        id: studentUser.id.toString(),
                        name: studentUser.name,
                        email: studentUser.email,
                        role: "student"
                    },
                    studentId: studentUser.id.toString(),
                    redirect: "/change-password",
                }
            });
        }

        if (!studentUser.is_verified) {
            await logFailedAttemptUtil({
                errorType: "EMAIL_NOT_VERIFIED",
                errorMessage: `Student login failed: Email not verified for ${email}`,
                studentId: studentUser.id.toString(),
                sessionId: null,
                fingerprintHash: fingerprint ? hashFingerprint(fingerprint) : null,
                deviceInfo: req.headers["user-agent"] || "Unknown",
                ipAddress: req.ip || req.socket.remoteAddress || "Unknown",
            });
            throw new AppError("يرجى تفعيل بريدك الإلكتروني أولاً. تحقق من بريدك الوارد.", 403);
        }

        if (fingerprint) {
            const fpHash = hashFingerprint(fingerprint);
            if (!studentUser.fingerprint_hash) {
                await prisma.student.update({ where: { id: studentUser.id }, data: { fingerprint_hash: fpHash } });
            } else if (studentUser.fingerprint_hash !== fpHash) {
                await logFailedAttemptUtil({
                    errorType: "FINGERPRINT_MISMATCH",
                    errorMessage: `Student login failed: Device fingerprint mismatch for ${email}`,
                    studentId: studentUser.id.toString(),
                    sessionId: null,
                    fingerprintHash: fpHash,
                    deviceInfo: req.headers["user-agent"] || "Unknown",
                    ipAddress: req.ip || req.socket.remoteAddress || "Unknown",
                });
                throw new AppError("Access denied: You are using a different browser or device.", 403);
            }
        }

        // Send login notification email
        const ipAddress = req.ip || req.socket.remoteAddress;
        emailService.sendLoginNotification(studentUser.email, studentUser.name, new Date(), ipAddress)
            .then(() => logger.info(`✅ Login notification sent to ${studentUser.email}`))
            .catch((error) => logger.error('Failed to send login notification', { error, email: studentUser.email }));

        return res.status(200).json({
            status: "success",
            message: "Login successful",
            data: {
                token,
                user: {
                    id: studentUser.id.toString(),
                    name: studentUser.name,
                    email: studentUser.email,
                    role: "student",
                    department_id: studentUser.department_id ? studentUser.department_id.toString() : undefined
                }
            }
        });
    }

    throw new AppError("Unauthorized", 401);
});


/**
 * Send password reset email
 * POST /api/auth/forgot-password
 */
export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;

    let userType: 'student' | 'teacher' | 'admin' | null = null;
    let user: any = null;

    // 1) Submit to Students First
    const student = await prisma.student.findUnique({ where: { email } });
    if (student) {
        userType = 'student';
        user = student;
    }

    // 2) Then Teachers
    if (!user) {
        const teacher = await prisma.teacher.findUnique({ where: { email } });
        if (teacher) {
            userType = 'teacher';
            user = teacher;
        }
    }

    // 3) Then Admins
    if (!user) {
        const admin = await prisma.admin.findUnique({ where: { email } });
        if (admin) {
            userType = 'admin';
            user = admin;
        }
    }

    if (!user) {
        // User requested to explicitly know if account exists
        throw new AppError('ليس لديك حساب في الموقع', 404);
    }

    // 2) Generate reset token
    const resetToken = generateToken();
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // 3) Save token to database based on user type
    if (userType === 'student') {
        await prisma.student.update({
            where: { id: user.id },
            data: { password_reset_token: resetTokenHash, password_reset_expires: resetExpires },
        });
    } else if (userType === 'teacher') {
        await prisma.teacher.update({
            where: { id: user.id },
            data: { password_reset_token: resetTokenHash, password_reset_expires: resetExpires },
        });
    } else if (userType === 'admin') {
        await prisma.admin.update({
            where: { id: user.id },
            data: { password_reset_token: resetTokenHash, password_reset_expires: resetExpires },
        });
    }

    // 4) Send email
    try {
        await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
        logger.info(`✅ Password reset email sent to ${user.email} (${userType})`);

        res.status(200).json({
            status: 'success',
            message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
        });
    } catch (error) {
        // Rollback token if email fails
        const clearData = { password_reset_token: null, password_reset_expires: null };
        if (userType === 'student') await prisma.student.update({ where: { id: user.id }, data: clearData });
        else if (userType === 'teacher') await prisma.teacher.update({ where: { id: user.id }, data: clearData });
        else if (userType === 'admin') await prisma.admin.update({ where: { id: user.id }, data: clearData });

        logger.error('Failed to send password reset email', { error, email: user.email });
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

    let userType: 'student' | 'teacher' | 'admin' | null = null;
    let user: any = null;

    // 2) Find user with valid token (Check all tables)
    // Check Student
    const student = await prisma.student.findFirst({
        where: {
            password_reset_token: hashedToken,
            password_reset_expires: { gt: new Date() },
        },
    });

    if (student) {
        userType = 'student';
        user = student;
    }

    // Check Teacher
    if (!user) {
        const teacher = await prisma.teacher.findFirst({
            where: {
                password_reset_token: hashedToken,
                password_reset_expires: { gt: new Date() },
            },
        });
        if (teacher) {
            userType = 'teacher';
            user = teacher;
        }
    }

    // Check Admin
    if (!user) {
        const admin = await prisma.admin.findFirst({
            where: {
                password_reset_token: hashedToken,
                password_reset_expires: { gt: new Date() },
            },
        });
        if (admin) {
            userType = 'admin';
            user = admin;
        }
    }

    if (!user) {
        throw new AppError('الرمز غير صحيح أو منتهي الصلاحية', 400);
    }

    // 3) Update password and clear token
    validateStrongPassword(newPassword);
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const updateData: any = {
        password: hashedPassword,
        password_reset_token: null,
        password_reset_expires: null,
    };

    if (userType === 'student') {
        updateData.must_change_password = false;
        updateData.is_verified = true;
        updateData.email_verified_at = new Date();
        await prisma.student.update({ where: { id: user.id }, data: updateData });
    } else if (userType === 'teacher') {
        await prisma.teacher.update({ where: { id: user.id }, data: updateData });
    } else if (userType === 'admin') {
        await prisma.admin.update({ where: { id: user.id }, data: updateData });
    }

    logger.info(`✅ Password reset successful for ${user.email} (${userType})`);

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

    const { id, role } = req.user;
    let userData: any = null;

    if (role === 'admin') {
        const admin = await prisma.admin.findUnique({
            where: { id: BigInt(id) },
            select: { id: true, name: true, email: true, role: true, department_id: true }
        });
        if (!admin) throw new AppError('المستخدم غير موجود', 404);
        userData = {
            id: admin.id.toString(),
            name: admin.name,
            email: admin.email,
            role: 'admin',
            department_id: admin.department_id ? admin.department_id.toString() : undefined
        };
    } else if (role === 'teacher') {
        const teacher = await prisma.teacher.findUnique({
            where: { id: BigInt(id) },
            select: { id: true, name: true, email: true }
        });
        if (!teacher) throw new AppError('المستخدم غير موجود', 404);
        userData = {
            id: teacher.id.toString(),
            name: teacher.name,
            email: teacher.email,
            role: 'teacher'
        };
    } else if (role === 'student') {
        const student = await prisma.student.findUnique({
            where: { id: BigInt(id) },
            select: { id: true, name: true, email: true, department_id: true, stage_id: true }
        });
        if (!student) throw new AppError('المستخدم غير موجود', 404);
        userData = {
            id: student.id.toString(),
            name: student.name,
            email: student.email,
            role: 'student',
            department_id: student.department_id ? student.department_id.toString() : undefined
        };
    } else {
        throw new AppError('دور غير معروف', 403);
    }

    res.status(200).json({
        status: 'success',
        data: {
            user: userData
        }
    });
});
