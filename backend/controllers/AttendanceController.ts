import { Request, Response, NextFunction } from "express"; // Force restart
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";
import PDFDocument from "pdfkit";
import logger from "../utils/logger";
import { verifyTOTP } from "../utils/otp";
import * as path from "path";

function ar(text: string): string {
    if (!text) return "";
    return String(text).split(" ").reverse().join(" ");
}

function getArabicFont(): string {
    return require.resolve("noto-sans-arabic/fonts/Regular.ttf");
}

function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371;
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat1)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d * 1000;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}

const serializeBigInt = (obj: any): any => {
    return JSON.parse(JSON.stringify(obj, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
};

export const manualAttend = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { otp, latitude, longitude } = req.body;
    const studentId = req.student?.id;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    if (!studentId) {
        throw new AppError("Student not authenticated", 401);
    }

    if (!otp || !latitude || !longitude) {
        throw new AppError("OTP and Location (GPS) are required", 400);
    }

    const student = await prisma.student.findUnique({
        where: { id: studentId }
    });

    if (!student || !student.department_id || !student.stage_id) {
        throw new AppError("بيانات الطالب غير مكتملة. يرجى التواصل مع الإدارة.", 400);
    }

    const activeSessions = await prisma.session.findMany({
        where: {
            is_active: true,
            material: {
                department_id: student.department_id,
                stage_id: student.stage_id
            }
        },
        include: {
            material: true,
            geofence: true
        }
    });

    if (activeSessions.length === 0) {
        throw new AppError("لا توجد جلسات مفتوحة حالياً لمرحلتك وقسمك", 404);
    }

    let matchedSession = null;
    for (const session of activeSessions) {
        if (verifyTOTP(otp, session.qr_secret, 30, 1)) {
            matchedSession = session;
            break;
        }
    }

    if (!matchedSession) {
        await prisma.failedAttempt.create({
            data: {
                student_id: studentId,
                session_id: activeSessions[0].id,
                error_type: "INVALID_OTP",
                error_message: "Invalid or expired OTP provided",
                ip_address: typeof ip === 'string' ? ip : undefined,
                device_info: userAgent
            }
        });
        throw new AppError("الرمز غير صحيح أو منتهي الصلاحية", 400);
    }

    if (matchedSession.geofence) {
        const distance = getDistanceFromLatLonInMeters(
            parseFloat(latitude),
            parseFloat(longitude),
            matchedSession.geofence.latitude,
            matchedSession.geofence.longitude
        );

        if (distance > matchedSession.geofence.radius_meters) {
            await prisma.failedAttempt.create({
                data: {
                    student_id: studentId,
                    session_id: matchedSession.id,
                    error_type: "GEOFENCE_ERROR",
                    error_message: `Distance: ${Math.round(distance)}m, Allowed: ${matchedSession.geofence.radius_meters}m`,
                    ip_address: typeof ip === 'string' ? ip : undefined,
                    device_info: userAgent
                }
            });
            throw new AppError(`أنت خارج نطاق القاعة (${Math.round(distance)}م). الحد الأقصى: ${matchedSession.geofence.radius_meters}م`, 403);
        }
    }

    const existingRecord = await prisma.attendanceRecord.findUnique({
        where: {
            student_id_session_id: {
                student_id: studentId,
                session_id: matchedSession.id
            }
        }
    });

    if (existingRecord) {
        throw new AppError("لقد قمت بتسجيل الحضور مسبقاً في هذه الجلسة", 400);
    }

    await prisma.attendanceRecord.create({
        data: {
            student_id: studentId,
            session_id: matchedSession.id,
            token_hash: "OTP_MANUAL",
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            marked_by: "otp_manual"
        },
    });

    logger.info(`✅ OTP Attendance recorded: Student ${studentId} in Session ${matchedSession.id}`);

    res.status(200).json({
        status: "success",
        message: "Attendance recorded successfully",
        data: {
            materialName: matchedSession.material?.name
        }
    });
});


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

        const combinedRecords = [
            ...records,
            ...allStudents.filter(s => !attendedStudentIds.has(s.id.toString())).map(student => ({
                id: BigInt(0), // Placeholder ID
                session_id: session.id,
                student_id: student.id,
                marked_at: new Date(),
                status: 'ABSENT',
                token_hash: null,
                marked_by: 'system_pending',
                student: student,
                session: session
            }))
        ];

        logger.info("📊 Found", records.length, "actual records and", combinedRecords.length - records.length, "absent students");

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
        const { marked_by, status } = req.body;

        // Check if attendance record exists first
        const existing = await prisma.attendanceRecord.findUnique({
            where: { id: BigInt(id as string) }
        });

        if (!existing) {
            return next(new AppError('Attendance record not found', 404));
        }

        const updateData: any = {};
        if (marked_by !== undefined) updateData.marked_by = marked_by;
        if (status !== undefined) {
            const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
            if (!validStatuses.includes(status)) {
                return next(new AppError('حالة الحضور غير صالحة', 400));
            }
            updateData.status = status;
        }

        const record = await prisma.attendanceRecord.update({
            where: { id: BigInt(id as string) },
            data: updateData,
        });

        res.status(200).json({
            status: "success",
            data: { record: serializeBigInt(record) },
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


        try {
            logger.info('[generateAttendanceReport] Generating PDF with pdfkit...');

            const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
                const doc = new PDFDocument({ size: 'A4', margin: 40 });
                const chunks: Buffer[] = [];
                doc.on('data', (chunk: Buffer) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                doc.font(getArabicFont());

                const W = doc.page.width;
                const M = 40;
                const CW = W - M * 2;

                // ---- Header ----
                doc.fontSize(20).text(ar('تقرير الحضور'), M, 40, { width: CW, align: 'center' });
                doc.moveDown(0.3);
                doc.moveTo(M, doc.y).lineTo(W - M, doc.y).lineWidth(2).stroke();
                doc.moveDown(0.6);

                // ---- Session Info ----
                doc.fontSize(11);
                const info = [
                    [ar('المادة:'), ar(session.material.name)],
                    [ar('القسم:'), ar(session.material.department.name)],
                    [ar('المرحلة:'), ar(session.material.stage.name)],
                    [ar('الأستاذ:'), ar(session.teacher.name)],
                    [ar('الموقع:'), ar(session.geofence.name)],
                    [ar('التاريخ:'), new Date(session.session_date).toLocaleDateString('en-GB')],
                ];
                for (const [label, value] of info) {
                    const y = doc.y;
                    doc.text(String(value), M, y, { width: CW - 120, align: 'left' });
                    doc.text(String(label), W - M - 120, y, { width: 120, align: 'right' });
                    doc.moveDown(0.1);
                }
                doc.moveDown(0.5);

                // ---- Stats ----
                const statY = doc.y;
                const statW = CW / 3 - 5;
                const stats = [
                    { label: ar('الحضور'), value: String(presentCount), color: '#155724', bg: '#d4edda' },
                    { label: ar('الغياب'), value: String(absentCount), color: '#721c24', bg: '#f8d7da' },
                    { label: ar('العدد الكلي'), value: String(classSize), color: '#383d41', bg: '#e2e3e5' },
                ];
                stats.forEach((s, i) => {
                    const x = M + i * (statW + 5);
                    doc.rect(x, statY, statW, 30).fill(s.bg);
                    doc.fillColor(s.color).fontSize(10)
                        .text(`${s.label}: ${s.value}`, x + 4, statY + 9, { width: statW - 8, align: 'center' });
                });
                doc.fillColor('#000000');
                doc.y = statY + 38;
                doc.moveDown(0.3);

                // ---- Table ----
                const colWidths = [50, 45, 65, 130, 90, 30]; // time,status,dept,name,id,#
                const headers = [ar('الوقت'), ar('الحالة'), ar('القسم'), ar('الاسم'), ar('الرقم الجامعي'), ar('ت')];
                const rowH = 22;
                const startTableY = doc.y;

                // Header row
                doc.rect(M, startTableY, CW, rowH).fill('#f0f0f0');
                doc.fillColor('#000');
                let hx = M;
                for (let i = 0; i < headers.length; i++) {
                    doc.fontSize(9).text(headers[i], hx + 2, startTableY + 6, { width: colWidths[i] - 4, align: 'center' });
                    hx += colWidths[i];
                }
                doc.y = startTableY + rowH;

                // Data rows
                for (let ri = 0; ri < finalStudentList.length; ri++) {
                    const s = finalStudentList[ri];
                    const ry = doc.y;

                    // New page if needed
                    if (ry + rowH > doc.page.height - 60) {
                        doc.addPage();
                        doc.y = 40;
                    }
                    const rowY = doc.y;

                    const bg = ri % 2 === 0 ? '#ffffff' : '#f9f9f9';
                    doc.rect(M, rowY, CW, rowH).fill(bg);

                    const statusBg = s.statusClass === 'present' ? '#d4edda' : '#f8d7da';
                    const statusColor = s.statusClass === 'present' ? '#155724' : '#721c24';

                    const cells = [
                        { text: s.time, color: '#000', cellBg: null },
                        { text: ar(s.status), color: statusColor, cellBg: statusBg },
                        { text: ar(s.department), color: '#000', cellBg: null },
                        { text: ar(s.name), color: '#000', cellBg: null },
                        { text: s.student_id ? String(s.student_id) : '', color: '#000', cellBg: null },
                        { text: String(s.index), color: '#000', cellBg: null },
                    ];

                    let cx = M;
                    for (let ci = 0; ci < cells.length; ci++) {
                        const cell = cells[ci];
                        if (cell.cellBg) doc.rect(cx, rowY, colWidths[ci], rowH).fill(cell.cellBg);
                        doc.fillColor(cell.color).fontSize(8)
                            .text(cell.text, cx + 2, rowY + 6, { width: colWidths[ci] - 4, align: 'center', lineBreak: false });
                        cx += colWidths[ci];
                    }

                    // Row border
                    doc.rect(M, rowY, CW, rowH).stroke('#dddddd');
                    doc.fillColor('#000');
                    doc.y = rowY + rowH;
                }

                // ---- Footer ----
                doc.moveDown(1);
                doc.moveTo(M, doc.y).lineTo(W - M, doc.y).lineWidth(1).stroke('#dddddd');
                doc.moveDown(0.3);
                doc.fontSize(9).fillColor('#666666')
                    .text(`${ar('تم إنشاء التقرير في:')} ${new Date().toLocaleString('en-GB')}`, M, doc.y, { width: CW, align: 'center' });
                doc.text('Privacy-Preserving Student Attendance System', M, doc.y + 2, { width: CW, align: 'center' });

                doc.end();
            });

            logger.info('[generateAttendanceReport] PDF generated. Size:', pdfBuffer.length);

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Length': pdfBuffer.length.toString(),
                'Content-Disposition': `attachment; filename=attendance-report-${sessionId}.pdf`,
                'Cache-Control': 'no-cache',
                'Access-Control-Expose-Headers': 'Content-Disposition'
            });

            res.send(pdfBuffer);

        } catch (error) {
            logger.error('[generateAttendanceReport] PDF generation error', { error });
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



/**
 * POST /attendance/leave
 * منح إجازة لطالب (صحية أو رسمية) — Admin only
 */
export const grantStudentLeave = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { studentId, sessionId, leaveType, reason } = req.body;

        if (!studentId || !sessionId || !leaveType) {
            return next(new AppError('يجب تقديم معرف الطالب والجلسة ونوع الإجازة', 400));
        }

        const validLeaveTypes = ['HEALTH', 'OFFICIAL'];
        if (!validLeaveTypes.includes(leaveType)) {
            return next(new AppError('نوع الإجازة غير صالح. يجب أن يكون HEALTH أو OFFICIAL', 400));
        }

        const student = await prisma.student.findUnique({ where: { id: BigInt(studentId) } });
        if (!student) return next(new AppError('الطالب غير موجود', 404));

        const session = await prisma.session.findUnique({ where: { id: BigInt(sessionId) } });
        if (!session) return next(new AppError('الجلسة غير موجودة', 404));

        const markedBy = `admin_leave_${leaveType.toLowerCase()}${reason ? ':' + reason : ''}`;

        const record = await prisma.attendanceRecord.upsert({
            where: {
                student_id_session_id: {
                    student_id: BigInt(studentId),
                    session_id: BigInt(sessionId)
                }
            },
            update: { status: 'EXCUSED', marked_by: markedBy },
            create: {
                student_id: BigInt(studentId),
                session_id: BigInt(sessionId),
                status: 'EXCUSED',
                marked_by: markedBy
            },
            include: {
                student: { select: { id: true, name: true, student_id: true, email: true } },
                session: { include: { material: { select: { id: true, name: true } } } }
            }
        });

        logger.info(`✅ [grantStudentLeave] Granted ${leaveType} leave to ${student.name}`);

        res.status(201).json({
            status: 'success',
            message: `تم منح الإجازة ${leaveType === 'HEALTH' ? 'الصحية' : 'الرسمية'} بنجاح`,
            data: { record: serializeBigInt(record) }
        });
    }
);

