import express from "express";
import { validateRequest } from "../middleware/validateRequest";
import { teacherAuthMiddleware, studentAuthMiddleware, adminAuthMiddleware } from "../middleware/authMiddleware";
import { apiLimiter } from "../middleware/rateLimitMiddleware";
import { getSessionAttendance, getStudentAttendance, updateAttendance, generateAttendanceReport } from "../controllers/AttendanceController";


// NOTE: Students mark attendance via QR code scanning
// See /api/qrcodes/validate endpoint in qrcodeRoutes.ts 

const router = express.Router();

// GET /attendance/session/:sessionId - Get attendance for a session (Teacher)
router.get("/session/:sessionId", apiLimiter, teacherAuthMiddleware, getSessionAttendance);

// GET /attendance/student/:studentId - Get attendance for a student (Teacher)
router.get("/student/:studentId", apiLimiter, teacherAuthMiddleware, getStudentAttendance);

// GET /attendance/report/:sessionId - Generate attendance report (Teacher)
router.get("/report/:sessionId", apiLimiter, teacherAuthMiddleware, generateAttendanceReport);

// PUT /attendance/:id - Update attendance record (Teacher)
router.put("/:id", apiLimiter, teacherAuthMiddleware, validateRequest, updateAttendance);

export default router;