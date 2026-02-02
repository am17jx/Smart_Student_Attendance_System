import { prisma } from '../prisma/client';
import { WarningType } from '@prisma/client';
import emailService from './emailService';
import logger from './logger';

// نسب الإنذار
const WARNING_THRESHOLDS = {
    NOTICE: 3,           // تنبيه
    FIRST_WARNING: 5,    // إنذار أولي
    FINAL_WARNING: 7,    // إنذار نهائي
    ABSENCE_FAIL: 10,    // رسوب بالغياب
    CONSECUTIVE_DAYS_EXPULSION: 7  // أيام متتالية للفصل
};

export class AbsenceWarningService {

    /**
     * حساب نسبة الغياب للطالب في مادة معينة
     */
    async calculateAbsencePercentage(studentId: bigint, materialId: bigint): Promise<number> {
        // إجمالي الجلسات للمادة
        const totalSessions = await prisma.session.count({
            where: { material_id: materialId }
        });

        if (totalSessions === 0) return 0;

        // جلسات حضور الطالب (PRESENT أو LATE)
        const attendedSessions = await prisma.attendanceRecord.count({
            where: {
                student_id: studentId,
                session: { material_id: materialId },
                status: { in: ['PRESENT', 'LATE'] }
            }
        });

        // نسبة الغياب = (الجلسات الكلية - الحضور) / الجلسات الكلية * 100
        const absentSessions = totalSessions - attendedSessions;
        const absencePercentage = (absentSessions / totalSessions) * 100;

        return Math.round(absencePercentage * 100) / 100; // تقريب لرقمين عشريين
    }

    /**
     * التحقق إذا تم إرسال إنذار سابقاً
     */
    async hasWarningBeenSent(
        studentId: bigint,
        materialId: bigint | null,
        warningType: WarningType
    ): Promise<boolean> {
        const existingWarning = await prisma.absenceWarning.findFirst({
            where: {
                student_id: studentId,
                material_id: materialId,
                warning_type: warningType
            }
        });
        return !!existingWarning;
    }

    /**
     * تحديد نوع الإنذار بناءً على نسبة الغياب
     */
    getWarningTypeForPercentage(percentage: number): WarningType | null {
        if (percentage >= WARNING_THRESHOLDS.ABSENCE_FAIL) {
            return WarningType.ABSENCE_FAIL;
        } else if (percentage >= WARNING_THRESHOLDS.FINAL_WARNING) {
            return WarningType.FINAL_WARNING;
        } else if (percentage >= WARNING_THRESHOLDS.FIRST_WARNING) {
            return WarningType.FIRST_WARNING;
        } else if (percentage >= WARNING_THRESHOLDS.NOTICE) {
            return WarningType.NOTICE;
        }
        return null;
    }

