import { Request, Response, NextFunction } from "express"; // Force restart
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";
import PDFDocument from "pdfkit";

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

        console.log("🔍 Getting attendance for session:", sessionId);

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

        console.log("📊 Found", records.length, "attendance records");

        // Serialize BigInt values
        const serializedRecords = serializeBigInt(records);

        console.log("✅ Sending serialized records:", serializedRecords.length);

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
                material: true,
                geofence: true,
                attendance_records: {
                    include: {
                        student: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        // Calculate overall statistics
        const totalSessions = teacherSessions.length;
        const totalAttendees = teacherSessions.reduce(
            (sum, session) => sum + session.attendance_records.length, 0
        );
        const avgAttendancePerSession = totalSessions > 0
            ? Math.round(totalAttendees / totalSessions)
            : 0;

        // Get unique students who attended
        const uniqueStudentIds = new Set<string>();
        teacherSessions.forEach(session => {
            session.attendance_records.forEach(record => {
                uniqueStudentIds.add(record.student_id.toString());
            });
        });
        const uniqueStudents = uniqueStudentIds.size;

        // Statistics by material
        const materialStats = new Map<string, {
            materialId: bigint;
            materialName: string;
            totalSessions: number;
            totalAttendees: number;
        }>();

        teacherSessions.forEach(session => {
            const key = session.material_id.toString();
            if (!materialStats.has(key)) {
                materialStats.set(key, {
                    materialId: session.material_id,
                    materialName: session.material?.name || 'Unknown',
                    totalSessions: 0,
                    totalAttendees: 0
                });
            }
            const stat = materialStats.get(key)!;
            stat.totalSessions++;
            stat.totalAttendees += session.attendance_records.length;
        });

        const byMaterial = Array.from(materialStats.values()).map(stat => ({
            materialId: stat.materialId.toString(),
            materialName: stat.materialName,
            totalSessions: stat.totalSessions,
            totalAttendees: stat.totalAttendees,
            avgPerSession: stat.totalSessions > 0
                ? Math.round(stat.totalAttendees / stat.totalSessions)
                : 0
        }));

        // Monthly statistics (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyStats = new Map<string, { sessions: number; attendees: number }>();

        teacherSessions
            .filter(session => session.created_at >= sixMonthsAgo)
            .forEach(session => {
                const monthKey = session.created_at.toISOString().substring(0, 7);
                if (!monthlyStats.has(monthKey)) {
                    monthlyStats.set(monthKey, { sessions: 0, attendees: 0 });
                }
                const stat = monthlyStats.get(monthKey)!;
                stat.sessions++;
                stat.attendees += session.attendance_records.length;
            });

        const monthlyStatsArray = Array.from(monthlyStats.entries())
            .map(([month, stats]) => ({
                month,
                sessions: stats.sessions,
                attendees: stats.attendees,
                avgPerSession: stats.sessions > 0
                    ? Math.round(stats.attendees / stats.sessions)
                    : 0
            }))
            .sort((a, b) => a.month.localeCompare(b.month));

        // Recent sessions (last 10)
        const recentSessions = teacherSessions.slice(0, 10).map(session => ({
            id: session.id.toString(),
            materialName: session.material?.name || 'Unknown',
            location: session.geofence?.name || 'Unknown',
            date: session.session_date.toISOString().split('T')[0],
            attendeeCount: session.attendance_records.length,
            isActive: session.is_active
        }));

        // Weekly trend (last 4 weeks)
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        const weeklyData = teacherSessions
            .filter(session => session.created_at >= fourWeeksAgo)
            .reduce((acc, session) => {
                const weekNum = Math.floor(
                    (new Date().getTime() - session.created_at.getTime()) / (7 * 24 * 60 * 60 * 1000)
                );
                const weekLabel = weekNum === 0 ? 'هذا الأسبوع' :
                    weekNum === 1 ? 'الأسبوع الماضي' :
                        `قبل ${weekNum} أسابيع`;

                if (!acc[weekLabel]) {
                    acc[weekLabel] = { sessions: 0, attendees: 0 };
                }
                acc[weekLabel].sessions++;
                acc[weekLabel].attendees += session.attendance_records.length;
                return acc;
            }, {} as Record<string, { sessions: number; attendees: number }>);

        const weeklyTrend = Object.entries(weeklyData).map(([week, data]) => ({
            week,
            sessions: data.sessions,
            attendees: data.attendees
        }));

        const response = {
            totalSessions,
            totalAttendees,
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
export const generateAttendanceReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { sessionId } = req.params;

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

        // Get attendance records
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
            orderBy: {
                marked_at: 'asc'
            }
        });

        // Create PDF
        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${sessionId}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Add title
        doc.fontSize(20).text('Attendance Report', { align: 'center' });
        doc.moveDown();

        // Add session info
        doc.fontSize(12);
        doc.text(`Material: ${session.material.name}`);
        doc.text(`Department: ${session.material.department.name}`);
        doc.text(`Stage: ${session.material.stage.name}`);
        doc.text(`Teacher: ${session.teacher.name}`);
        doc.text(`Location: ${session.geofence.name}`);
        doc.text(`Date: ${session.session_date.toLocaleDateString()}`);
        doc.text(`Total Attendees: ${records.length}`);
        doc.moveDown();

        // Add table header
        doc.fontSize(14).text('Attendees List', { underline: true });
        doc.moveDown(0.5);

        // Table headers
        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('#', 50, tableTop, { width: 30 });
        doc.text('Student ID', 80, tableTop, { width: 80 });
        doc.text('Name', 160, tableTop, { width: 150 });
        doc.text('Department', 310, tableTop, { width: 100 });
        doc.text('Time', 410, tableTop, { width: 100 });

        doc.moveDown();
        doc.font('Helvetica');

        // Add line
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        // Add students
        records.forEach((record, index) => {
            const y = doc.y;

            // Check if we need a new page
            if (y > 700) {
                doc.addPage();
            }

            doc.fontSize(9);
            doc.text(String(index + 1), 50, y, { width: 30 });
            doc.text(record.student.student_id, 80, y, { width: 80 });
            doc.text(record.student.name, 160, y, { width: 150 });
            doc.text(record.student.department?.name || 'N/A', 310, y, { width: 100 });
            doc.text(record.marked_at.toLocaleTimeString(), 410, y, { width: 100 });

            doc.moveDown(0.8);
        });

        // Add footer
        doc.moveDown(2);
        doc.fontSize(8).text(
            `Generated on: ${new Date().toLocaleString()}`,
            { align: 'center' }
        );
        doc.text('Privacy-Preserving Student Attendance System', { align: 'center' });

        // Finalize PDF
        doc.end();
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

        console.log('📊 [getSessionAttendanceReport] Fetching report for session:', sessionId);

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

        console.log('🔍 [getSessionAttendanceReport] Material:', session.material.name);
        console.log('📚 Department:', session.material.department.name, '| Stage:', session.material.stage.name);

        // 2. Get ALL students in this department + stage
        const allStudents = await prisma.student.findMany({
            where: {
                department_id: session.material.department_id,
                stage_id: session.material.stage_id
            },
            select: {
                id: true,
                student_id: true,
                name: true,
                email: true,
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                stage: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        console.log('👥 [getSessionAttendanceReport] Total students in dept/stage:', allStudents.length);

        // 3. Get attendance records for this session
        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: {
                session_id: BigInt(sessionId as string)
            },
            include: {
                student: {
                    select: {
                        id: true,
                        student_id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        console.log('✅ [getSessionAttendanceReport] Attendance records:', attendanceRecords.length);

        // 4. Create attendance map
        const attendedStudentIds = new Set(
            attendanceRecords.map(record => record.student_id.toString())
        );

        // 5. Separate present and absent students
        const presentStudents = allStudents.filter(student =>
            attendedStudentIds.has(student.id.toString())
        ).map(student => ({
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
            status: 'present',
            marked_at: attendanceRecords.find(r => r.student_id === student.id)?.marked_at
        }));

        const absentStudents = allStudents.filter(student =>
            !attendedStudentIds.has(student.id.toString())
        ).map(student => ({
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
            status: 'absent'
        }));

        // 6. Calculate statistics
        const totalStudents = allStudents.length;
        const presentCount = presentStudents.length;
        const absentCount = absentStudents.length;
        const attendanceRate = totalStudents > 0
            ? Math.round((presentCount / totalStudents) * 100)
            : 0;

        console.log(`📈 [getSessionAttendanceReport] Stats - Total: ${totalStudents}, Present: ${presentCount}, Absent: ${absentCount}, Rate: ${attendanceRate}%`);

        // 7. Send response
        res.status(200).json({
            status: 'success',
            data: {
                session: {
                    id: session.id.toString(),
                    material: {
                        id: session.material.id.toString(),
                        name: session.material.name,
                        department: {
                            id: session.material.department.id.toString(),
                            name: session.material.department.name
                        },
                        stage: {
                            id: session.material.stage.id.toString(),
                            name: session.material.stage.name
                        }
                    },
                    geofence: session.geofence,
                    session_date: session.session_date,
                    expires_at: session.expires_at,
                    is_active: session.is_active
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
