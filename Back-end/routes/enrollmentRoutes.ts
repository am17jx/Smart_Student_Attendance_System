import { Router } from 'express';
import { EnrollmentController } from '../controllers/EnrollmentController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = Router();

// كل مسارات التسجيل تتطلب صلاحيات الأدمن فقط
router.use(authMiddleware as any);
router.use(adminMiddleware as any);

// إنشاء تسجيل واحد
router.post('/', EnrollmentController.createEnrollment);

// تسجيل جماعي
router.post('/bulk-create', EnrollmentController.bulkCreateEnrollments);

// تحديث حالة تسجيل
router.put('/:id/status', EnrollmentController.updateEnrollmentStatus);

// تحديث جماعي للحالات
router.put('/bulk-update-status', EnrollmentController.bulkUpdateStatus);

// جلب تسجيلات طالب
router.get('/student/:studentId', EnrollmentController.getStudentEnrollments);

// حذف تسجيل
router.delete('/:id', EnrollmentController.deleteEnrollment);

export default router;
