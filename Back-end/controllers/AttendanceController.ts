import { Request, Response, NextFunction } from "express"; // Force restart
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";
import puppeteer from "puppeteer";
import logger from "../utils/logger";

// Helper function to serialize BigInt values to strings for JSON
const serializeBigInt = (obj: any): any => {
    return JSON.parse(JSON.stringify(obj, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
};

/**
  GET /attendance/session/:sessionId
 */
export const getSessionAttendance = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {

        const { sessionId } = req.params;

        logger.info("🔍 Getting attendance for session:", sessionId);

        const session = await prisma.session.findUnique({
            where: { id: BigInt(sessionId as string) },
            include: {
                material: true
            }
        });

        if (!session) {
            return next(new AppError('Session not found', 404));
        }

        // 1. Get all students expected to attend (same department & stage)
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

        // 2. Get existing attendance records
        const records = await prisma.attendanceRecord.findMany({
            where: {
                session_id: BigInt(sessionId as string),
            },
            include: {
                student: {
                    include: {
                        department: true,
                        stage: true
                    }
                },
            },
        });

        const attendedStudentIds = new Set(records.map(r => r.student_id.toString()));

        // 3. Synthesize "Absent" records for students who haven't attended
        const combinedRecords = [
            ...records,
            ...allStudents.filter(s => !attendedStudentIds.has(s.id.toString())).map(student => ({
                id: BigInt(0), // Placeholder ID
                session_id: session.id,
                student_id: student.id,
                marked_at: new Date(), // Or session start time?
                status: 'ABSENT', // Virtual status
                token_hash: null,
                marked_by: 'system_pending',
                student: student,
                session: session
            }))
        ];

        logger.info("📊 Found", records.length, "actual records and", combinedRecords.length - records.length, "absent students");

        // Serialize BigInt values
        const serializedRecords = serializeBigInt(combinedRecords);

        logger.info("✅ Sending serialized records:", serializedRecords.length);

        res.status(200).json({
            status: "success",
            results: serializedRecords.length,
            data: { records: serializedRecords },
        });
    }
);


/**
 *  GET /attendance/:studentId
 */
export const getStudentAttendance = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { studentId } = req.params;

        const records = await prisma.attendanceRecord.findMany({
            where: {
                student_id: BigInt(studentId as string),
            },
            include: {
                session: {
                    include: {
                        material: {
                            include: {
                                department: true,
                                stage: true
                            }
                        },
                        teacher: true,
                        geofence: true
                    }
                },
            },
        });

        // Serialize BigInt values
        const serializedRecords = serializeBigInt(records);

        res.status(200).json({
            status: "success",
            results: serializedRecords.length,
            data: { records: serializedRecords },
        });
    }
);

/**
 *  GET /attendance/my-attendance - Get logged-in student's attendance
 */
export const getMyAttendance = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const studentId = req.student?.id;

        if (!studentId) {
            return next(new AppError('Student not authenticated', 401));
        }

        const records = await prisma.attendanceRecord.findMany({
            where: {
                student_id: studentId,
            },
            include: {
                session: {
                    include: {
                        material: {
                            include: {
                                department: true,
                                stage: true
                            }
                        },
                        teacher: true,
                        geofence: true
                    }
                },
            },
            orderBy: {
                marked_at: 'desc'
            }
        });


        // Serialize BigInt values
        const serializedRecords = serializeBigInt(records);

        res.status(200).json({
            status: "success",
            results: serializedRecords.length,
            data: { records: serializedRecords },
        });
    }
);

/**
 *  GET /attendance/my-stats - Get attendance statistics for logged-in student
 */
