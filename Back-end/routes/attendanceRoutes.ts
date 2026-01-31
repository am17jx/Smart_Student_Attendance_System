import express from "express";
import { validateRequest } from "../middleware/validateRequest";
import { teacherAuthMiddleware, studentAuthMiddleware } from "../middleware/authMiddleware";
import { apiLimiter } from "../middleware/rateLimitMiddleware";
import { getSessionAttendance, getStudentAttendance, getMyAttendance, getMyAttendanceStats, getTeacherAttendanceStats, updateAttendance, generateAttendanceReport, getSessionAttendanceReport } from "../controllers/AttendanceController";


// NOTE: Students mark attendance via QR code scanning
// See /api/qrcodes/validate endpoint in qrcodeRoutes.ts 

const router = express.Router();

// GET /attendance/my-attendance - Get my attendance records (Student)
router.get("/my-attendance", apiLimiter, studentAuthMiddleware, getMyAttendance);

// GET /attendance/my-stats - Get my attendance statistics (Student)
router.get("/my-stats", apiLimiter, studentAuthMiddleware, getMyAttendanceStats);

// GET /attendance/teacher-stats - Get attendance statistics for a teacher (Teacher)
router.get("/teacher-stats", apiLimiter, teacherAuthMiddleware, getTeacherAttendanceStats);

// GET /attendance/session/:sessionId - Get attendance for a session (Teacher)
router.get("/session/:sessionId", apiLimiter, teacherAuthMiddleware, getSessionAttendance);

// GET /attendance/session/:sessionId/report - Get full attendance report (dept/stage-based) (Teacher)
router.get("/session/:sessionId/report", apiLimiter, teacherAuthMiddleware, getSessionAttendanceReport);

// GET /attendance/student/:studentId - Get attendance for a student (Teacher)
router.get("/student/:studentId", apiLimiter, teacherAuthMiddleware, getStudentAttendance);

// GET /attendance/report/:sessionId - Generate attendance report (Teacher)
router.get("/report/:sessionId", apiLimiter, teacherAuthMiddleware, generateAttendanceReport);

// PUT /attendance/:id - Update attendance record (Teacher)
router.put("/:id", apiLimiter, teacherAuthMiddleware, validateRequest, updateAttendance);

export default router;