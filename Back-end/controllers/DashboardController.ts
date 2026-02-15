
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import logger from '../utils/logger';

export const getAdminDashboard = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).user;

    logger.info('🔍 [getAdminDashboard] Admin:', {
        id: admin?.id?.toString(),
        department_id: admin?.department_id?.toString() || 'NULL (Dean)'
    });

    // Determine department filter
    const departmentFilter = admin.department_id
        ? { department_id: admin.department_id }
        : {}; // Dean sees all

    const totalStudents = await prisma.student.count({
        where: departmentFilter
    });

    const totalTeachers = await prisma.teacher.count({
        where: departmentFilter
    });

    const totalDepartments = admin.department_id
        ? 1  // Department Head sees only their department
        : await prisma.department.count();

    const totalMaterials = await prisma.material.count({
        where: departmentFilter
    });

    // Filter recent activity by department (only PRESENT or LATE, not ABSENT)
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

    // Get active sessions count
    const activeSessions = await prisma.session.count({
        where: {
            is_active: true,
            ...(admin.department_id ? { material: { department_id: admin.department_id } } : {})
        }
    });

    // Get today's attendance rate
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await prisma.attendanceRecord.count({
        where: {
            marked_at: { gte: today, lt: tomorrow },
            ...(admin.department_id ? { student: { department_id: admin.department_id } } : {})
        }
    });

    logger.info('✅ [getAdminDashboard] Stats:', {
        students: totalStudents,
        teachers: totalTeachers,
        departments: totalDepartments,
        materials: totalMaterials
    });

    // Get failed attempts for this admin's department (or all if dean)
    const failedAttempts = await prisma.failedAttempt.findMany({
        where: admin.department_id ? {
            session: {
                material: {
                    department_id: admin.department_id
                }
            }
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

    res.status(200).json({
        status: 'success',
        data: {
            stats: {
                students: totalStudents,
                teachers: totalTeachers,
                departments: totalDepartments,
                materials: totalMaterials,
                sessions: activeSessions,
                attendanceRate: todayAttendance
            },
            recentActivity,
            failedAttempts
        }
    });
});

export const getTeacherDashboard = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.teacher) {
        return next(new AppError('Teacher profile not found', 404));
    }

    const teacherId = req.teacher.id;

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
    const recentSessions = await prisma.session.findMany({
        where: { teacher_id: teacherId },
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
            material: { select: { name: true } },
            _count: { select: { attendance_records: true } }
        }
    });

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

    res.status(200).json({
        status: 'success',
        data: {
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
        }
    });
});

export const getStudentDashboard = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.student) {
        return next(new AppError('Student profile not found', 404));
    }

    const studentId = req.student.id;

    logger.info('🔍 [getStudentDashboard] Fetching dashboard for student:', {
        studentId: studentId.toString()
    });

    // Get student full info with department and stage
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
            department: { select: { name: true } },
            stage: { select: { name: true, level: true } }
        }
    });

    if (!student) {
        return next(new AppError('Student not found', 404));
    }

    // Get all attendance records with session details
    const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: { student_id: studentId },
        include: {
            session: {
                include: {
                    material: { select: { id: true, name: true } },
                    teacher: { select: { name: true } },
                    geofence: { select: { name: true } }
                }
            }
        },
        orderBy: { marked_at: 'desc' }
    });

    // Calculate stats by status
    const statusCounts = {
        PRESENT: 0,
        LATE: 0,
        ABSENT: 0,
        EXCUSED: 0
    };

    attendanceRecords.forEach(record => {
        if (record.status && statusCounts.hasOwnProperty(record.status)) {
            statusCounts[record.status as keyof typeof statusCounts]++;
        }
    });

    // Calculate stats by material
    const materialStatsMap = new Map<string, {
        materialId: string;
        materialName: string;
        attended: number;
        late: number;
        absent: number;
        totalSessions: number;
    }>();

    attendanceRecords.forEach(record => {
        const materialId = record.session.material.id.toString();
        const materialName = record.session.material.name;

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

        if (record.status === 'PRESENT') stats.attended++;
        else if (record.status === 'LATE') stats.late++;
        else if (record.status === 'ABSENT') stats.absent++;
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
    const totalSessions = attendanceRecords.length;
    const attendedCount = statusCounts.PRESENT + statusCounts.LATE;
    const percentage = totalSessions > 0
        ? ((attendedCount / totalSessions) * 100).toFixed(2)
        : '0';

    // Determine status based on percentage
    let status: 'excellent' | 'good' | 'warning' | 'danger';
    const percentNum = parseFloat(percentage);
    if (percentNum >= 90) status = 'excellent';
    else if (percentNum >= 75) status = 'good';
    else if (percentNum >= 60) status = 'warning';
    else status = 'danger';

    // Recent attendance (last 5 records)
    const recentAttendance = attendanceRecords.slice(0, 5).map(record => ({
        id: record.id.toString(),
        materialName: record.session.material.name,
        teacherName: record.session.teacher.name,
        status: record.status || 'PRESENT',
        marked_at: record.marked_at.toISOString(),
        location: record.session.geofence?.name || 'غير محدد'
    }));

    logger.info('✅ [getStudentDashboard] Dashboard data prepared:', {
        studentId: studentId.toString(),
        totalSessions,
        attendedCount,
        percentage,
        status
    });

    res.status(200).json({
        status: 'success',
        data: {
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
        }
    });
});
