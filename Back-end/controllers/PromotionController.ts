import { Request, Response } from 'express';
import { PromotionService } from '../services/PromotionService';

export class PromotionController {
    /**
     * GET /api/v1/promotion/preview
     * معاينة نتائج الترحيل قبل التنفيذ
     */
    static async getPromotionPreview(req: Request, res: Response) {
        try {
            const { department_id, stage_id, academic_year } = req.query;

            if (!department_id || !stage_id || !academic_year) {
                return res.status(400).json({
                    success: false,
                    message: 'department_id, stage_id, and academic_year are required',
                });
            }

            const preview = await PromotionService.getPromotionPreview(
                BigInt(department_id as string),
                BigInt(stage_id as string),
                academic_year as string
            );

            // تحويل BigInt إلى String للـ JSON
            const serializedPreview = JSON.parse(
                JSON.stringify(preview, (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value
                )
            );

            res.status(200).json({
                success: true,
                data: serializedPreview,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * POST /api/v1/promotion/execute
     * تنفيذ عملية الترحيل الفعلية
     */
    static async executePromotion(req: Request, res: Response) {
        try {
            const { department_id, stage_id, from_year, to_year } = req.body;
            const processedBy = (req as any).user?.name || 'Admin';

            if (!department_id || !stage_id || !from_year || !to_year) {
                return res.status(400).json({
                    success: false,
                    message: 'department_id, stage_id, from_year, and to_year are required',
                });
            }

            const results = await PromotionService.processPromotion(
                BigInt(department_id as string),
                BigInt(stage_id as string),
                from_year,
                to_year,
                processedBy
            );

            // تحويل BigInt إلى String
            const serializedResults = JSON.parse(
                JSON.stringify(results, (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value
                )
            );

            res.status(200).json({
                success: true,
                message: 'Promotion process completed',
                data: serializedResults,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * GET /api/v1/promotion/history/:studentId
     * جلب سجل الترحيل لطالب
     */
    static async getStudentHistory(req: Request, res: Response) {
        try {
            const { studentId } = req.params;

            if (!studentId) {
                return res.status(400).json({
                    success: false,
                    message: 'studentId is required',
                });
            }

            const history = await PromotionService.getStudentPromotionHistory(BigInt(studentId as string));

            const serializedHistory = JSON.parse(
                JSON.stringify(history, (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value
                )
            );

            res.status(200).json({
                success: true,
                data: serializedHistory,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * GET /api/v1/promotion/config/:departmentId
     * جلب إعدادات الترحيل للقسم
     */
    static async getConfig(req: Request, res: Response) {
        try {
            const { departmentId } = req.params;

            if (!departmentId) {
                return res.status(400).json({
                    success: false,
                    message: 'departmentId is required',
                });
            }

            const config = await PromotionService.getPromotionConfig(BigInt(departmentId as string));

            res.status(200).json({
                success: true,
                data: config,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * PUT /api/v1/promotion/config/:departmentId
     * تحديث إعدادات الترحيل
     */
    static async updateConfig(req: Request, res: Response) {
        try {
            const { departmentId } = req.params;
            const configData = req.body;

            if (!departmentId) {
                return res.status(400).json({
                    success: false,
                    message: 'departmentId is required',
                });
            }

            const config = await PromotionService.upsertPromotionConfig(
                BigInt(departmentId as string),
                configData
            );

            const serializedConfig = JSON.parse(
                JSON.stringify(config, (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value
                )
            );

            res.status(200).json({
                success: true,
                message: 'Promotion config updated successfully',
                data: serializedConfig,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
}
