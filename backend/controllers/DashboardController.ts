
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import logger from '../utils/logger';
import { withCache } from '../utils/cacheUtils';

export const getAdminDashboard = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).user;
    const adminId = admin?.id?.toString();
    const deptId = admin?.department_id?.toString() || 'all';
    const cacheKey = `dashboard:admin:${adminId}:dept:${deptId}`;

    logger.info('🔍 [getAdminDashboard] Admin:', {
        id: adminId,
        department_id: admin?.department_id?.toString() || 'NULL (Dean)'
    });

    const data = await withCache(cacheKey, 30, async () => {
        // Determine department filter
        const departmentFilter = admin.department_id
            ? { department_id: admin.department_id }
            : {}; // Dean sees all

        const totalStudents = await prisma.student.count({ where: departmentFilter });
        const totalTeachers = await prisma.teacher.count({ where: departmentFilter });
        const totalDepartments = admin.department_id
            ? 1
            : await prisma.department.count();
        const totalMaterials = await prisma.material.count({ where: departmentFilter });

        const recentActivity = await prisma.attendanceRecord.findMany({
            where: {
                status: { in: ['PRESENT', 'LATE'] },
                ...(admin.department_id ? { student: { department_id: admin.department_id } } : {})
            },
            take: 10,
            orderBy: { marked_at: 'desc' },
            include: {
                student: { select: { name: true, email: true } },
                session: {
                    select: {
                        material: { select: { name: true } },
                        teacher: { select: { name: true } }
                    }
                }
            }
        });

        const activeSessions = await prisma.session.count({
            where: {
                is_active: true,
                ...(admin.department_id ? { material: { department_id: admin.department_id } } : {})
            }
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // 1. Attendance Rate Today
        const todaysSessions = await prisma.session.findMany({
            where: {
                session_date: { gte: today, lt: tomorrow },
                ...(admin.department_id ? { material: { department_id: admin.department_id } } : {})
            },
            include: { material: true }
        });

        let totalExpectedToday = 0;
        for (const session of todaysSessions) {
            if (session.material) {
                totalExpectedToday += await prisma.student.count({
                    where: { stage_id: session.material.stage_id, department_id: session.material.department_id }
                });
            }
        }

        const todayActual = await prisma.attendanceRecord.count({
            where: {
                session_id: { in: todaysSessions.map(s => s.id) },
                status: { in: ['PRESENT', 'LATE'] }
            }
        });

        const todayAttendanceRate = totalExpectedToday > 0 ? Math.round((todayActual / totalExpectedToday) * 100) : 0;

        // 2. Attendance Rate Yesterday
        const yesterdaysSessions = await prisma.session.findMany({
            where: {
                session_date: { gte: yesterday, lt: today },
                ...(admin.department_id ? { material: { department_id: admin.department_id } } : {})
            },
            include: { material: true }
        });

        let totalExpectedYesterday = 0;
        for (const session of yesterdaysSessions) {
            if (session.material) {
                totalExpectedYesterday += await prisma.student.count({
                    where: { stage_id: session.material.stage_id, department_id: session.material.department_id }
                });
            }
        }

        const yesterdayActual = await prisma.attendanceRecord.count({
            where: {
                session_id: { in: yesterdaysSessions.map(s => s.id) },
                status: { in: ['PRESENT', 'LATE'] }
            }
        });

        const yesterdayAttendanceRate = totalExpectedYesterday > 0 ? Math.round((yesterdayActual / totalExpectedYesterday) * 100) : 0;

        // 3. Trends (Growth this month)
        const studentsThisMonth = await prisma.student.count({ where: { ...departmentFilter, created_at: { gte: firstDayOfMonth } } });
        const teachersThisMonth = await prisma.teacher.count({ where: { ...departmentFilter, created_at: { gte: firstDayOfMonth } } });
        const materialsThisMonth = await prisma.material.count({ where: { ...departmentFilter, created_at: { gte: firstDayOfMonth } } });

        const studentsTrend = totalStudents > studentsThisMonth ? Math.round((studentsThisMonth / (totalStudents - studentsThisMonth)) * 100) : (totalStudents > 0 ? 100 : 0);
        const teachersTrend = totalTeachers > teachersThisMonth ? Math.round((teachersThisMonth / (totalTeachers - teachersThisMonth)) * 100) : (totalTeachers > 0 ? 100 : 0);
        const materialsTrend = totalMaterials > materialsThisMonth ? Math.round((materialsThisMonth / (totalMaterials - materialsThisMonth)) * 100) : (totalMaterials > 0 ? 100 : 0);

        const failedAttempts = await prisma.failedAttempt.findMany({
            where: admin.department_id ? {
                session: { material: { department_id: admin.department_id } }
            } : {},
            take: 10,
            orderBy: { attempted_at: 'desc' },
            include: {
                student: { select: { name: true, student_id: true } },
                session: {
                    select: {
                        material: { select: { name: true } },
                        session_date: true,
                        teacher: { select: { name: true } }
                    }
                }
            }
        });

        logger.info('✅ [getAdminDashboard] Stats fetched from DB:', {
            students: totalStudents, teachers: totalTeachers,
            departments: totalDepartments, materials: totalMaterials
        });

        return {
            stats: {
                students: totalStudents,
                teachers: totalTeachers,
                departments: totalDepartments,
                materials: totalMaterials,
                sessions: activeSessions,
                attendanceRate: todayAttendanceRate,
                yesterdayAttendanceRate: yesterdayAttendanceRate,
                studentsTrend,
                teachersTrend,
                materialsTrend
            },
            recentActivity,
            failedAttempts
        };
    });

    res.status(200).json({ status: 'success', data });
});

