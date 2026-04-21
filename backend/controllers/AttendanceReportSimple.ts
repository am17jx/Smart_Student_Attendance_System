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

        // 5. Generate HTML
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
            background-color: #ffffff; 
            color: #1e293b; 
            padding: 0;
            width: 100%;
            /* Fixed width ensures html2pdf scales it perfectly to A4 without squishing */
            width: 850px; 
            margin: 0 auto;
        }
        .page-container {
            padding: 40px;
            background: #ffffff;
        }
        
        /* Header Styling */
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            border-bottom: 2px solid #e2e8f0; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .header h1 { 
            font-size: 28px; 
            color: #0f172a; 
            font-weight: 800;
        }
        .header p {
            color: #64748b;
            font-size: 14px;
            margin-top: 5px;
        }
        
        /* Info Grid Styling */
        .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
            margin-bottom: 30px; 
            background: #f8fafc; 
            padding: 24px; 
            border-radius: 12px; 
            border: 1px solid #e2e8f0; 
        }
        .info-row { display: flex; font-size: 14px; align-items: center; }
        .info-label { font-weight: 700; width: 110px; color: #475569; }
        .info-value { color: #0f172a; font-weight: 600; }
        
        /* Stats Styling */
        .stats { 
            display: flex; 
            gap: 20px; 
            margin-bottom: 35px; 
        }
        .stat-box { 
            flex: 1; 
            padding: 20px; 
            border-radius: 12px; 
            text-align: center; 
            display: flex; 
            flex-direction: column; 
            gap: 8px; 
        }
        .stat-present { background: #dcfce7; border: 1px solid #bbf7d0; color: #166534; }
        .stat-absent { background: #fee2e2; border: 1px solid #fecaca; color: #991b1b; }
        .stat-total { background: #f1f5f9; border: 1px solid #e2e8f0; color: #334155; }
        .stat-value { font-size: 28px; font-weight: 800; }
        .stat-label { font-size: 14px; font-weight: 700; }

        /* Table Styling */
        .table-wrapper {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 40px;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            text-align: right;
        }
        th, td { 
            padding: 14px 16px; 
            border-bottom: 1px solid #e2e8f0; 
        }
        th { 
            background: #f8fafc; 
            font-weight: 700; 
            color: #475569; 
            font-size: 14px; 
        }
        td { 
            font-size: 14px; 
            color: #1e293b; 
            font-weight: 600;
        }
        tr:last-child td { border-bottom: none; }
        tr:nth-child(even) { background-color: #f8fafc; }
        
        /* Badges */
        .badge {
            padding: 6px 12px;
            border-radius: 50px;
            font-size: 12px;
            font-weight: 700;
            display: inline-block;
            text-align: center;
        }
        .badge-present { background: #dcfce7; color: #166534; }
        .badge-absent { background: #fee2e2; color: #991b1b; }

        /* Footer */
        .footer { 
            text-align: center; 
            font-size: 13px; 
            color: #94a3b8; 
            border-top: 2px solid #e2e8f0;
            padding-top: 20px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="page-container">
        <!-- Header -->
        <div class="header">
            <div>
                <h1>تقرير الحضور المفصل</h1>
                <p>سجل بيانات الحضور للطلاب في هذه الجلسة</p>
            </div>
            <div style="text-align: left;">
                <h2 style="color: #0f172a; font-size: 20px; font-weight: 800;">${session.material.name}</h2>
                <p style="color: #64748b; font-size: 14px; font-weight: 600;">${session.session_date.toLocaleDateString('ar-IQ')}</p>
            </div>
        </div>
        
        <!-- Info Grid -->
        <div class="info-grid">
            <div class="info-row"><span class="info-label">القسم:</span><span class="info-value">${session.material.department.name}</span></div>
            <div class="info-row"><span class="info-label">المرحلة:</span><span class="info-value">${session.material.stage.name}</span></div>
            <div class="info-row"><span class="info-label">المحاضر:</span><span class="info-value">${session.teacher.name}</span></div>
            <div class="info-row"><span class="info-label">التاريخ:</span><span class="info-value">${session.session_date.toLocaleDateString('ar-IQ')}</span></div>
        </div>
        
        <!-- Statistics -->
        <div class="stats">
            <div class="stat-box stat-present">
                <span class="stat-value">${presentCount}</span>
                <span class="stat-label">إجمالي الحضور</span>
            </div>
            <div class="stat-box stat-absent">
                <span class="stat-value">${absentCount}</span>
                <span class="stat-label">إجمالي الغياب</span>
            </div>
            <div class="stat-box stat-total">
                <span class="stat-value">${presentCount + absentCount}</span>
                <span class="stat-label">العدد الكلي للطلاب</span>
            </div>
        </div>

        <!-- Attendance Table -->
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%;">ت</th>
                        <th style="width: 20%;">الرقم الجامعي</th>
                        <th style="width: 35%;">اسم الطالب</th>
                        <th style="width: 15%;">الحالة</th>
                        <th style="width: 25%;">وقت التسجيل</th>
                    </tr>
                </thead>
                <tbody>
                    ${studentList.map((s: any) => `
                        <tr>
                            <td>${s.index}</td>
                            <td style="color: #64748b; font-family: monospace; font-size: 13px;">${s.student_id}</td>
                            <td>${s.name}</td>
                            <td>
                                <span class="badge ${s.status === 'حاضر' ? 'badge-present' : 'badge-absent'}">
                                    ${s.status}
                                </span>
                            </td>
                            <td style="color: #64748b;">${s.status === 'حاضر' ? s.time : '--:--'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>تم إنشاء التقرير في: <span style="color: #64748b; font-family: monospace;" dir="ltr">${new Date().toLocaleString('en-US')}</span></p>
            <p style="margin-top: 5px;">Privacy-Preserving Student Attendance System</p>
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