/**
 * GET /attendance/leaves
 * GET /attendance/leaves/:studentId
 * جلب قائمة الإجازات — Admin only
 */
export const getStudentLeaves = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { studentId } = req.params;

        const whereClause: any = { status: 'EXCUSED' };
        if (studentId) whereClause.student_id = BigInt(studentId as string);

        const records = await prisma.attendanceRecord.findMany({
            where: whereClause,
            include: {
                student: {
                    select: { id: true, name: true, student_id: true, email: true, department: true, stage: true }
                },
                session: {
                    include: {
                        material: { select: { id: true, name: true } },
                        teacher: { select: { id: true, name: true } }
                    }
                }
            },
            orderBy: { marked_at: 'desc' }
        });

        const enrichedRecords = records.map(r => {
            const mb = r.marked_by || '';
            let leaveType = 'UNKNOWN';
            let reason = '';
            if (mb.startsWith('admin_leave_health')) {
                leaveType = 'HEALTH';
                reason = mb.includes(':') ? mb.split(':').slice(1).join(':') : '';
            } else if (mb.startsWith('admin_leave_official')) {
                leaveType = 'OFFICIAL';
                reason = mb.includes(':') ? mb.split(':').slice(1).join(':') : '';
            }
            return { ...r, leaveType, reason: reason.trim() };
        });

        res.status(200).json({
            status: 'success',
            results: enrichedRecords.length,
            data: { records: serializeBigInt(enrichedRecords) }
        });
    }
);

/**
 * DELETE /attendance/leave/:recordId
 * إلغاء إجازة — Admin only
 */
export const revokeStudentLeave = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { recordId } = req.params;

        const existing = await prisma.attendanceRecord.findUnique({ where: { id: BigInt(recordId as string) } });
        if (!existing) return next(new AppError('سجل الإجازة غير موجود', 404));
        if (existing.status !== 'EXCUSED') return next(new AppError('هذا السجل ليس إجازة ممنوحة', 400));

        await prisma.attendanceRecord.delete({ where: { id: BigInt(recordId as string) } });

        logger.info(`🗑️ [revokeStudentLeave] Revoked leave record ${recordId}`);

        res.status(200).json({ status: 'success', message: 'تم إلغاء الإجازة بنجاح' });
    }
);