export const getTeacherDashboard = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.teacher) {
        return next(new AppError('Teacher profile not found', 404));
    }

    const teacherId = req.teacher.id;
    const cacheKey = `dashboard:teacher:${teacherId.toString()}`;

    const data = await withCache(cacheKey, 30, async () => {
        // Materials assigned to this teacher
        const materialsCount = await prisma.teacherMaterial.count({
            where: { teacher_id: teacherId }
        });

        // Sessions created by this teacher
        const sessionsCount = await prisma.session.count({
            where: { teacher_id: teacherId }
        });

        // Get today's start and end
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get sessions created this month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        const sessionsThisMonth = await prisma.session.count({
            where: {
                teacher_id: teacherId,
                created_at: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });

        // Today's attendance
        const todaysSessions = await prisma.session.findMany({
            where: {
                teacher_id: teacherId,
                created_at: { gte: today, lt: tomorrow }
            },
            select: { id: true }
        });

        const todaySessionIds = todaysSessions.map(s => s.id);

        const todayAttendance = todaySessionIds.length > 0 ? await prisma.attendanceRecord.count({
            where: { session_id: { in: todaySessionIds } }
        }) : 0;

        // Calculate attendance rate
        const allTeacherSessions = await prisma.session.findMany({
            where: { teacher_id: teacherId },
            include: {
                attendance_records: true,
                material: true
            }
        });

        let totalExpectedAttendance = 0;
        let totalActualAttendance = 0;

        for (const session of allTeacherSessions) {
            if (session.material) {
                const studentCount = await prisma.student.count({
                    where: { stage_id: session.material.stage_id }
                });
                totalExpectedAttendance += studentCount;
            }
            totalActualAttendance += session.attendance_records.length;
        }

        const attendanceRate = totalExpectedAttendance > 0
            ? Math.round((totalActualAttendance / totalExpectedAttendance) * 100)
            : 0;

        // Recent sessions
        const recentSessionsRaw = await prisma.session.findMany({
            where: { teacher_id: teacherId },
            take: 5,
            orderBy: { created_at: 'desc' },
            include: {
                material: {
                    select: {
                        name: true,
                        stage_id: true,
                        department_id: true
                    }
                },
                _count: { select: { attendance_records: true } }
            }
        });

        // Add total_students to each session
        const recentSessions = await Promise.all(recentSessionsRaw.map(async (session) => {
            const studentCount = await prisma.student.count({
                where: {
                    stage_id: session.material.stage_id,
                    department_id: session.material.department_id
                }
            });
            return {
                ...session,
                id: session.id.toString(),
                total_students: studentCount
            };
        }));

        // Recent attendance for this teacher's sessions (only PRESENT or LATE, not ABSENT)
        const allSessionIds = allTeacherSessions.map(s => s.id);
        const recentAttendance = allSessionIds.length > 0 ? await prisma.attendanceRecord.findMany({
            where: {
                session_id: { in: allSessionIds },
                status: { in: ['PRESENT', 'LATE'] }
            },
            take: 10,
            orderBy: { marked_at: 'desc' },
            include: {
                student: { select: { name: true, email: true } },
                session: { select: { material: { select: { name: true } } } }
            }
        }) : [];

        // Total unique students attended
        const uniqueStudents = allSessionIds.length > 0 ? await prisma.attendanceRecord.groupBy({
            by: ['student_id'],
            where: { session_id: { in: allSessionIds } }
        }) : [];

        // 4. Get failed attempts for this teacher's sessions
        const failedAttempts = allSessionIds.length > 0 ? await prisma.failedAttempt.findMany({
            where: { session_id: { in: allSessionIds } },
            take: 15,
            orderBy: { attempted_at: 'desc' },
            include: {
                student: { select: { name: true, student_id: true } },
                session: {
                    select: {
                        material: { select: { name: true } },
                        session_date: true
                    }
                }
            }
        }) : [];

        return {
            stats: {
                materials: materialsCount,
                sessions: sessionsCount,
                sessionsThisMonth: sessionsThisMonth,
                todayAttendance: todayAttendance,
                attendanceRate: attendanceRate,
                totalStudentsAttended: uniqueStudents.length
            },
            recentSessions,
            recentAttendance,
            failedAttempts
        };
    }); // end withCache

    res.status(200).json({ status: 'success', data });
});

