import { PrismaClient, AcademicStatus, SubjectResultStatus, PromotionDecision } from '@prisma/client';

const prisma = new PrismaClient();

export interface PromotionPreviewStudent {
    studentId: bigint;
    studentName: string;
    studentNumber: string;
    currentStage: string | null;
    currentStageId: bigint | null;
    decision: PromotionDecision;
    failedCount: number;
    carriedCount: number;
    failedSubjects: Array<{ id: bigint; name: string }>;
    carriedSubjects: Array<{ id: bigint; name: string }>;
    nextStage: string | null;
    nextStageId: bigint | null;
}

export interface PromotionConfig {
    maxCarrySubjects: number;
    failThresholdForRepeat: number;
    disableCarryForFinalYear: boolean;
    blockCarryForCore: boolean;
    repeatMode: 'repeat_failed_only' | 'repeat_full_year';
}

export class PromotionService {
    /**
     * جلب جميع الطلاب المؤهلين للترحيل حسب السنة الدراسية فقط
     * بدون الحاجة لتحديد القسم أو المرحلة
     */
    static async getAllEligibleStudents(academicYear: string) {
        // جلب كل الطلاب الذين لديهم تسجيلات في هذه السنة
        const students = await prisma.student.findMany({
            where: {
                enrollments: {
                    some: {
                        academic_year: academicYear,
                    },
                },
            },
            include: {
                stage: true,
                department: true,
                enrollments: {
                    where: { academic_year: academicYear },
                    include: { material: true },
                },
            },
        });

        console.log(`[Eligible] Found ${students.length} students with enrollments in ${academicYear}`);

        const results = [];

        // تجميع المراحل لتحديد المرحلة التالية
        const stagesCache = new Map<string, any>();

        for (const student of students) {
            if (!student.stage_id || !student.department_id) {
                console.log(`[Eligible] Skipping student ${student.name} - no stage_id(${student.stage_id}) or department_id(${student.department_id})`);
                continue;
            }

            const config = await this.getPromotionConfig(student.department_id);
            const currentStage = student.stage;

            // كاش المراحل التالية
            let nextStage: any = null;
            if (currentStage) {
                const cacheKey = currentStage.id.toString();
                if (stagesCache.has(cacheKey)) {
                    nextStage = stagesCache.get(cacheKey);
                } else {
                    nextStage = await prisma.stage.findFirst({
                        where: { level: currentStage.level + 1 },
                    });
                    stagesCache.set(cacheKey, nextStage);
                }
            }

            const decision = await this.calculateStudentDecision(
                student, config, nextStage, currentStage
            );

            results.push({
                ...decision,
                departmentName: student.department?.name ?? null,
                departmentId: student.department_id,
            });
        }

        console.log(`[Eligible] Returning ${results.length} eligible students`);
        return results;
    }

    /**
     * ترحيل طلاب محددين فقط
     */
    static async executeSelectedPromotion(
        studentIds: bigint[],
        fromYear: string,
        toYear: string,
        processedBy: string
    ): Promise<any[]> {
        const results: any[] = [];

        for (const studentId of studentIds) {
            try {
                const student = await prisma.student.findUnique({
                    where: { id: studentId },
                    include: {
                        stage: true,
                        department: true,
                        enrollments: {
                            where: { academic_year: fromYear },
                            include: { material: true },
                        },
                    },
                });

                if (!student || !student.stage_id || !student.department_id) {
                    results.push({ success: false, studentId: studentId.toString(), error: 'Student not found' });
                    continue;
                }

                const config = await this.getPromotionConfig(student.department_id);
                const currentStage = student.stage;
                const nextStage = currentStage
                    ? await prisma.stage.findFirst({ where: { level: currentStage.level + 1 } })
                    : null;

                const decision = await this.calculateStudentDecision(
                    student, config, nextStage, currentStage
                );

                let result;
                if (decision.decision === 'PROMOTED') {
                    result = await this.promoteStudent(decision, fromYear, toYear, processedBy);
                } else if (decision.decision === 'PROMOTED_WITH_CARRY') {
                    result = await this.carryStudent(decision, fromYear, toYear, processedBy);
                } else if (decision.decision === 'REPEAT_YEAR') {
                    result = await this.repeatStudent(decision, fromYear, toYear, processedBy);
                }

                results.push({
                    success: true,
                    studentId: studentId.toString(),
                    studentName: student.name,
                    decision: decision.decision,
                    result,
                });
            } catch (error: any) {
                results.push({
                    success: false,
                    studentId: studentId.toString(),
                    error: error.message,
                });
            }
        }

        return results;
    }

