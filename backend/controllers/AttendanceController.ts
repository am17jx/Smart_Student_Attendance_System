import { Request, Response, NextFunction } from "express"; // Force restart
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";
import puppeteer from "puppeteer";
import logger from "../utils/logger";
import { verifyTOTP } from "../utils/otp";

// Helper: Calculate distance in meters using Haversine formula
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat1)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d * 1000; // Distance in meters
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}

// Helper function to serialize BigInt values to strings for JSON
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

    // Find active sessions for this student's department and stage
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

    // Try to find a session where this OTP is valid
    let matchedSession = null;
    for (const session of activeSessions) {
        if (verifyTOTP(otp, session.qr_secret, 30, 1)) {
            matchedSession = session;
            break;
        }
    }

    if (!matchedSession) {
        // Log failed attempt for the first active session as a fallback representation
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

    // Geofence Validation
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

    // Check if already attended
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

    // Mark attendance
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


        // Generate HTML for the report
        const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attendance Report</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Cairo', sans-serif; padding: 40px; background: white; }
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
                    '--no-first-run',
                ]
            });

            const page = await browser.newPage();
            logger.info('📄 [generateAttendanceReport] Setting content...');
            await page.setContent(html, { waitUntil: 'networkidle0' });

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
            logger.error('[generateAttendanceReport] Puppeteer Error', { error });
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
