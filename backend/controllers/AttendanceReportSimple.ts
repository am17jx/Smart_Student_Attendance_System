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
    <title>تقرير حضور الطلاب</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #2563eb;
            --success: #16a34a;
            --danger: #dc2626;
            --slate-50: #f8fafc;
            --slate-100: #f1f5f9;
            --slate-200: #e2e8f0;
            --slate-700: #334155;
            --slate-800: #1e293b;
            --slate-900: #0f172a;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Cairo', sans-serif; 
            background: #f1f5f9; 
            padding: 0; 
            display: flex; 
            justify-content: center;
        }
        .paper {
            width: 800px;
            background: white;
            min-height: 1120px;
            padding: 50px;
            box-shadow: 0 0 20px rgba(0,0,0,0.05);
            margin: 20px 0;
            position: relative;
        }
        
        /* Watermark style decoration */
        .paper::before {
            content: "";
            position: absolute;
            top: 0; right: 0;
            width: 300px; height: 300px;
            background: radial-gradient(circle at top right, rgba(37, 99, 235, 0.03), transparent);
            pointer-events: none;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid var(--slate-200);
            padding-bottom: 30px;
            margin-bottom: 40px;
        }
        .header-title h1 {
            font-size: 32px;
            font-weight: 800;
            color: var(--slate-900);
            letter-spacing: -0.5px;
        }
        .header-title p {
            color: var(--slate-700);
            font-size: 16px;
            margin-top: 4px;
        }
        .system-badge {
            background: var(--slate-900);
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 14px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }
        .info-item {
            background: var(--slate-50);
            padding: 16px;
            border-radius: 12px;
            border: 1px solid var(--slate-100);
        }
        .info-label {
            font-size: 12px;
            font-weight: 700;
            color: var(--slate-700);
            text-transform: uppercase;
            margin-bottom: 4px;
            display: block;
        }
        .info-value {
            font-size: 16px;
            font-weight: 700;
            color: var(--slate-900);
        }

        .stats-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 40px;
        }
        .stat-card {
            padding: 20px;
            border-radius: 16px;
            text-align: center;
            border: 1px solid transparent;
        }
        .stat-present { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
        .stat-absent { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
        .stat-total { background: #f8fafc; border-color: #e2e8f0; color: #334155; }
        .stat-num { font-size: 32px; font-weight: 800; display: block; }
        .stat-text { font-size: 14px; font-weight: 700; }

        .m-table {
            width: 100%;
            border-collapse: collapse;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 0 0 1px var(--slate-200);
        }
        .m-table th {
            background: var(--slate-900);
            color: white;
            padding: 14px 16px;
            text-align: right;
            font-weight: 700;
            font-size: 13px;
        }
        .m-table td {
            padding: 14px 16px;
            border-bottom: 1px solid var(--slate-100);
            font-size: 14px;
            color: var(--slate-800);
            font-weight: 600;
        }
        .m-table tr:nth-child(even) { background: var(--slate-50); }
        .m-table tr:last-child td { border-bottom: none; }

        .badge {
            padding: 4px 12px;
            border-radius: 50px;
            font-size: 12px;
            font-weight: 700;
            display: inline-block;
        }
        .badge-present { background: #dcfce7; color: #166534; }
        .badge-absent { background: #fee2e2; color: #991b1b; }

        .footer {
            margin-top: auto;
            padding-top: 40px;
            text-align: center;
            border-top: 2px solid var(--slate-100);
        }
        .footer p {
            color: #94a3b8;
            font-size: 13px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="paper">
        <header class="header">
            <div class="header-title">
                <h1>تقرير الحضور</h1>
                <p>سجل الحضور الرسمي للجلسة التعليمية</p>
            </div>
            <div class="system-badge">Smart Attendance</div>
        </header>

        <section class="info-grid">
            <div class="info-item">
                <span class="info-label">المـادة الدراسية</span>
                <span class="info-value">${session.material.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">المرحلة و القسم</span>
                <span class="info-value">${session.material.stage.name} - ${session.material.department.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">الأستاذ المحاضر</span>
                <span class="info-value">${session.teacher.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">تاريخ الجلسة</span>
                <span class="info-value">${session.session_date.toLocaleDateString('ar-IQ')}</span>
            </div>
        </section>

        <section class="stats-container">
            <div class="stat-card stat-present">
                <span class="stat-num">${presentCount}</span>
                <span class="stat-text">إجمالي الحضور</span>
            </div>
            <div class="stat-card stat-absent">
                <span class="stat-num">${absentCount}</span>
                <span class="stat-text">إجمالي الغياب</span>
            </div>
            <div class="stat-card stat-total">
                <span class="stat-num">${presentCount + absentCount}</span>
                <span class="stat-text">العدد الكلي</span>
            </div>
        </section>

        <table class="m-table">
            <thead>
                <tr>
                    <th style="width: 50px; text-align: center;">#</th>
                    <th>الاسم الكامل</th>
                    <th>الرقم الجامعي</th>
                    <th style="text-align: center;">الحالة</th>
                    <th style="text-align: center;">وقت التسجيل</th>
                </tr>
            </thead>
            <tbody>
                ${studentList.map((s: any) => `
                    <tr>
                        <td style="text-align: center; color: #64748b;">${s.index}</td>
                        <td style="font-weight: 700;">${s.name}</td>
                        <td style="font-family: monospace; color: #475569;">${s.student_id}</td>
                        <td style="text-align: center;">
                            <span class="badge badge-${s.statusClass}">
                                ${s.status}
                            </span>
                        </td>
                        <td style="text-align: center; color: #64748b;">${s.time}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <footer class="footer">
            <p>صدر هذا التقرير تلقائياً بتاريخ: ${new Date().toLocaleString('ar-IQ')}</p>
            <p style="margin-top: 5px;">نظام إدارة حضور الطلاب الذكي © 2024</p>
        </footer>
    </div>
</body>
</html>
        `;

        // 6. Send HTML explicitly to Frontend
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    }
);