    /**
     * معاينة نتائج الترحيل قبل التنفيذ
     */
    static async getPromotionPreview(
        departmentId: bigint,
        stageId: bigint,
        academicYear: string
    ): Promise<PromotionPreviewStudent[]> {
        // جلب الطلاب في القسم والمرحلة المحددة
        const students = await prisma.student.findMany({
            where: {
                department_id: departmentId,
                stage_id: stageId,
            },
            include: {
                stage: true,
                enrollments: {
                    where: {
                        academic_year: academicYear,
                    },
                    include: {
                        material: true,
                    },
                },
            },
        });

        // جلب إعدادات الترحيل للقسم
        const config = await this.getPromotionConfig(departmentId);

        // جلب المرحلة التالية
        const currentStage = await prisma.stage.findUnique({
            where: { id: stageId },
        });

        const nextStage = currentStage
            ? await prisma.stage.findFirst({
                where: {
                    level: currentStage.level + 1,
                },
            })
            : null;

        // حساب القرار لكل طالب
        const preview: PromotionPreviewStudent[] = [];

        for (const student of students) {
            const decision = await this.calculateStudentDecision(
                student,
                config,
                nextStage,
                currentStage
            );
            preview.push(decision);
        }

        return preview;
    }

    /**
     * تنفيذ عملية الترحيل الفعلية
     */
    static async processPromotion(
        departmentId: bigint,
        stageId: bigint,
        fromYear: string,
        toYear: string,
        processedBy: string
    ): Promise<any[]> {
        const preview = await this.getPromotionPreview(departmentId, stageId, fromYear);
        const results: any[] = [];

        for (const studentPreview of preview) {
            try {
                let result;

                if (studentPreview.decision === 'PROMOTED') {
                    result = await this.promoteStudent(studentPreview, fromYear, toYear, processedBy);
                } else if (studentPreview.decision === 'PROMOTED_WITH_CARRY') {
                    result = await this.carryStudent(studentPreview, fromYear, toYear, processedBy);
                } else if (studentPreview.decision === 'REPEAT_YEAR') {
                    result = await this.repeatStudent(studentPreview, fromYear, toYear, processedBy);
                }

                results.push({
                    success: true,
                    studentId: studentPreview.studentId,
                    decision: studentPreview.decision,
                    result,
                });
            } catch (error: any) {
                results.push({
                    success: false,
                    studentId: studentPreview.studentId,
                    error: error.message,
                });
            }
        }

        return results;
    }

    /**
     * حساب قرار الترحيل لطالب واحد
     */
    static async calculateStudentDecision(
        student: any,
        config: PromotionConfig,
        nextStage: any,
        currentStage: any
    ): Promise<PromotionPreviewStudent> {
        const failedSubjects = this.getFailedSubjects(student.enrollments);
        const failedCount = failedSubjects.length;

        let decision: PromotionDecision;
        let carriedSubjects: any[] = [];
        let carriedCount = 0;
        let targetStage = nextStage;
        let targetStageId = nextStage?.id ?? null;

        if (failedCount === 0) {
            // ناجح بالكامل - ترقية
            decision = 'PROMOTED';
        } else if (failedCount <= config.maxCarrySubjects) {
            // يمكن التحميل
            const canCarry = await this.canCarrySubjects(
                failedSubjects,
                config,
                nextStage === null // هل هذه السنة الأخيرة؟
            );

            if (canCarry) {
                decision = 'PROMOTED_WITH_CARRY';
                carriedSubjects = failedSubjects;
                carriedCount = failedCount;
            } else {
                // لا يمكن التحميل - إعادة
                decision = 'REPEAT_YEAR';
                targetStage = currentStage;
                targetStageId = currentStage?.id ?? null;
            }
        } else {
            // راسب في أكثر من الحد - إعادة
            decision = 'REPEAT_YEAR';
            targetStage = currentStage;
            targetStageId = currentStage?.id ?? null;
        }

        return {
            studentId: student.id,
            studentName: student.name,
            studentNumber: student.student_id,
            currentStage: student.stage?.name ?? null,
            currentStageId: student.stage_id,
            decision,
            failedCount,
            carriedCount,
            failedSubjects: failedSubjects.map((s) => ({ id: s.material_id, name: s.material.name })),
            carriedSubjects: carriedSubjects.map((s) => ({ id: s.material_id, name: s.material.name })),
            nextStage: targetStage?.name ?? null,
            nextStageId: targetStageId,
        };
    }