export const getMyAttendanceStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const studentId = req.student?.id;

        if (!studentId) {
            return next(new AppError('Student not authenticated', 401));
        }

        // Get student with department and stage
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                department: true,
                stage: true
            }
        });

        if (!student) {
            return next(new AppError('Student not found', 404));
        }

        // Get all attendance records for the student
        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: { student_id: studentId },
            include: {
                session: {
                    include: {
                        material: true
                    }
                }
            },
            orderBy: { marked_at: 'desc' }
        });

        // Get all sessions for student's materials (based on department and stage)
        const allSessions = await prisma.session.findMany({
            where: {
                material: {
                    department_id: student.department_id || undefined,
                    stage_id: student.stage_id || undefined
                }
            },
            include: {
                material: true
            }
        });

        // Calculate overall statistics
        const totalSessions = allSessions.length;
        const attendedSessions = attendanceRecords.length;
        const attendanceRate = totalSessions > 0
            ? Math.round((attendedSessions / totalSessions) * 100)
            : 0;

        // Calculate statistics by material
        const materialStats = new Map<string, {
            materialId: bigint;
            materialName: string;
            totalSessions: number;
            attended: number;
        }>();

        // Count total sessions per material
        allSessions.forEach(session => {
            if (!session.material) return;
            const key = session.material_id.toString();
            if (!materialStats.has(key)) {
                materialStats.set(key, {
                    materialId: session.material_id,
                    materialName: session.material.name,
                    totalSessions: 0,
                    attended: 0
                });
            }
            materialStats.get(key)!.totalSessions++;
        });

        // Count attended sessions per material
        attendanceRecords.forEach(record => {
            const key = record.session!.material_id.toString();
            if (materialStats.has(key)) {
                materialStats.get(key)!.attended++;
            }
        });

        // Convert to array with rates
        const byMaterial = Array.from(materialStats.values()).map(stat => ({
            materialId: stat.materialId.toString(),
            materialName: stat.materialName,
            totalSessions: stat.totalSessions,
            attended: stat.attended,
            rate: stat.totalSessions > 0
                ? Math.round((stat.attended / stat.totalSessions) * 100)
                : 0
        }));

        // Get recent attendance (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentSessions = allSessions.filter(
            session => session.created_at >= thirtyDaysAgo
        );

        const recentAttendance = recentSessions.map(session => {
            const attended = attendanceRecords.some(
                record => record.session_id.toString() === session.id.toString()
            );
            return {
                date: session.session_date.toISOString().split('T')[0],
                sessionId: session.id.toString(),
                materialName: session.material?.name || 'Unknown',
                attended
            };
        }).sort((a, b) => a.date.localeCompare(b.date));

        // Calculate monthly stats (last 6 months)
        const monthlyStats = new Map<string, { attended: number; total: number }>();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        allSessions
            .filter(session => session.created_at >= sixMonthsAgo)
            .forEach(session => {
                const monthKey = session.created_at.toISOString().substring(0, 7); // YYYY-MM
                if (!monthlyStats.has(monthKey)) {
                    monthlyStats.set(monthKey, { attended: 0, total: 0 });
                }
                monthlyStats.get(monthKey)!.total++;

                const attended = attendanceRecords.some(
                    record => record.session_id.toString() === session.id.toString()
                );
                if (attended) {
                    monthlyStats.get(monthKey)!.attended++;
                }
            });

        const monthlyStatsArray = Array.from(monthlyStats.entries())
            .map(([month, stats]) => ({
                month,
                attended: stats.attended,
                total: stats.total,
                rate: stats.total > 0
                    ? Math.round((stats.attended / stats.total) * 100)
                    : 0
            }))
            .sort((a, b) => a.month.localeCompare(b.month));

        // Determine attendance status
        let status = 'excellent';
        if (attendanceRate < 60) status = 'poor';
        else if (attendanceRate < 75) status = 'needs_improvement';
        else if (attendanceRate < 90) status = 'good';

        const response = {
            totalSessions,
            attendedSessions,
            missedSessions: totalSessions - attendedSessions,
            attendanceRate,
            status,
            byMaterial,
            recentAttendance,
            monthlyStats: monthlyStatsArray
        };

        res.status(200).json({
            status: "success",
            data: response
        });
    }
);

