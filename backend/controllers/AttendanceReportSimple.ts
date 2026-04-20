import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import puppeteer from 'puppeteer';

export const generateSimpleAttendanceReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { sessionId } = req.params;

        const session = await prisma.session.findUnique({
            where: { id: BigInt(sessionId as string) },
            include: {
                material: { include: { department: true, stage: true } },
                teacher: true
            }
        });

        if (!session) {
            return next(new AppError('Session not found', 404));
        }

        const allStudents = await prisma.student.findMany({
            where: {
                department_id: session.material.department_id,
                stage_id: session.material.stage_id
            },
            include: { department: true, stage: true },
            orderBy: { name: 'asc' }
        });

        const records = await prisma.attendanceRecord.findMany({
            where: { session_id: BigInt(sessionId as string) },
            include: { student: { include: { department: true, stage: true } } },
            orderBy: { marked_at: 'asc' }
        });

        const studentList: any[] = [];
        allStudents.forEach((student) => {
            const record = records.find(r => r.student_id.toString() === student.id.toString());
            const isPresent = record && (record.status === 'PRESENT' || record.status === 'LATE');
            
            studentList.push({
                index: 0,
                student_id: student.student_id || '',
                name: student.name,
                department: student.department?.name || '',
                status: isPresent ? 'حاضر' : 'غائب',
                statusClass: isPresent ? 'present' : 'absent',
                time: isPresent ? record!.marked_at.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : '-'
            });
        });

        studentList.sort((a, b) => a.name.localeCompare(b.name));
        studentList.forEach((s, i) => s.index = i + 1);

        const presentCount = studentList.filter(s => s.statusClass === 'present').length;
        const absentCount = studentList.filter(s => s.statusClass === 'absent').length;

        // توليد ملف HTML متكامل لدعم العربية والخطوط والاتجاهات
        const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>تقرير الحضور</title>
    <!-- استيراد خطوط عربية جميلة مثل Cairo -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Cairo', sans-serif; 
            padding: 40px; 
            font-size: 14px;
            color: #333;
        }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #333; padding-bottom: 20px; }
        .header h1 { font-size: 28px; color: #333; }
        .info { margin-bottom: 30px; line-height: 1.8; }
        .info-row { display: flex; margin-bottom: 8px; font-size: 15px; }
        .info-label { font-weight: 700; width: 150px; color: #555; }
        .stats { display: flex; gap: 20px; margin-bottom: 20px; }
        .stat-box { padding: 12px 20px; border-radius: 8px; flex: 1; text-align: center; font-size: 16px; border: 1px solid #ddd; }
        .stat-present { background: #d4edda; color: #155724; border-color: #c3e6cb; }
        .stat-absent { background: #f8d7da; color: #721c24; border-color: #f5c6cb; }
        .stat-total { background: #e2e3e5; color: #383d41; border-color: #d6d8db; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 12px; text-align: right; border: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 700; color: #333; }
        .present { background: #d4edda; color: #155724; font-weight: 600; }
        .absent { background: #f8d7da; color: #721c24; font-weight: 600; }
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
        <div class="stat-box stat-total"><strong>العدد الكلي:</strong> ${presentCount + absentCount}</div>
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

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--no-zygote',
                '--single-process',
                '--disable-crash-reporter',
                '--disable-extensions',
                '--disable-background-networking',
                '--no-first-run'
            ]
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="attendance-report-${sessionId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length.toString());
        res.send(Buffer.from(pdfBuffer));
    }
);
