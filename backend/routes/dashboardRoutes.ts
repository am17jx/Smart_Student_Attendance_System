
import express from 'express';
import { getAdminDashboard, getTeacherDashboard, getStudentDashboard } from '../controllers/DashboardController';
import { authMiddleware, adminAuthMiddleware, teacherAuthMiddleware, studentAuthMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// protect all routes
router.use(authMiddleware);

router.get('/admin', adminAuthMiddleware, getAdminDashboard);
router.get('/teacher', teacherAuthMiddleware, getTeacherDashboard);
router.get('/student', studentAuthMiddleware, getStudentDashboard);

export default router;