/**
 *  GET /attendance/teacher-stats - Get attendance statistics for logged-in teacher
 */
export const getTeacherAttendanceStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const teacherId = req.teacher?.id;

        if (!teacherId) {
            return next(new AppError('Teacher not authenticated', 401));
        }

        // Get all sessions created by this teacher
        const teacherSessions = await prisma.session.findMany({
            where: { teacher_id: teacherId },
            include: {
                material: {
                    include: {
                        department: true, // Needed to count total students
                        stage: true      // Needed to count total students
                    }
                },
                geofence: true,
                attendance_records: {
                    include: {
                        student: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        // Helper to get cached student counts per dept/stage to avoid repeated queries
        const classSizeCache = new Map<string, number>();

        const getClassSize = async (deptId: bigint, stageId: bigint): Promise<number> => {
            const key = `${deptId}-${stageId}`;
            if (classSizeCache.has(key)) return classSizeCache.get(key)!;

            const count = await prisma.student.count({
                where: {
                    department_id: deptId,
                    stage_id: stageId
                }
            });
            classSizeCache.set(key, count);
            return count;
        };

        // Pre-fetch all class sizes needed
        for (const session of teacherSessions) {
            if (session.material) {
                await getClassSize(session.material.department_id, session.material.stage_id);
            }
        }

        // Calculate statistics
        let totalSessions = 0;
        let totalAttendees = 0;
        let totalAbsent = 0;
        let totalExpected = 0;
        const uniqueStudentIds = new Set<string>();

        // Statistics by material
        const materialStats = new Map<string, {
            materialId: bigint;
            materialName: string;
            totalSessions: number;
            totalAttendees: number;
            totalAbsent: number;
            totalExpected: number;
        }>();

        // Monthly statistics
        const monthlyStats = new Map<string, { sessions: number; attendees: number; absent: number }>();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Weekly trend data
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        const weeklyData: Record<string, { sessions: number; attendees: number; absent: number }> = {};


        for (const session of teacherSessions) {
            if (!session.material) continue;

            const classSize = await getClassSize(session.material.department_id, session.material.stage_id);
            const attendeesCount = session.attendance_records.length;
            const absentCount = Math.max(0, classSize - attendeesCount);

            // Global totals
            totalSessions++;
            totalAttendees += attendeesCount;
            totalAbsent += absentCount;
            totalExpected += classSize;

            session.attendance_records.forEach(r => uniqueStudentIds.add(r.student_id.toString()));

            // Material Stats
            const matKey = session.material_id.toString();
            if (!materialStats.has(matKey)) {
                materialStats.set(matKey, {
                    materialId: session.material_id,
                    materialName: session.material.name,
                    totalSessions: 0,
                    totalAttendees: 0,
                    totalAbsent: 0,
                    totalExpected: 0
                });
            }
            const matStat = materialStats.get(matKey)!;
            matStat.totalSessions++;
            matStat.totalAttendees += attendeesCount;
            matStat.totalAbsent += absentCount;
            matStat.totalExpected += classSize;

            // Monthly Stats
            if (session.created_at >= sixMonthsAgo) {
                const monthKey = session.created_at.toISOString().substring(0, 7);
                if (!monthlyStats.has(monthKey)) {
                    monthlyStats.set(monthKey, { sessions: 0, attendees: 0, absent: 0 });
                }
                const mStat = monthlyStats.get(monthKey)!;
                mStat.sessions++;
                mStat.attendees += attendeesCount;
                mStat.absent += absentCount;
            }

            // Weekly Stats
            if (session.created_at >= fourWeeksAgo) {
                const weekNum = Math.floor(
                    (new Date().getTime() - session.created_at.getTime()) / (7 * 24 * 60 * 60 * 1000)
                );
                const weekLabel = weekNum === 0 ? 'هذا الأسبوع' :
                    weekNum === 1 ? 'الأسبوع الماضي' :
                        `قبل ${weekNum} أسابيع`;

                if (!weeklyData[weekLabel]) {
                    weeklyData[weekLabel] = { sessions: 0, attendees: 0, absent: 0 };
                }
                weeklyData[weekLabel].sessions++;
                weeklyData[weekLabel].attendees += attendeesCount;
                weeklyData[weekLabel].absent += absentCount;
            }
        }

        const avgAttendancePerSession = totalSessions > 0
            ? Math.round(totalAttendees / totalSessions)
            : 0;

        const uniqueStudents = uniqueStudentIds.size;

        const byMaterial = Array.from(materialStats.values()).map(stat => ({
            materialId: stat.materialId.toString(),
            materialName: stat.materialName,
            totalSessions: stat.totalSessions,
            totalAttendees: stat.totalAttendees,
            totalAbsent: stat.totalAbsent,
            totalExpected: stat.totalExpected,
            attendanceRate: stat.totalExpected > 0
                ? Math.round((stat.totalAttendees / stat.totalExpected) * 100)
                : 0,
            avgPerSession: stat.totalSessions > 0
                ? Math.round(stat.totalAttendees / stat.totalSessions)
                : 0
        }));

        const monthlyStatsArray = Array.from(monthlyStats.entries())
            .map(([month, stats]) => ({
                month,
                sessions: stats.sessions,
                attendees: stats.attendees,
                absent: stats.absent,
                avgPerSession: stats.sessions > 0
                    ? Math.round(stats.attendees / stats.sessions)
                    : 0
            }))
            .sort((a, b) => a.month.localeCompare(b.month));

        const weeklyTrend = Object.entries(weeklyData).map(([week, data]) => ({
            week,
            sessions: data.sessions,
            attendees: data.attendees,
            absent: data.absent
        }));

        // Recent sessions (last 10)
        const recentSessions = teacherSessions.slice(0, 10).map(session => ({
            id: session.id.toString(),
            materialName: session.material?.name || 'Unknown',
            location: session.geofence?.name || 'Unknown',
            date: session.session_date.toISOString().split('T')[0],
            attendeeCount: session.attendance_records.length,
            isActive: session.is_active
        }));

        const response = {
            totalSessions,
            totalAttendees,
            totalAbsent,
            totalExpected,
            avgAttendancePerSession,
            uniqueStudents,
            byMaterial,
            monthlyStats: monthlyStatsArray,
            recentSessions,
            weeklyTrend
        };

        res.status(200).json({
            status: "success",
            data: serializeBigInt(response)
        });
    }
);

/**
 *  PATCH /attendance/:id
 */
export const updateAttendance = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {

        const { id } = req.params;
        const { marked_by } = req.body;

        // Check if attendance record exists first
        const existing = await prisma.attendanceRecord.findUnique({
            where: { id: BigInt(id as string) }
        });

        if (!existing) {
            return next(new AppError('Attendance record not found', 404));
        }

        const record = await prisma.attendanceRecord.update({
            where: { id: BigInt(id as string) },
            data: { marked_by },
        });

        res.status(200).json({
            status: "success",
            data: { record },
        });
    }
);

/**
 * Generate PDF Attendance Report
 * GET /attendance/report/:sessionId
 */
/**
 * Generate PDF Attendance Report
 * GET /attendance/report/:sessionId
 */
/**
 * ✅ SIMPLE VERSION - Export import from simple file
 */
export { generateSimpleAttendanceReport as generateAttendanceReport } from './AttendanceReportSimple';

/**
 * OLD COMPLEX VERSION - BACKUP
 */
export const generateAttendanceReportOLD = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { sessionId } = req.params;
        logger.info('📊 [OLD] Generating PDF for session:', sessionId);

        // Get session details
        const session = await prisma.session.findUnique({
            where: { id: BigInt(sessionId as string) },
            include: {
                material: {
                    include: {
                        department: true,
                        stage: true
                    }
                },
                teacher: true,
                geofence: true
            }
        });

        if (!session) {
            return next(new AppError('Session not found', 404));
        }

        // ✅ FINAL SOLUTION: Get students registered in this material
        // Try Enrollment first, fallback to department+stage
        let allStudents: any[] = [];

        const enrollments = await prisma.enrollment.findMany({
            where: { material_id: session.material_id },
            include: {
                student: {
                    include: { department: true, stage: true }
                }
            }
        });

        if (enrollments.length > 0) {
            allStudents = enrollments.map(e => e.student);
            logger.info('✅ Using Enrollment table:', allStudents.length, 'students');
        } else {
            // Fallback to department+stage
            allStudents = await prisma.student.findMany({
                where: {
                    department_id: session.material.department_id,
                    stage_id: session.material.stage_id
                },
                include: { department: true, stage: true }
            });
            logger.info('⚠️ Fallback to department+stage:', allStudents.length, 'students');
        }

        // Get attendance records
        const records = await prisma.attendanceRecord.findMany({
            where: { session_id: BigInt(sessionId as string) },
            include: {
                student: {
                    include: { department: true, stage: true }
                }
            },
            orderBy: { marked_at: 'asc' }
        });

        // ✅ SIMPLE: Everyone who attended is present
        const rosterStudentIds = new Set(allStudents.map(s => s.id.toString()));
        const attendedStudentIds = new Set<string>();

        // Build display list - ROSTER ONLY (No Guests)
        const studentList: any[] = [];

        // 1. Process Present Students from Roster
        records.forEach(record => {
            const studentIdStr = record.student_id.toString();
            const isFromRoster = rosterStudentIds.has(studentIdStr);

            // فقط أضف الطلاب من القائمة
            if (isFromRoster) {
                attendedStudentIds.add(studentIdStr);
                studentList.push({
                    student_id: record.student.student_id || '',
                    name: record.student.name,
                    department: record.student.department?.name || '',
                    status: 'حاضر',
                    statusClass: 'present',
                    time: record.marked_at.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
                });
            }
        });

        // 2. Process Absent Students from Roster
        allStudents.forEach(student => {
            if (!attendedStudentIds.has(student.id.toString())) {
                studentList.push({
                    student_id: student.student_id || '',
                    name: student.name,
                    department: student.department?.name || '',
                    status: 'غائب',
                    statusClass: 'absent',
                    time: '-'
                });
            }
        });

        // Sort by name
        studentList.sort((a, b) => a.name.localeCompare(b.name));

        // Add index after sorting
        const finalStudentList = studentList.map((s, index) => ({ ...s, index: index + 1 }));

        // Correct Stats Calculation
        const presentCount = attendedStudentIds.size;

        // الغياب = طلاب القائمة الذين لم يحضروا
        const absentCount = allStudents.length - presentCount;

        // العدد الكلي = عدد طلاب القائمة
        const classSize = allStudents.length;


        // Generate HTML for the report
        const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attendance Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: white; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #333; padding-bottom: 20px; }
        .header h1 { font-size: 28px; color: #333; margin-bottom: 10px; }
        .info { margin-bottom: 30px; line-height: 1.8; }
        .info-row { display: flex; margin-bottom: 8px; font-size: 14px; }
        .info-label { font-weight: bold; width: 150px; color: #555; }
        .info-value { color: #000; }
        .stats { display: flex; gap: 20px; margin-bottom: 20px; }
        .stat-box { padding: 10px 20px; border-radius: 8px; text-align: center; }
        .stat-present { background-color: #d4edda; color: #155724; }
        .stat-absent { background-color: #f8d7da; color: #721c24; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f0f0f0; padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold; }
        td { padding: 10px; text-align: right; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .present { color: #155724; background-color: #d4edda; font-weight: bold; }
        .absent { color: #721c24; background-color: #f8d7da; font-weight: bold; }
        .guest-badge { font-size: 0.8em; background-color: #ffc107; padding: 2px 6px; border-radius: 4px; margin-right: 5px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>تقرير الحضور</h1>
    </div>
    
    <div class="info">
        <div class="info-row"><span class="info-label">المادة:</span><span class="info-value">${session.material.name}</span></div>
        <div class="info-row"><span class="info-label">القسم:</span><span class="info-value">${session.material.department.name}</span></div>
        <div class="info-row"><span class="info-label">المرحلة:</span><span class="info-value">${session.material.stage.name}</span></div>
        <div class="info-row"><span class="info-label">الأستاذ:</span><span class="info-value">${session.teacher.name}</span></div>
        <div class="info-row"><span class="info-label">الموقع:</span><span class="info-value">${session.geofence.name}</span></div>
        <div class="info-row"><span class="info-label">التاريخ:</span><span class="info-value">${new Date(session.session_date).toLocaleDateString('ar-IQ')}</span></div>
    </div>

    <div class="stats">
        <div class="stat-box stat-present"><strong>الحضور:</strong> ${presentCount}</div>
        <div class="stat-box stat-absent"><strong>الغياب:</strong> ${absentCount}</div>
        <div class="stat-box" style="background-color: #e2e3e5;"><strong>العدد الكلي:</strong> ${classSize}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>الوقت</th>
                <th>الحالة</th>
                <th>القسم</th>
                <th>الاسم</th>
                <th>الرقم الجامعي</th>
                <th>ت</th>
            </tr>
        </thead>
        <tbody>
            ${finalStudentList.map(s => `
                <tr>
                    <td>${s.time}</td>
                    <td class="${s.statusClass}">${s.status}</td>
                    <td>${s.department}</td>
                    <td>${s.name}</td>
                    <td>${s.student_id ? s.student_id.toString() : ''}</td>
                    <td>${s.index}</td>
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

        try {
            logger.info('🚀 [generateAttendanceReport] Launching Puppeteer...');
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });

            const page = await browser.newPage();
            logger.info('📄 [generateAttendanceReport] Setting content...');
            await page.setContent(html, { waitUntil: 'domcontentloaded' });

            logger.info('🖨️ [generateAttendanceReport] Generating PDF buffer...');
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
            });

            await browser.close();
            logger.info('✅ [generateAttendanceReport] PDF Generated successfully. Size:', pdfBuffer.length);

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Length': pdfBuffer.length.toString(),
                'Content-Disposition': `attachment; filename=attendance-report-${sessionId}.pdf`,
                'Cache-Control': 'no-cache',
                'Access-Control-Expose-Headers': 'Content-Disposition'
            });

            res.send(pdfBuffer);

        } catch (error) {
            console.error('❌ [generateAttendanceReport] Puppeteer Error:', error);
            return next(new AppError('فشل إنشاء ملف PDF', 500));
        }
    }
);

/**
 * Get Session Attendance Report (Department/Stage-Based)

 * Shows all students in the material's department and stage
 * Marks who attended and who is absent
 * GET /attendance/session/:sessionId/report
 */
export const getSessionAttendanceReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { sessionId } = req.params;
        const teacher = (req as any).teacher;

        logger.info('📊 [getSessionAttendanceReport] Fetching report for session:', sessionId);

        // 1. Get session with material info
        const session = await prisma.session.findUnique({
            where: { id: BigInt(sessionId as string) },
            include: {
                material: {
                    include: {
                        department: true,
                        stage: true
                    }
                },
                geofence: true
            }
        });

        if (!session) {
            return next(new AppError('Session not found', 404));
        }

        // Verify teacher owns this session
        if (teacher && session.teacher_id !== teacher.id) {
            return next(new AppError('You do not have permission to view this session', 403));
        }

        logger.info('🔍 [getSessionAttendanceReport] Material:', session.material.name);

        // 2. Get ALL students in this department + stage (Roster)
        const allStudents = await prisma.student.findMany({
            where: {
                department_id: session.material.department_id,
                stage_id: session.material.stage_id
            },
            include: { // Include department and stage for consistency
                department: true,
                stage: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        logger.info('👥 [getSessionAttendanceReport] Total students in dept/stage:', allStudents.length);

        // 3. Get Attendance Records for this session
        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: {
                session_id: BigInt(sessionId as string)
            },
            include: {
                student: { // Include student details to handle guests
                    include: {
                        department: true,
                        stage: true
                    }
                }
            }
        });

        // 4. Categorize Students
        const presentStudents: any[] = [];
        const absentStudents: any[] = [];
        const rosterStudentIds = new Set(allStudents.map(s => s.id.toString()));
        const attendedStudentIds = new Set<string>();

        // Process records to find Present students (Roster + Guests)
        for (const record of attendanceRecords) {
            const studentIdStr = record.student_id.toString();
            attendedStudentIds.add(studentIdStr);

            // Determine if Guest
            const isGuest = !rosterStudentIds.has(studentIdStr);

            if (record.status === 'PRESENT' || record.status === 'LATE') {
                presentStudents.push({
                    ...record.student,
                    id: record.student.id.toString(),
                    department: record.student.department ? {
                        ...record.student.department,
                        id: record.student.department.id.toString()
                    } : null,
                    stage: record.student.stage ? {
                        ...record.student.stage,
                        id: record.student.stage.id.toString()
                    } : null,
                    status: record.status.toLowerCase(),
                    marked_at: record.marked_at.toISOString(),
                    isGuest
                });
            }
        }

        // Process Roster to find Absent students
        for (const student of allStudents) {
            if (!attendedStudentIds.has(student.id.toString())) {
                absentStudents.push({
                    ...student,
                    id: student.id.toString(),
                    department: student.department ? {
                        ...student.department,
                        id: student.department.id.toString()
                    } : null,
                    stage: student.stage ? {
                        ...student.stage,
                        id: student.stage.id.toString()
                    } : null,
                    status: 'absent',
                    isGuest: false
                });
            }
        }

        const totalStudents = allStudents.length;
        const presentCount = presentStudents.length;
        const absentCount = absentStudents.length;

        // Attendance rate based on Roster only? Or Total Attendees / Class Size?
        // Usually Rate = (Roster Present) / (Class Size). Guests shouldn't inflate rate ideally, but handling simplisticly:
        // Let's use Roster Present Count for rate to be more accurate to the class.
        const rosterPresentCount = presentStudents.filter(s => !s.isGuest).length;

        const attendanceRate = totalStudents > 0
            ? Math.round((rosterPresentCount / totalStudents) * 100)
            : 0;

        logger.info(`📈 [getSessionAttendanceReport] Stats - Total: ${totalStudents}, Present: ${presentCount}, Absent: ${absentCount}, Rate: ${attendanceRate}%`);

        // 7. Send response
        res.status(200).json({
            status: 'success',
            data: {
                session: {
                    id: session.id.toString(),
                    start_time: session.session_date.toISOString(),
                    end_time: session.expires_at.toISOString(),
                    material: {
                        ...session.material,
                        id: session.material.id.toString(),
                        department: {
                            ...session.material.department,
                            id: session.material.department.id.toString()
                        },
                        stage: {
                            ...session.material.stage,
                            id: session.material.stage.id.toString()
                        }
                    },
                    geofence: {
                        ...session.geofence,
                        id: session.geofence.id.toString()
                    }
                },
                statistics: {
                    totalStudents,
                    presentCount,
                    absentCount,
                    attendanceRate
                },
                presentStudents,
                absentStudents
            }
        });
    }
);


