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

// تنفيذ الترحيل
router.post('/execute', PromotionController.executePromotion);

// سجل الترحيل لطالب
router.get('/history/:studentId', PromotionController.getStudentHistory);

// إعدادات الترحيل
router.get('/config/:departmentId', PromotionController.getConfig);
router.put('/config/:departmentId', PromotionController.updateConfig);

export default router;