export const getStudentDashboard = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.student) {
        return next(new AppError('Student profile not found', 404));
    }

    const studentId = req.student.id;
    const cacheKey = `dashboard:student:${studentId.toString()}`;

    logger.info('🔍 [getStudentDashboard] Fetching dashboard for student:', {
        studentId: studentId.toString()
    });

    const data = await withCache(cacheKey, 60, async () => {
        // Get student full info with department and stage
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                department: { select: { name: true } },
                stage: { select: { name: true, level: true } }
            }
        });

        if (!student) {
            throw new AppError('Student not found', 404);
        }

        // 1. Get ALL sessions the student is supposed to attend
        const expectedSessions = await prisma.session.findMany({
            where: {
                material: {
                    department_id: student.department_id!,
                    stage_id: student.stage_id!
                }
            },
            include: {
                material: { select: { id: true, name: true } },
                teacher: { select: { name: true } },
                geofence: { select: { name: true } }
            },
            orderBy: { session_date: 'desc' }
        });

        // 2. Get student's actual attendance records
        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: { student_id: studentId }
        });

        // Map records for quick lookup
        const recordMap = new Map();
        attendanceRecords.forEach((r: any) => recordMap.set(r.session_id.toString(), r));

        // Calculate stats by status
        const statusCounts = {
            PRESENT: 0,
            LATE: 0,
            ABSENT: 0,
            EXCUSED: 0
        };

        // Calculate stats by material
        const materialStatsMap = new Map<string, {
            materialId: string;
            materialName: string;
            attended: number;
            late: number;
            absent: number;
            totalSessions: number;
        }>();

        // Process all EXPECTED sessions
        expectedSessions.forEach(session => {
            const materialId = session.material.id.toString();
            const materialName = session.material.name;

            if (!materialStatsMap.has(materialId)) {
                materialStatsMap.set(materialId, {
                    materialId,
                    materialName,
                    attended: 0,
                    late: 0,
                    absent: 0,
                    totalSessions: 0
                });
            }

            const stats = materialStatsMap.get(materialId)!;
            stats.totalSessions++;

            // Find record or default to ABSENT
            const record = recordMap.get(session.id.toString());
            const status = record?.status || 'ABSENT';

            if (statusCounts.hasOwnProperty(status)) {
                statusCounts[status as keyof typeof statusCounts]++;
            }

            if (status === 'PRESENT') stats.attended++;
            else if (status === 'LATE') stats.late++;
            else if (status === 'ABSENT') stats.absent++;
        });

        // Convert to array and calculate attendance rates
        const byMaterial = Array.from(materialStatsMap.values()).map(mat => ({
            materialId: mat.materialId,
            materialName: mat.materialName,
            attended: mat.attended,
            late: mat.late,
            absent: mat.absent,
            totalSessions: mat.totalSessions,
            attendanceRate: mat.totalSessions > 0
                ? (((mat.attended + mat.late) / mat.totalSessions) * 100).toFixed(2)
                : '0'
        }));

        // Calculate overall stats
        const totalSessions = expectedSessions.length;
        const attendedCount = statusCounts.PRESENT + statusCounts.LATE;
        const percentage = totalSessions > 0
            ? ((attendedCount / totalSessions) * 100).toFixed(2)
            : '0';

        // Determine status based on percentage
        let status: 'excellent' | 'good' | 'warning' | 'danger';
        const percentNum = parseFloat(percentage);

        if (totalSessions === 0) {
            status = 'excellent';
        } else if (percentNum >= 90) {
            status = 'excellent';
        } else if (percentNum >= 75) {
            status = 'good';
        } else if (percentNum >= 60) {
            status = 'warning';
        } else {
            status = 'danger';
        }

        const recentAttendance = expectedSessions.slice(0, 5).map(session => {
            const record = recordMap.get(session.id.toString());
            return {
                id: session.id.toString(),
                materialName: session.material.name,
                teacherName: session.teacher.name,
                status: record?.status || 'ABSENT',
                marked_at: record?.marked_at?.toISOString() || session.session_date.toISOString(),
                location: session.geofence?.name || 'غير محدد'
            };
        });

        logger.info('✅ [getStudentDashboard] Dashboard data prepared:', {
            studentId: studentId.toString(),
            totalSessions,
            attendedCount,
            percentage,
            status
        });

        return {
            studentInfo: {
                name: student.name,
                email: student.email,
                student_id: student.student_id || 'غير محدد',
                department: student.department?.name || 'غير محدد',
                stage: student.stage?.name || 'غير محدد'
            },
            stats: {
                totalSessions,
                attended: statusCounts.PRESENT,
                late: statusCounts.LATE,
                absent: statusCounts.ABSENT,
                excused: statusCounts.EXCUSED,
                percentage,
                status
            },
            byMaterial,
            recentAttendance
        };
    }); // end withCache

    res.status(200).json({ status: 'success', data });
});
