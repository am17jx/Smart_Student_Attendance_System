import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';/**
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
                    time: record.marked_at.toLocaleTimeString('en-GB', { timeZone: 'Asia/Baghdad', hour: '2-digit', minute: '2-digit', hour12: false })
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

        // Sort: present first (alphabetically), then absent (alphabetically)
        const presentStudents = studentList
            .filter(s => s.status === 'حاضر')
            .sort((a, b) => a.name.localeCompare(b.name));
        const absentStudents = studentList
            .filter(s => s.status === 'غائب')
            .sort((a, b) => a.name.localeCompare(b.name));

        presentStudents.forEach((s, i) => s.index = i + 1);
        absentStudents.forEach((s, i) => s.index = i + 1);

        // 5. Stats
        const presentCount = presentStudents.length;
        const absentCount = absentStudents.length;

        const tableHeaders = `
            <thead>
                <tr>
                    <th style="width: 40px;">ت</th>
                    <th style="width: 200px;">الرقم الجامعي</th>
                    <th>الاسم</th>
                    <th style="width: 100px;">الوقت</th>
                </tr>
            </thead>`;

        const renderRows = (list: any[], rowClass: string) =>
            list.map((s: any) => `
                <tr class="${rowClass}">
                    <td>${s.index}</td>
                    <td style="font-family: monospace;">${s.student_id}</td>
                    <td style="font-weight: 600;">${s.name}</td>
                    <td>${s.time}</td>
                </tr>
            `).join('');

        const sharedStyles = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: white; width: 800px; margin: 0; padding: 0; }

        .page {
            padding: 50px 60px;
            font-family: 'Cairo', sans-serif;
            color: #333;
            background: white;
            width: 800px;
            direction: rtl;
        }

        /* Force a clean page break — html2pdf slices here */
        .page-break {
            page-break-before: always;
        }

        /* HEADER */
        .header-section { text-align: center; margin-bottom: 25px; }
        .header-section h1 { font-size: 32px; font-weight: 700; color: #333; margin-bottom: 15px; }
        .header-line { width: 100%; height: 3px; background-color: #333; margin-bottom: 30px; }

        /* PAGE 2 MINI HEADER */
        .mini-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 12px; border-bottom: 2px solid #333; }
        .mini-header h2 { font-size: 20px; font-weight: 700; color: #333; }
        .mini-header span { font-size: 13px; color: #666; }

        /* INFO TABLE */
        .info-table { width: 100%; margin-bottom: 30px; }
        .info-table td { text-align: right; padding: 4px 0; font-size: 15px; }
        .info-label { font-weight: 700; width: 100px; color: #333; }
        .info-value { color: #444; font-weight: 400; padding-right: 15px; }

        /* STATS */
        .stats-area { display: flex; justify-content: flex-end; gap: 15px; margin-bottom: 30px; }
        .stat-badge { padding: 8px 25px; border-radius: 8px; font-weight: 700; font-size: 16px; min-width: 120px; text-align: center; }
        .stat-present { background-color: #dcfce7; color: #166534; }
        .stat-absent  { background-color: #fee2e2; color: #991b1b; }
        .stat-total   { background-color: #e2e3e5; color: #333; }

        /* SECTION TITLE */
        .section-title { font-size: 18px; font-weight: 700; padding: 10px 14px; margin-bottom: 0; border-bottom: none; }
        .section-title-present { background-color: #dcfce7; color: #166534; border: 2px solid #86efac; border-radius: 6px 6px 0 0; }
        .section-title-absent  { background-color: #fee2e2; color: #991b1b; border: 2px solid #fca5a5; border-radius: 6px 6px 0 0; }

        /* MAIN TABLE */
        .main-table { width: 100%; border-collapse: collapse; }
        .main-table th { background-color: #f8f9fa; color: #333; font-weight: 700; padding: 11px; border: 1px solid #dee2e6; font-size: 14px; }
        .main-table td { padding: 10px 11px; border: 1px solid #dee2e6; text-align: center; font-size: 14px; color: #333; vertical-align: middle; }
        .row-present td { background-color: #f0fdf4; }
        .row-absent  td { background-color: #fff5f5; }

        .table-section { margin-bottom: 30px; }
        .table-section-present .main-table { border: 2px solid #86efac; border-top: none; }
        .table-section-absent  .main-table { border: 2px solid #fca5a5; border-top: none; }

        /* Prevent rows from splitting mid-row */
        .main-table tr { page-break-inside: avoid; }

        .footer { text-align: center; font-size: 11px; color: #888; margin-top: 40px; line-height: 1.6; }
        `;

        const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>${sharedStyles}</style>
</head>
<body>
<div id="report-container">

    <!-- ═══════════ PAGE 1: Header + Info + Stats + Present table ═══════════ -->
    <div class="page">
        <div class="header-section">
            <h1>تقرير الحضور</h1>
            <div class="header-line"></div>
        </div>

        <table class="info-table">
            <tr><td class="info-label">المادة:</td>   <td class="info-value">${session.material.name}</td></tr>
            <tr><td class="info-label">القسم:</td>    <td class="info-value">${session.material.department.name}</td></tr>
            <tr><td class="info-label">المرحلة:</td>  <td class="info-value">${session.material.stage.name}</td></tr>
            <tr><td class="info-label">الأستاذ:</td>  <td class="info-value">${session.teacher.name}</td></tr>
            <tr><td class="info-label">التاريخ:</td>  <td class="info-value">${session.session_date.toLocaleDateString('ar-IQ')}</td></tr>
        </table>

        <div class="stats-area">
            <div class="stat-badge stat-present">الحضور: ${presentCount}</div>
            <div class="stat-badge stat-absent">الغياب: ${absentCount}</div>
            <div class="stat-badge stat-total">العدد الكلي: ${presentCount + absentCount}</div>
        </div>

        <div class="table-section table-section-present">
            <div class="section-title section-title-present">&#x2705; الحاضرون (${presentCount})</div>
            <table class="main-table">
                ${tableHeaders}
                <tbody>
                    ${presentStudents.length > 0
                        ? renderRows(presentStudents, 'row-present')
                        : `<tr><td colspan="4" style="text-align:center;padding:20px;color:#999;">لا يوجد حضور</td></tr>`}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>تم إنشاء التقرير في: ${new Date().toLocaleString('ar-IQ')}</p>
            <p>Privacy-Preserving Student Attendance System</p>
        </div>
    </div>

    <!-- ═══════════ PAGE 2: Absent table ═══════════ -->
    <div class="page page-break">
        <div class="mini-header">
            <h2>تقرير الحضور — ${session.material.name}</h2>
            <span>${session.session_date.toLocaleDateString('ar-IQ')} | ${session.teacher.name}</span>
        </div>

        <div class="table-section table-section-absent">
            <div class="section-title section-title-absent">&#x274C; الغائبون (${absentCount})</div>
            <table class="main-table">
                ${tableHeaders}
                <tbody>
                    ${absentStudents.length > 0
                        ? renderRows(absentStudents, 'row-absent')
                        : `<tr><td colspan="4" style="text-align:center;padding:20px;color:#999;">لا يوجد غياب</td></tr>`}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>تم إنشاء التقرير في: ${new Date().toLocaleString('ar-IQ')}</p>
            <p>Privacy-Preserving Student Attendance System</p>
        </div>
    </div>

</div>
</body>
</html>
        `;

        // 6. Send HTML explicitly to Frontend
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    }
);