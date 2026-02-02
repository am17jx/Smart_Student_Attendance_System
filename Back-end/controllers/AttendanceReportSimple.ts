import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import puppeteer from 'puppeteer';

/**
 * ✅ SIMPLE SOLUTION: Generate PDF from attendance records only
 * No complex logic - just show who attended
 */
export const generateSimpleAttendanceReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { sessionId } = req.params;

        // 1. Get session
        const session = await prisma.session.findUnique({
            where: { id: BigInt(sessionId as string) },
            include: {
                material: {
                    include: { department: true, stage: true }
                },
                teacher: true
            }
        });

        if (!session) {
            return next(new AppError('Session not found', 404));
        }

        // 2. Get students registered in this material (department + stage)
        const allStudents = await prisma.student.findMany({
            where: {
                department_id: session.material.department_id,
                stage_id: session.material.stage_id
            },
            include: {
                department: true,
                stage: true
            },
            orderBy: { name: 'asc' }
        });

        // 3. Get attendance records
        const records = await prisma.attendanceRecord.findMany({
            where: { session_id: BigInt(sessionId as string) },
            include: {
                student: {
                    include: { department: true, stage: true }
                }
            },
            orderBy: { marked_at: 'asc' }
        });

        // 4. Build student list with correct status
        const studentList: any[] = [];

        // Process students based on attendance records
        allStudents.forEach((student) => {
            const studentId = student.id.toString();
            const record = records.find(r => r.student_id.toString() === studentId);

            // ✅ FIXED: Check record.status, not just existence
            const isPresent = record && (record.status === 'PRESENT' || record.status === 'LATE');

            if (isPresent) {
                // PRESENT
                studentList.push({
                    index: 0,
                    student_id: student.student_id || '',
                    name: student.name,
                    department: student.department?.name || '',
                    status: 'حاضر',
                    statusClass: 'present',
                    time: record.marked_at.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
                });
            } else {
                // ABSENT
                studentList.push({
                    index: 0,
                    student_id: student.student_id || '',
                    name: student.name,
                    department: student.department?.name || '',
                    status: 'غائب',
                    statusClass: 'absent',
                    time: '-'
                });
            }
        });

        // Sort and add index
        studentList.sort((a, b) => a.name.localeCompare(b.name));
        studentList.forEach((s, i) => s.index = i + 1);

        // 5. Stats
        const presentCount = studentList.filter(s => s.status === 'حاضر').length;
        const absentCount = studentList.filter(s => s.status === 'غائب').length;

        // 5. Generate HTML
        const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>تقرير الحضور</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #333; padding-bottom: 20px; }
        .header h1 { font-size: 28px; color: #333; }
        .info { margin-bottom: 30px; line-height: 1.8; }
        .info-row { display: flex; margin-bottom: 8px; font-size: 14px; }
        .info-label { font-weight: bold; width: 150px; color: #555; }
        .stats { display: flex; gap: 20px; margin-bottom: 20px; }
        .stat-box { padding: 10px 20px; border-radius: 8px; }
        .stat-present { background: #d4edda; color: #155724; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: right; border: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
        .present { background: #d4edda; color: #155724; font-weight: bold; }
        .absent { background: #f8d7da; color: #721c24; font-weight: bold; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #888; }
    </style>
</head>
<body>
    <div class="header">
        <h1>تقرير الحضور</h1>
    </div>
    
    <div class="info">
        <div class="info-row"><span class="info-label">المادة:</span><span>${session.material.name}</span></div>
        <div class="info-row"><span class="info-label">القسم:</span><span>${session.material.department.name}</span></div>
        <div class="info-row"><span class="info-label">المرحلة:</span><span>${session.material.stage.name}</span></div>
        <div class="info-row"><span class="info-label">الأستاذ:</span><span>${session.teacher.name}</span></div>
        <div class="info-row"><span class="info-label">التاريخ:</span><span>${session.session_date.toLocaleDateString('ar-IQ')}</span></div>
    </div>
    
    <div class="stats">
        <div class="stat-box stat-present"><strong>الحضور:</strong> ${presentCount}</div>
        <div class="stat-box stat-absent"><strong>الغياب:</strong> ${absentCount}</div>
        <div class="stat-box" style="background: #e2e3e5;"><strong>العدد الكلي:</strong> ${presentCount + absentCount}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>ت</th>
                <th>الرقم الجامعي</th>
                <th>الاسم</th>
                <th>القسم</th>
                <th>الحالة</th>
                <th>الوقت</th>
            </tr>
        </thead>
        <tbody>
            ${studentList.map((s: any) => `
                <tr>
                    <td>${s.index}</td>
                    <td>${s.student_id}</td>
                    <td>${s.name}</td>
                    <td>${s.department}</td>
                    <td class="${s.statusClass}">${s.status}</td>
                    <td>${s.time}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="footer">
        <p>تم إنشاء التقرير في: ${new Date().toLocaleString('ar-IQ')}</p>
        <p>Privacy-Preserving Student Attendance System</p>
    </div>
</body>
</html>
        `;

        // 6. Generate PDF
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        await browser.close();

        // 7. Send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="attendance-report-${sessionId}.pdf"`);
        res.send(Buffer.from(pdfBuffer));
    }
);
