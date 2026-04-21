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
            background: #f0f2f5;
            padding: 30px;
            color: #1a1a2e;
        }

        .page-wrapper {
            max-width: 900px;
            margin: 0 auto;
            background: #fff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.10);
        }

        /* ===== HEADER ===== */
        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
            color: #fff;
            padding: 36px 40px 28px;
            text-align: center;
        }

        .header-logo {
            font-size: 13px;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #a0c4ff;
            margin-bottom: 8px;
        }

        .header h1 {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 4px;
        }

        .header-sub {
            font-size: 13px;
            color: #c9d6df;
        }

        /* ===== INFO SECTION ===== */
        .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
            border-bottom: 1px solid #e8eaf0;
        }

        .info-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 24px;
            border-bottom: 1px solid #f0f2f5;
            border-left: 1px solid #f0f2f5;
        }

        .info-item:nth-child(odd) { border-left: none; }

        .info-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            background: #eef2ff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
        }

        .info-label {
            font-size: 11px;
            color: #888;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-value {
            font-size: 14px;
            font-weight: 700;
            color: #1a1a2e;
        }

        /* ===== STATS ===== */
        .stats-section {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0;
            background: #f8f9ff;
            border-bottom: 2px solid #e8eaf0;
        }

        .stat-card {
            text-align: center;
            padding: 20px;
            border-left: 1px solid #e8eaf0;
        }

        .stat-card:last-child { border-left: none; }

        .stat-number {
            font-size: 40px;
            font-weight: 800;
            line-height: 1;
        }

        .stat-label {
            font-size: 13px;
            font-weight: 600;
            margin-top: 4px;
        }

        .stat-present .stat-number { color: #16a34a; }
        .stat-present .stat-label  { color: #15803d; }

        .stat-absent  .stat-number { color: #dc2626; }
        .stat-absent  .stat-label  { color: #b91c1c; }

        .stat-total   .stat-number { color: #2563eb; }
        .stat-total   .stat-label  { color: #1d4ed8; }

        /* ===== TABLE ===== */
        .table-wrapper { padding: 24px 28px; }

        .table-title {
            font-size: 15px;
            font-weight: 700;
            color: #1a1a2e;
            margin-bottom: 14px;
            padding-right: 10px;
            border-right: 4px solid #0f3460;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13.5px;
        }

        thead tr {
            background: #1a1a2e;
            color: #fff;
        }

        thead th {
            padding: 12px 14px;
            text-align: right;
            font-weight: 600;
            font-size: 13px;
        }

        tbody tr {
            border-bottom: 1px solid #f0f2f5;
            transition: background 0.15s;
        }

        tbody tr:hover { background: #f8f9ff; }
        tbody tr:last-child { border-bottom: none; }

        tbody td {
            padding: 11px 14px;
            color: #333;
        }

        .td-index { color: #888; font-size: 12px; text-align: center; width: 40px; }
        .td-id    { font-family: monospace; font-size: 12.5px; color: #555; }

        .badge {
            display: inline-block;
            padding: 3px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
        }

        .badge-present { background: #dcfce7; color: #15803d; }
        .badge-absent  { background: #fee2e2; color: #b91c1c; }

        .time-cell { font-size: 12px; color: #666; direction: ltr; text-align: center; }

        /* ===== FOOTER ===== */
        .footer {
            background: #f8f9ff;
            border-top: 1px solid #e8eaf0;
            padding: 14px 28px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11.5px;
            color: #888;
        }

        .footer strong { color: #555; }
    </style>
</head>
<body>
<div class="page-wrapper">

    <!-- HEADER -->
    <div class="header">
        <div class="header-logo">Privacy-Preserving Student Attendance System</div>
        <h1>📋 تقرير الحضور</h1>
        <div class="header-sub">Attendance Report — Generated automatically</div>
    </div>

    <!-- INFO GRID -->
    <div class="info-section">
        <div class="info-item">
            <div class="info-icon">📚</div>
            <div>
                <div class="info-label">المادة</div>
                <div class="info-value">${session.material.name}</div>
            </div>
        </div>
        <div class="info-item">
            <div class="info-icon">🏛️</div>
            <div>
                <div class="info-label">القسم</div>
                <div class="info-value">${session.material.department.name}</div>
            </div>
        </div>
        <div class="info-item">
            <div class="info-icon">🎓</div>
            <div>
                <div class="info-label">المرحلة</div>
                <div class="info-value">${session.material.stage.name}</div>
            </div>
        </div>
        <div class="info-item">
            <div class="info-icon">👨‍🏫</div>
            <div>
                <div class="info-label">الأستاذ</div>
                <div class="info-value">${session.teacher.name}</div>
            </div>
        </div>
        <div class="info-item">
            <div class="info-icon">📅</div>
            <div>
                <div class="info-label">التاريخ</div>
                <div class="info-value">${session.session_date.toLocaleDateString('ar-IQ')}</div>
            </div>
        </div>
        <div class="info-item">
            <div class="info-icon">🕐</div>
            <div>
                <div class="info-label">وقت الإنشاء</div>
                <div class="info-value">${new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        </div>
    </div>

    <!-- STATS -->
    <div class="stats-section">
        <div class="stat-card stat-present">
            <div class="stat-number">${presentCount}</div>
            <div class="stat-label">✅ الحضور</div>
        </div>
        <div class="stat-card stat-absent">
            <div class="stat-number">${absentCount}</div>
            <div class="stat-label">❌ الغياب</div>
        </div>
        <div class="stat-card stat-total">
            <div class="stat-number">${presentCount + absentCount}</div>
            <div class="stat-label">👥 المجموع الكلي</div>
        </div>
    </div>

    <!-- TABLE -->
    <div class="table-wrapper">
        <div class="table-title">كشف الحضور والغياب</div>
        <table>
            <thead>
                <tr>
                    <th style="width:44px; text-align:center;">ت</th>
                    <th>الرقم الجامعي</th>
                    <th>اسم الطالب</th>
                    <th>القسم</th>
                    <th style="text-align:center;">الحالة</th>
                    <th style="text-align:center;">وقت التسجيل</th>
                </tr>
            </thead>
            <tbody>
                ${studentList.map((s: any) => `
                <tr>
                    <td class="td-index">${s.index}</td>
                    <td class="td-id">${s.student_id}</td>
                    <td style="font-weight:600;">${s.name}</td>
                    <td>${s.department}</td>
                    <td style="text-align:center;">
                        <span class="badge ${s.statusClass === 'present' ? 'badge-present' : 'badge-absent'}">
                            ${s.statusClass === 'present' ? '✓' : '✗'} ${s.status}
                        </span>
                    </td>
                    <td class="time-cell">${s.time}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <!-- FOOTER -->
    <div class="footer">
        <span>تم الإنشاء: <strong>${new Date().toLocaleString('ar-IQ')}</strong></span>
        <span>نسبة الحضور: <strong>${presentCount + absentCount > 0 ? Math.round((presentCount / (presentCount + absentCount)) * 100) : 0}%</strong></span>
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