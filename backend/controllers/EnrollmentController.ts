import { Request, Response } from 'express';
import { PrismaClient, SubjectResultStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class EnrollmentController {
    /**
     * POST /api/v1/enrollment
     * تسجيل طالب في مواد
     */
    static async createEnrollment(req: Request, res: Response) {
        try {
            const { student_id, material_id, academic_year, result_status, is_carried } = req.body;

            if (!student_id || !material_id || !academic_year) {
                return res.status(400).json({
                    success: false,
                    message: 'student_id, material_id, and academic_year are required',
                });
            }

            const enrollment = await prisma.enrollment.create({
                data: {
                    student_id: BigInt(student_id),
                    material_id: BigInt(material_id),
                    academic_year,
                    result_status: result_status || 'IN_PROGRESS',
                    is_carried: is_carried || false,
                },
                include: {
                    material: true,
                    student: {
                        select: {
                            id: true,
                            name: true,
                            student_id: true,
                        },
                    },
                },
            });

            const serialized = JSON.parse(
                JSON.stringify(enrollment, (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value
                )
            );

            res.status(201).json({
                success: true,
                message: 'Enrollment created successfully',
                data: serialized,
            });
        } catch (error: any) {
            if (error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    message: 'Student already enrolled in this material for the academic year',
                });
            }

            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * PUT /api/v1/enrollment/:id/status
     * تحديث حالة المادة (ناجح/راسب/محروم)
     */
    static async updateEnrollmentStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { result_status } = req.body;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Enrollment ID is required',
                });
            }

            if (!result_status) {
                return res.status(400).json({
                    success: false,
                    message: 'result_status is required',
                });
            }

            // التحقق من صحة الحالة
            const validStatuses: SubjectResultStatus[] = [
                'PASSED',
                'FAILED',
                'BLOCKED_BY_ABSENCE',
                'IN_PROGRESS',
            ];

            if (!validStatuses.includes(result_status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
                });
            }

            const enrollment = await prisma.enrollment.update({
                where: { id: BigInt(id as string) },
                data: { result_status },
                include: {
                    material: true,
                    student: {
                        select: {
                            id: true,
                            name: true,
                            student_id: true,
                        },
                    },
                },
            });

            const serialized = JSON.parse(
                JSON.stringify(enrollment, (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value
                )
            );

            res.status(200).json({
                success: true,
                message: 'Enrollment status updated successfully',
                data: serialized,
            });
        } catch (error: any) {
            if (error.code === 'P2025') {
                return res.status(404).json({
                    success: false,
                    message: 'Enrollment not found',
                });
            }

            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * GET /api/v1/enrollment/student/:studentId
     * جلب تسجيلات الطالب
     */
    static async getStudentEnrollments(req: Request, res: Response) {
        try {
            const { studentId } = req.params;
            const { academic_year } = req.query;

            if (!studentId) {
                return res.status(400).json({
                    success: false,
                    message: 'studentId is required',
                });
            }

            const where: any = { student_id: BigInt(studentId as string) };
            if (academic_year) {
                where.academic_year = academic_year;
            }

            const enrollments = await prisma.enrollment.findMany({
                where,
                include: {
                    material: {
                        include: {
                            stage: true,
                            department: true,
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
            });

            const serialized = JSON.parse(
                JSON.stringify(enrollments, (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value
                )
            );

            res.status(200).json({
                success: true,
                data: serialized,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * PUT /api/v1/enrollment/bulk-update-status
     * تحديث جماعي لحالات المواد
     */
    static async bulkUpdateStatus(req: Request, res: Response) {
        try {
            const { updates } = req.body;

            if (!Array.isArray(updates) || updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'updates array is required',
                });
            }

            const results = [];

            for (const update of updates) {
                try {
                    const enrollment = await prisma.enrollment.update({
                        where: { id: BigInt(update.id) },
                        data: { result_status: update.result_status },
                    });

                    results.push({
                        success: true,
                        id: update.id,
                        enrollment: JSON.parse(
                            JSON.stringify(enrollment, (key, value) =>
                                typeof value === 'bigint' ? value.toString() : value
                            )
                        ),
                    });
                } catch (error: any) {
                    results.push({
                        success: false,
                        id: update.id,
                        error: error.message,
                    });
                }
            }

            res.status(200).json({
                success: true,
                message: 'Bulk update completed',
                data: results,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * POST /api/v1/enrollment/bulk-create
     * تسجيل جماعي للطلاب في المواد
     */
    static async bulkCreateEnrollments(req: Request, res: Response) {
        try {
            const { student_id, material_ids, academic_year } = req.body;

            if (!student_id || !Array.isArray(material_ids) || !academic_year) {
                return res.status(400).json({
                    success: false,
                    message: 'student_id, material_ids (array), and academic_year are required',
                });
            }

            const results = [];

            for (const material_id of material_ids) {
                try {
                    const enrollment = await prisma.enrollment.create({
                        data: {
                            student_id: BigInt(student_id),
                            material_id: BigInt(material_id),
                            academic_year,
                            result_status: 'IN_PROGRESS',
                            is_carried: false,
                        },
                        include: {
                            material: true,
                        },
                    });

                    results.push({
                        success: true,
                        material_id,
                        enrollment: JSON.parse(
                            JSON.stringify(enrollment, (key, value) =>
                                typeof value === 'bigint' ? value.toString() : value
                            )
                        ),
                    });
                } catch (error: any) {
                    results.push({
                        success: false,
                        material_id,
                        error: error.message,
                    });
                }
            }

            res.status(201).json({
                success: true,
                message: 'Bulk enrollment completed',
                data: results,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * DELETE /api/v1/enrollment/:id
     * حذف تسجيل
     */
    static async deleteEnrollment(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Enrollment ID is required',
                });
            }

            await prisma.enrollment.delete({
                where: { id: BigInt(id as string) },
            });

            res.status(200).json({
                success: true,
                message: 'Enrollment deleted successfully',
            });
        } catch (error: any) {
            if (error.code === 'P2025') {
                return res.status(404).json({
                    success: false,
                    message: 'Enrollment not found',
                });
            }

            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
}