    /**
     * إرسال البريد الإلكتروني حسب نوع الإنذار
     */
    async sendWarningEmail(
        studentEmail: string,
        studentName: string,
        materialName: string,
        percentage: number,
        warningType: WarningType
    ): Promise<boolean> {
        try {
            const warningMessages = {
                [WarningType.NOTICE]: {
                    subject: `⚠️ تنبيه: نسبة غيابك في ${materialName} بلغت ${percentage}%`,
                    html: this.generateWarningEmailHtml(studentName, materialName, percentage, 'تنبيه',
                        'نود إعلامك أن نسبة غيابك قد تجاوزت 3%. نرجو الالتزام بالحضور لتجنب العقوبات.')
                },
                [WarningType.FIRST_WARNING]: {
                    subject: `🔴 إنذار أولي: نسبة غيابك في ${materialName} بلغت ${percentage}%`,
                    html: this.generateWarningEmailHtml(studentName, materialName, percentage, 'إنذار أولي',
                        'تجاوزت نسبة غيابك 5%. هذا إنذار رسمي أولي. استمرار الغياب قد يؤدي لعقوبات أشد.')
                },
                [WarningType.FINAL_WARNING]: {
                    subject: `🚨 إنذار نهائي: نسبة غيابك في ${materialName} بلغت ${percentage}%`,
                    html: this.generateWarningEmailHtml(studentName, materialName, percentage, 'إنذار نهائي',
                        'تجاوزت نسبة غيابك 7%. هذا إنذار نهائي! استمرار الغياب سيؤدي للرسوب بالغياب.')
                },
                [WarningType.ABSENCE_FAIL]: {
                    subject: `❌ رسوب بالغياب: نسبة غيابك في ${materialName} بلغت ${percentage}%`,
                    html: this.generateWarningEmailHtml(studentName, materialName, percentage, 'رسوب بالغياب',
                        'للأسف، تجاوزت نسبة غيابك الحد المسموح. أنت الآن راسب في هذه المادة (محمل) ولا يحق لك النجاح بالعبور.')
                },
                [WarningType.EXPULSION_WARNING]: {
                    subject: `🚫 تحذير فصل: غياب متتالي`,
                    html: this.generateExpulsionWarningHtml(studentName)
                }
            };

            const emailContent = warningMessages[warningType];
            await emailService.sendEmail({
                to: studentEmail,
                subject: emailContent.subject,
                html: emailContent.html
            });

            logger.info(`📧 Absence warning email sent: ${warningType} to ${studentEmail}`);
            return true;
        } catch (error) {
            logger.error(`❌ Failed to send warning email: ${error}`);
            return false;
        }
    }

