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
        body { background: white; width: 800px; margin: 0; }
        #report-container {
            padding: 40px;
            font-family: 'Cairo', sans-serif;
            color: #1e293b;
            background: white;
            width: 800px;
            direction: rtl;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 { font-size: 26px; font-weight: 800; color: #0f172a; }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 30px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
        }
        .info-item { font-size: 14px; }
        .info-label { font-weight: 700; color: #64748b; margin-left: 5px; }
        .info-value { font-weight: 600; color: #0f172a; }

        .stats {
            display: flex;
            gap: 15px;
            margin-bottom: 30px;
        }
        .stat-card {
            flex: 1;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid #e2e8f0;
        }
        .stat-present { background: #f0fdf4; color: #166534; }
        .stat-absent { background: #fef2f2; color: #991b1b; }
        .stat-num { display: block; font-size: 24px; font-weight: 800; }
        .stat-label { font-size: 12px; font-weight: 700; }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th, td {
            padding: 12px;
            text-align: right;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
        }
        th { background: #f8fafc; color: #64748b; font-weight: 700; }
        td { font-weight: 600; }
        
        .badge {
            padding: 3px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
        }
        .badge-present { background: #dcfce7; color: #166534; }
        .badge-absent { background: #fee2e2; color: #991b1b; }

        .footer {
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div id="report-container">
        <div class="header">
            <div>
                <h1>تقرير حضور الطلاب</h1>
                <p style="color: #64748b; font-size: 13px;">${session.material.name} - ${session.session_date.toLocaleDateString('ar-IQ')}</p>
            </div>
            <div style="background: #0f172a; color: white; padding: 5px 12px; border-radius: 5px; font-size: 12px; font-weight: 700;">
                Smart Attendance
            </div>
        </div>

        <div class="info-grid">
            <div class="info-item"><span class="info-label">القسم:</span><span class="info-value">${session.material.department.name}</span></div>
            <div class="info-item"><span class="info-label">المرحلة:</span><span class="info-value">${session.material.stage.name}</span></div>
            <div class="info-item"><span class="info-label">المحاضر:</span><span class="info-value">${session.teacher.name}</span></div>
            <div class="info-item"><span class="info-label">التاريخ:</span><span class="info-value">${session.session_date.toLocaleDateString('ar-IQ')}</span></div>
        </div>

        <div class="stats">
            <div class="stat-card stat-present">
                <span class="stat-num">${presentCount}</span>
                <span class="stat-label">الحضور</span>
            </div>
            <div class="stat-card stat-absent">
                <span class="stat-num">${absentCount}</span>
                <span class="stat-label">الغياب</span>
            </div>
            <div class="stat-card">
                <span class="stat-num">${presentCount + absentCount}</span>
                <span class="stat-label">الكلي</span>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 40px;">#</th>
                    <th>الاسم الكامل</th>
                    <th>الرقم الجامعي</th>
                    <th style="text-align: center;">الحالة</th>
                    <th style="text-align: center;">الوقت</th>
                </tr>
            </thead>
            <tbody>
                ${studentList.map((s: any) => `
                    <tr>
                        <td style="color: #94a3b8;">${s.index}</td>
                        <td>${s.name}</td>
                        <td style="font-family: monospace; color: #64748b;">${s.student_id}</td>
                        <td style="text-align: center;">
                            <span class="badge badge-${s.statusClass}">
                                ${s.status}
                            </span>
                        </td>
                        <td style="text-align: center; color: #94a3b8;">${s.time}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="footer">
            <p>صدر هذا التقرير تلقائياً بتاريخ: ${new Date().toLocaleString('ar-IQ')}</p>
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