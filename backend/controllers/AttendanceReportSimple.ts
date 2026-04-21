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
    <title>تقرير الحضور</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Cairo', sans-serif;
            background: #fff;
            padding: 50px 60px;
            color: #222;
            direction: rtl;
        }

        /* ===== HEADER ===== */
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 30px;
            font-weight: 800;
            color: #111;
            margin-bottom: 14px;
        }
        .header-line {
            border: none;
            border-top: 2px solid #222;
            margin: 0;
        }

        /* ===== INFO SECTION ===== */
        .info-section {
            margin: 28px 0;
        }
        .info-row {
            margin-bottom: 10px;
            font-size: 15px;
        }
        .info-label {
            font-weight: 700;
            color: #333;
            margin-left: 8px;
        }
        .info-value {
            color: #444;
        }

        /* ===== STATS ===== */
        .stats-wrapper {
            margin: 24px 0;
        }
        .stats-table {
            width: auto;
            border-collapse: separate;
            border-spacing: 10px 0;
            margin: 0 auto;
        }
        .stats-table td {
            padding: 8px 28px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 700;
            text-align: center;
            white-space: nowrap;
        }
        .stat-present { background: #d4edda; color: #1a7a3a; }
        .stat-absent  { background: #f8d7da; color: #a01c2a; }
        .stat-total   { background: #e2e3e5; color: #333; }

        /* ===== MAIN TABLE ===== */
        .main-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            margin-top: 24px;
        }
        .main-table thead tr {
            border-top: 2px solid #bbb;
            border-bottom: 2px solid #bbb;
        }
        .main-table thead th {
            padding: 12px 14px;
            text-align: right;
            font-weight: 700;
            font-size: 14px;
            color: #111;
            background: #fff;
        }
        .main-table tbody tr {
            border-bottom: 1px solid #e5e5e5;
        }
        .main-table tbody td {
            padding: 12px 14px;
            color: #333;
            font-size: 14px;
            vertical-align: middle;
        }

        .td-index { text-align: center; color: #555; }
        .td-id { font-size: 13px; color: #444; }
        .td-time { text-align: center; color: #555; font-size: 13px; }
        .td-status { text-align: center; }

        .badge {
            display: inline-block;
            padding: 3px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 700;
        }
        .badge-present { background: #d4edda; color: #1a7a3a; }
        .badge-absent  { background: #f8d7da; color: #a01c2a; }

        /* ===== FOOTER ===== */
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #888;
            line-height: 1.8;
        }
    </style>
</head>
<body>

    <!-- HEADER -->
    <div class="header">
        <h1>تقرير الحضور</h1>
        <hr class="header-line">
    </div>

    <!-- INFO -->
    <div class="info-section">
        <table style="width:100%; border-collapse:collapse;">
            <tr>
                <td style="width:50%; padding:5px 0; font-size:15px;">
                    <span class="info-label">المادة:</span>
                    <span class="info-value">${session.material.name}</span>
                </td>
            </tr>
            <tr>
                <td style="padding:5px 0; font-size:15px;">
                    <span class="info-label">القسم:</span>
                    <span class="info-value">${session.material.department.name}</span>
                </td>
            </tr>
            <tr>
                <td style="padding:5px 0; font-size:15px;">
                    <span class="info-label">المرحلة:</span>
                    <span class="info-value">${session.material.stage.name}</span>
                </td>
            </tr>
            <tr>
                <td style="padding:5px 0; font-size:15px;">
                    <span class="info-label">الأستاذ:</span>
                    <span class="info-value">${session.teacher.name}</span>
                </td>
            </tr>
            <tr>
                <td style="padding:5px 0; font-size:15px;">
                    <span class="info-label">التاريخ:</span>
                    <span class="info-value">${session.session_date.toLocaleDateString('ar-IQ')}</span>
                </td>
            </tr>
        </table>
    </div>

    <!-- STATS -->
    <div class="stats-wrapper">
        <table class="stats-table">
            <tr>
                <td class="stat-present">الحضور: ${presentCount}</td>
                <td class="stat-absent">الغياب: ${absentCount}</td>
                <td class="stat-total">العدد الكلي: ${presentCount + absentCount}</td>
            </tr>
        </table>
    </div>

    <!-- MAIN TABLE -->
    <table class="main-table">
        <thead>
            <tr>
                <th style="width:40px;">ت</th>
                <th>الرقم الجامعي</th>
                <th>الاسم</th>
                <th>القسم</th>
                <th style="width:90px; text-align:center;">الحالة</th>
                <th style="width:100px; text-align:center;">الوقت</th>
            </tr>
        </thead>
        <tbody>
            ${studentList.map((s: any) => `
            <tr>
                <td class="td-index">${s.index}</td>
                <td class="td-id">${s.student_id}</td>
                <td style="font-weight:600;">${s.name}</td>
                <td>${s.department}</td>
                <td class="td-status">
                    <span class="badge ${s.statusClass === 'present' ? 'badge-present' : 'badge-absent'}">
                        ${s.status}
                    </span>
                </td>
                <td class="td-time">${s.time}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <!-- FOOTER -->
    <div class="footer">
        <p>تم إنشاء التقرير في: ${new Date().toLocaleString('ar-IQ')}</p>
        <p>Privacy-Preserving Student Attendance System</p>
    </div>

</body>
</html>
`;

        // 6. Send HTML explicitly to Frontend
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    }
);