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
import { authLimiter } from "../middleware/rateLimiter";

const router = express.Router();

// Login route - Rate limited to prevent brute force
router.post("/login",
    authLimiter,       // Rate limit login attempts
    validateRequest,   // Validate request
    login              // Login
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
    authLimiter,       // Rate limit to prevent abuse
    validateRequest,
    forgotPassword
);

/**
 * POST /api/auth/reset-password
 * Reset password using token from email (Public route)
 */
router.post("/reset-password",
    authLimiter,       // Rate limit to prevent abuse
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