    /**
     * استخراج المواد الراسبة
     */
    static getFailedSubjects(enrollments: any[]): any[] {
        return enrollments.filter(
            (e) => e.result_status === 'FAILED' || e.result_status === 'BLOCKED_BY_ABSENCE'
        );
    }

    /**
     * التحقق من إمكانية التحميل
     */
    static async canCarrySubjects(
        failedSubjects: any[],
        config: PromotionConfig,
        isFinalYear: boolean
    ): Promise<boolean> {
        // إذا كانت السنة الأخيرة وممنوع التحميل
        if (isFinalYear && config.disableCarryForFinalYear) {
            return false;
        }

        // إذا كان هناك منع لتحميل المواد الأساسية
        if (config.blockCarryForCore) {
            const hasCoreSubject = failedSubjects.some((s) => s.material.is_core_subject);
            if (hasCoreSubject) {
                return false;
            }
        }

        return true;
    }

    /**
     * ترقية طالب للمرحلة التالية
     */
    static async promoteStudent(
        studentPreview: PromotionPreviewStudent,
        fromYear: string,
        toYear: string,
        processedBy: string
    ) {
        return await prisma.$transaction(async (tx) => {
            // تحديث الطالب
            await tx.student.update({
                where: { id: studentPreview.studentId },
                data: {
                    stage_id: studentPreview.nextStageId,
                    academic_status: 'REGULAR',
                    academic_year: toYear,
                },
            });

            // إنشاء سجل الترحيل
            const promotionRecord = await tx.promotionRecord.create({
                data: {
                    student_id: studentPreview.studentId,
                    academic_year_from: fromYear,
                    academic_year_to: toYear,
                    stage_from_id: studentPreview.currentStageId,
                    stage_to_id: studentPreview.nextStageId,
                    decision: 'PROMOTED',
                    failed_count: 0,
                    carried_count: 0,
                    processed_by: processedBy,
                },
            });

            // تسجيل الطالب في مواد المرحلة الجديدة
            if (studentPreview.nextStageId) {
                const materials = await tx.material.findMany({
                    where: { stage_id: studentPreview.nextStageId },
                });

                for (const material of materials) {
                    await tx.enrollment.create({
                        data: {
                            student_id: studentPreview.studentId,
                            material_id: material.id,
                            academic_year: toYear,
                            result_status: 'IN_PROGRESS',
                            is_carried: false,
                        },
                    });
                }
            }

            return promotionRecord;
        });
    }

    /**
     * ترقية طالب مع تحميل مواد
     */
    static async carryStudent(
        studentPreview: PromotionPreviewStudent,
        fromYear: string,
        toYear: string,
        processedBy: string
    ) {
        return await prisma.$transaction(async (tx) => {
            // تحديث الطالب
            await tx.student.update({
                where: { id: studentPreview.studentId },
                data: {
                    stage_id: studentPreview.nextStageId,
                    academic_status: 'CARRYING',
                    academic_year: toYear,
                },
            });

            // إنشاء سجل الترحيل
            const promotionRecord = await tx.promotionRecord.create({
                data: {
                    student_id: studentPreview.studentId,
                    academic_year_from: fromYear,
                    academic_year_to: toYear,
                    stage_from_id: studentPreview.currentStageId,
                    stage_to_id: studentPreview.nextStageId,
                    decision: 'PROMOTED_WITH_CARRY',
                    failed_count: studentPreview.failedCount,
                    carried_count: studentPreview.carriedCount,
                    processed_by: processedBy,
                },
            });

            // إنشاء سجلات المواد المحمّلة
            for (const subject of studentPreview.carriedSubjects) {
                await tx.carriedSubject.create({
                    data: {
                        student_id: studentPreview.studentId,
                        material_id: subject.id,
                        academic_year: toYear,
                    },
                });
            }

            // تسجيل الطالب في مواد المرحلة الجديدة
            if (studentPreview.nextStageId) {
                const materials = await tx.material.findMany({
                    where: { stage_id: studentPreview.nextStageId },
                });

                for (const material of materials) {
                    await tx.enrollment.create({
                        data: {
                            student_id: studentPreview.studentId,
                            material_id: material.id,
                            academic_year: toYear,
                            result_status: 'IN_PROGRESS',
                            is_carried: false,
                        },
                    });
                }
            }

            // تسجيل المواد المحمّلة
            for (const subject of studentPreview.carriedSubjects) {
                await tx.enrollment.create({
                    data: {
                        student_id: studentPreview.studentId,
                        material_id: subject.id,
                        academic_year: toYear,
                        result_status: 'IN_PROGRESS',
                        is_carried: true,
                    },
                });
            }

            return promotionRecord;
        });
    }

