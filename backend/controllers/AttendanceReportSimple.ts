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
        const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: white; width: 800px; margin: 0; padding: 0; }
        #report-container {
            padding: 50px 60px;
            font-family: 'Cairo', sans-serif;
            color: #333;
            background: white;
            width: 800px;
            min-height: 1000px;
            direction: rtl;
        }
        
        /* HEADER */
        .header-section {
            text-align: center;
            margin-bottom: 25px;
        }
        .header-section h1 {
            font-size: 32px;
            font-weight: 700;
            color: #333;
            margin-bottom: 15px;
        }
        .header-line {
            width: 100%;
            height: 3px;
            background-color: #333;
            margin-bottom: 30px;
        }

        /* INFO SECTION */
        .info-table {
            width: 100%;
            margin-bottom: 30px;
        }
        .info-table td {
            text-align: right;
            padding: 4px 0;
            font-size: 15px;
        }
        .info-label {
            font-weight: 700;
            width: 100px;
            color: #333;
        }
        .info-value {
            color: #444;
            font-weight: 400;
            padding-right: 15px;
        }

        /* STATS BOXES */
        .stats-area {
            display: flex;
            justify-content: flex-end;
            gap: 15px;
            margin-bottom: 30px;
        }
        .stat-badge {
            padding: 8px 25px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 16px;
            min-width: 120px;
            text-align: center;
        }
        .stat-present { background-color: #dcfce7; color: #166534; }
        .stat-absent  { background-color: #f8fafc; color: #333; border: 1px solid #e2e8f0; } /* Matches image (light/none) */
        .stat-total   { background-color: #e2e3e5; color: #333; }

        /* MAIN TABLE */
        .main-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
            border: 1px solid #dee2e6;
        }
        .main-table th {
            background-color: #f8f9fa;
            color: #333;
            font-weight: 700;
            padding: 12px;
            border: 1px solid #dee2e6;
            font-size: 14px;
        }
        .main-table td {
            padding: 12px;
            border: 1px solid #dee2e6;
            text-align: center;
            font-size: 14px;
            color: #333;
            vertical-align: middle;
        }
        
        /* STATUS BADGE STYLING (matching exactly the image) */
        .status-cell {
            padding: 0 !important;
        }
        .status-badge {
            display: block;
            width: 100%;
            padding: 12px 0;
            font-weight: 700;
        }
        .status-present { background-color: #dcfce7; color: #166534; }
        .status-absent  { background-color: #f8d7da; color: #a01c2a; }

        .footer {
            text-align: center;
            font-size: 11px;
            color: #888;
            margin-top: auto;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div id="report-container">
        <!-- Header -->
        <div class="header-section">
            <h1>تقرير الحضور</h1>
            <div class="header-line"></div>
        </div>

        <!-- Info -->
        <table class="info-table">
            <tr>
                <td class="info-label">المادة:</td>
                <td class="info-value">${session.material.name}</td>
            </tr>
            <tr>
                <td class="info-label">القسم:</td>
                <td class="info-value">${session.material.department.name}</td>
            </tr>
            <tr>
                <td class="info-label">المرحلة:</td>
                <td class="info-value">${session.material.stage.name}</td>
            </tr>
            <tr>
                <td class="info-label">الأستاذ:</td>
                <td class="info-value">${session.teacher.name}</td>
            </tr>
            <tr>
                <td class="info-label">التاريخ:</td>
                <td class="info-value">${session.session_date.toLocaleDateString('ar-IQ')}</td>
            </tr>
        </table>

        <!-- Stats -->
        <div class="stats-area">
            <div class="stat-badge stat-present">الحضور: ${presentCount}</div>
            <div class="stat-badge stat-absent">الغياب: ${absentCount}</div>
            <div class="stat-badge stat-total">العدد الكلي: ${presentCount + absentCount}</div>
        </div>

        <!-- Table -->
        <table class="main-table">
            <thead>
                <tr>
                    <th style="width: 40px;">ت</th>
                    <th style="width: 180px;">الرقم الجامعي</th>
                    <th style="width: 180px;">الاسم</th>
                    <th>القسم</th>
                    <th style="width: 80px;">الحالة</th>
                    <th style="width: 100px;">الوقت</th>
                </tr>
            </thead>
            <tbody>
                ${studentList.map((s: any) => `
                    <tr>
                        <td>${s.index}</td>
                        <td style="font-family: monospace;">${s.student_id}</td>
                        <td style="font-weight: 600;">${s.name}</td>
                        <td>${s.department}</td>
                        <td class="status-cell">
                            <span class="status-badge ${s.status === 'حاضر' ? 'status-present' : 'status-absent'}">
                                ${s.status}
                            </span>
                        </td>
                        <td>${s.time}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="footer">
            <p>تم إنشاء التقرير في: ${new Date().toLocaleString('ar-IQ')}</p>
            <p>Privacy-Preserving Student Attendance System</p>
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