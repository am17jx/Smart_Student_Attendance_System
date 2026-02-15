import { Router } from 'express';
import { PromotionController } from '../controllers/PromotionController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = Router();

// كل مسارات الترحيل تتط لب صلاحيات الأدمن فقط
router.use(authMiddleware as any);
router.use(adminMiddleware as any);

// معاينة الترحيل
router.get('/preview', PromotionController.getPromotionPreview);

// جلب الطلاب المؤهلين (مبسّط - بالسنة فقط)
router.get('/eligible', PromotionController.getEligibleStudents);

// تنفيذ الترحيل
router.post('/execute', PromotionController.executePromotion);

// ترحيل طلاب محددين
router.post('/execute-selected', PromotionController.executeSelectedPromotion);

// سجل الترحيل لطالب
router.get('/history/:studentId', PromotionController.getStudentHistory);

// إعدادات الترحيل
router.get('/config/:departmentId', PromotionController.getConfig);
router.put('/config/:departmentId', PromotionController.updateConfig);

export default router;