    /**
     * إنشاء HTML للبريد الإلكتروني
     */
    private generateWarningEmailHtml(
        studentName: string,
        materialName: string,
        percentage: number,
        warningTitle: string,
        message: string
    ): string {
        return `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; }
                .content { padding: 30px; }
                .alert-box { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .percentage { font-size: 48px; font-weight: bold; color: #dc3545; text-align: center; margin: 20px 0; }
                .message { font-size: 16px; line-height: 1.8; color: #333; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎓 نظام الحضور - ${warningTitle}</h1>
                </div>
                <div class="content">
                    <p class="message">عزيزي الطالب <strong>${studentName}</strong>،</p>
                    
                    <div class="alert-box">
                        <p><strong>المادة:</strong> ${materialName}</p>
                        <p class="percentage">${percentage}%</p>
                        <p style="text-align: center;">نسبة الغياب الحالية</p>
                    </div>
                    
                    <p class="message">${message}</p>
                    
                    <p class="message">نسأل الله لك التوفيق والنجاح.</p>
                </div>
                <div class="footer">
                    <p>هذا بريد آلي من نظام الحضور - يرجى عدم الرد عليه</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * إنشاء HTML لتحذير الفصل
     */
    private generateExpulsionWarningHtml(studentName: string): string {
        return `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #000, #333); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; }
                .content { padding: 30px; }
                .alert-box { background: #f8d7da; border: 2px solid #dc3545; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .message { font-size: 16px; line-height: 1.8; color: #333; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚫 تحذير خطير - احتمال الفصل</h1>
                </div>
                <div class="content">
                    <p class="message">عزيزي الطالب <strong>${studentName}</strong>،</p>
                    
                    <div class="alert-box">
                        <p style="font-size: 18px; font-weight: bold; text-align: center;">⚠️ لقد تغيبت لمدة 7 أيام متتالية!</p>
                        <p style="text-align: center;">وفقاً للتعليمات، قد يؤدي ذلك إلى فصلك من قِبل الوزارة.</p>
                    </div>
                    
                    <p class="message">يُرجى التواصل مع إدارة الكلية فوراً وتقديم عذر رسمي إن وُجد.</p>
                    
                    <p class="message">الأعذار المقبولة تشمل الحالات الصحية الطارئة أو الظروف القاهرة الموثقة، ويجب أن يقرها مجلس الكلية.</p>
                </div>
                <div class="footer">
                    <p>هذا بريد آلي من نظام الحضور - يرجى عدم الرد عليه</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * فحص وإرسال الإنذار المناسب
     */
    async checkAndSendWarning(studentId: bigint, materialId: bigint): Promise<void> {
        try {
            // جلب بيانات الطالب والمادة
            const student = await prisma.student.findUnique({
                where: { id: studentId },
                select: { name: true, email: true }
            });

            const material = await prisma.material.findUnique({
                where: { id: materialId },
                select: { name: true }
            });

            if (!student || !material) {
                logger.warn(`Student or Material not found: studentId=${studentId}, materialId=${materialId}`);
                return;
            }

            // حساب نسبة الغياب
            const absencePercentage = await this.calculateAbsencePercentage(studentId, materialId);

            // تحديد نوع الإنذار
            const warningType = this.getWarningTypeForPercentage(absencePercentage);

            if (!warningType) {
                return; // لا يوجد إنذار مطلوب
            }

            // التحقق من عدم تكرار الإنذار
            const alreadySent = await this.hasWarningBeenSent(studentId, materialId, warningType);
            if (alreadySent) {
                return; // تم إرسال الإنذار سابقاً
            }

            // إرسال البريد
            const emailSent = await this.sendWarningEmail(
                student.email,
                student.name,
                material.name,
                absencePercentage,
                warningType
            );

            // حفظ سجل الإنذار
            await prisma.absenceWarning.create({
                data: {
                    warning_type: warningType,
                    absence_percentage: absencePercentage,
                    email_sent: emailSent,
                    student_id: studentId,
                    material_id: materialId
                }
            });

            logger.info(`✅ Absence warning created: ${warningType} for student ${student.name} in ${material.name}`);

        } catch (error) {
            logger.error(`❌ Error in checkAndSendWarning: ${error}`);
        }
    }

    /**
     * فحص الغياب المتتالي لجميع الطلاب
     */
    async checkConsecutiveAbsences(): Promise<void> {
        try {
            // الحصول على جميع الطلاب
            const students = await prisma.student.findMany({
                select: { id: true, name: true, email: true }
            });

            for (const student of students) {
                // جلب آخر 7 جلسات للطالب
                const recentSessions = await prisma.session.findMany({
                    where: {
                        material: {
                            department_id: undefined,
                            stage_id: undefined
                        }
                    },
                    orderBy: { session_date: 'desc' },
                    take: 7,
                    select: { id: true, session_date: true }
                });

                if (recentSessions.length < 7) continue;

                // فحص إذا كان غائباً في كل الـ 7 جلسات
                let consecutiveAbsences = 0;
                for (const session of recentSessions) {
                    const attendance = await prisma.attendanceRecord.findFirst({
                        where: {
                            student_id: student.id,
                            session_id: session.id,
                            status: { in: ['PRESENT', 'LATE'] }
                        }
                    });
                    if (!attendance) {
                        consecutiveAbsences++;
                    } else {
                        break; // توقف عند أول حضور
                    }
                }

                if (consecutiveAbsences >= 7) {
                    // التحقق من عدم إرسال تحذير سابق
                    const alreadySent = await this.hasWarningBeenSent(
                        student.id,
                        null,
                        WarningType.EXPULSION_WARNING
                    );

                    if (!alreadySent) {
                        await this.sendWarningEmail(
                            student.email,
                            student.name,
                            '',
                            0,
                            WarningType.EXPULSION_WARNING
                        );

                        await prisma.absenceWarning.create({
                            data: {
                                warning_type: WarningType.EXPULSION_WARNING,
                                absence_percentage: 0,
                                consecutive_days: 7,
                                email_sent: true,
                                student_id: student.id
                            }
                        });

                        logger.warn(`🚫 Expulsion warning sent to ${student.name}`);
                    }
                }
            }
        } catch (error) {
            logger.error(`❌ Error checking consecutive absences: ${error}`);
        }
    }
}

export default new AbsenceWarningService();