    /**
     * إعادة طالب (معيد)
     */
    static async repeatStudent(
        studentPreview: PromotionPreviewStudent,
        fromYear: string,
        toYear: string,
        processedBy: string
    ) {
        return await prisma.$transaction(async (tx) => {
            // تحديث الطالب
            await tx.student.update({
                where: { id: studentPreview.studentId },
                data: {
                    academic_status: 'REPEATING',
                    academic_year: toYear,
                    // المرحلة تبقى نفسها
                },
            });

            // إنشاء سجل الترحيل
            const promotionRecord = await tx.promotionRecord.create({
                data: {
                    student_id: studentPreview.studentId,
                    academic_year_from: fromYear,
                    academic_year_to: toYear,
                    stage_from_id: studentPreview.currentStageId,
                    stage_to_id: studentPreview.currentStageId, // نفس المرحلة
                    decision: 'REPEAT_YEAR',
                    failed_count: studentPreview.failedCount,
                    carried_count: 0,
                    processed_by: processedBy,
                },
            });

            // تسجيل الطالب في المواد الراسبة فقط (حسب الإعدادات)
            for (const subject of studentPreview.failedSubjects) {
                await tx.enrollment.create({
                    data: {
                        student_id: studentPreview.studentId,
                        material_id: subject.id,
                        academic_year: toYear,
                        result_status: 'IN_PROGRESS',
                        is_carried: false,
                    },
                });
            }

            return promotionRecord;
        });
    }

    /**
     * جلب إعدادات الترحيل للقسم
     */
    static async getPromotionConfig(departmentId: bigint): Promise<PromotionConfig> {
        const config = await prisma.promotionConfig.findUnique({
            where: { department_id: departmentId },
        });

        if (!config) {
            // إذا لم توجد إعدادات، نستخدم القيم الافتراضية
            return {
                maxCarrySubjects: 2,
                failThresholdForRepeat: 3,
                disableCarryForFinalYear: false, // السماح بالتحميل في السنة الأخيرة
                blockCarryForCore: false, // السماح بتحميل كل المواد
                repeatMode: 'repeat_failed_only',
            };
        }

        return {
            maxCarrySubjects: config.max_carry_subjects,
            failThresholdForRepeat: config.fail_threshold_for_repeat,
            disableCarryForFinalYear: config.disable_carry_for_final_year,
            blockCarryForCore: config.block_carry_for_core,
            repeatMode: config.repeat_mode as 'repeat_failed_only' | 'repeat_full_year',
        };
    }

    /**
     * تحديث أو إنشاء إعدادات الترحيل
     */
    static async upsertPromotionConfig(
        departmentId: bigint,
        config: Partial<PromotionConfig>
    ): Promise<any> {
        return await prisma.promotionConfig.upsert({
            where: { department_id: departmentId },
            update: {
                max_carry_subjects: config.maxCarrySubjects ?? 2,
                fail_threshold_for_repeat: config.failThresholdForRepeat ?? 3,
                disable_carry_for_final_year: config.disableCarryForFinalYear ?? false,
                block_carry_for_core: config.blockCarryForCore ?? false,
                repeat_mode: config.repeatMode ?? 'repeat_failed_only',
            },
            create: {
                department_id: departmentId,
                max_carry_subjects: config.maxCarrySubjects ?? 2,
                fail_threshold_for_repeat: config.failThresholdForRepeat ?? 3,
                disable_carry_for_final_year: config.disableCarryForFinalYear ?? false,
                block_carry_for_core: config.blockCarryForCore ?? false,
                repeat_mode: config.repeatMode ?? 'repeat_failed_only',
            },
        });
    }

    /**
     * جلب سجل الترحيل لطالب
     */
    static async getStudentPromotionHistory(studentId: bigint): Promise<any[]> {
        return await prisma.promotionRecord.findMany({
            where: { student_id: studentId },
            include: {
                stage_from: true,
                stage_to: true,
            },
            orderBy: { processed_at: 'desc' },
        });
    }
}
