import express from "express";
import {
    login,
    createAdmin,
    Teacher_sign,
    sign_student,
    change_student_password,
    reset_student_password,
    change_teacher_password,
    forgotPassword,
    resetPassword,
    verifyEmail,

    resendVerificationEmail,
    logout,
    getProfile
} from "../controllers/AuthController";
import { validateRequest } from "../middleware/validateRequest";
import { adminAuthMiddleware, authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Login route - NO rate limiting for Admin/Teacher, only Students (handled in controller)
router.post("/login",
    validateRequest,   // 1. Validate request
    login              // 2. Login (rate limiting for students only happens inside)
);

router.post("/logout", logout);
router.get("/profile", authMiddleware, getProfile);


// Create Admin (Admin-only) - No rate limiting
router.post("/admin/create",
    adminAuthMiddleware,  // Only admins can create other admins
    validateRequest,
    createAdmin
);


router.post("/admin/signin/teacher",
    adminAuthMiddleware,  // Only admins can create teachers
    validateRequest,
    Teacher_sign
);


router.post("/admin/signin/student",
    adminAuthMiddleware,  // Only admins can create students
    validateRequest,
    sign_student
);

router.post("/student/change-password/:studentId",
    authMiddleware,       // User must be authenticated
    validateRequest,
    change_student_password
);

router.post("/student/reset-password/:studentId",
    adminAuthMiddleware,  // Only admins can reset passwords
    validateRequest,
    reset_student_password
);


router.post("/teacher/change-password/:teacherId",
    authMiddleware,       // User must be authenticated
    validateRequest,
    change_teacher_password
);


// ============ Email-Based Authentication Routes ============

/**
 * POST /api/auth/forgot-password
 * Request password reset email (Public route)
 */
router.post("/forgot-password",
    validateRequest,
    forgotPassword
);

/**
 * POST /api/auth/reset-password
 * Reset password using token from email (Public route)
 */
router.post("/reset-password",
    validateRequest,
    resetPassword
);

/**
 * GET /api/auth/verify-email/:token
 * Verify email address using token (Public route)
 */
router.get("/verify-email/:token",
    verifyEmail
);

/**
 * POST /api/auth/resend-verification
 * Resend email verification link (Public route)
 */
router.post("/resend-verification",
    validateRequest,
    resendVerificationEmail
);


export default router;
