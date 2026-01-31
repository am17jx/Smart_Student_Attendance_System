
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';

export const getAdminDashboard = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).user;

    console.log('🔍 [getAdminDashboard] Admin:', {
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

    // Filter recent activity by department
    const recentActivity = await prisma.attendanceRecord.findMany({
        where: admin.department_id ? {
            student: { department_id: admin.department_id }
        } : {},
        take: 5,
        orderBy: { marked_at: 'desc' },
        include: {
            student: { select: { name: true, email: true } },
            session: { select: { material: { select: { name: true } } } }
        }
    });

    console.log('✅ [getAdminDashboard] Stats:', {
        students: totalStudents,
        teachers: totalTeachers,
        departments: totalDepartments,
        materials: totalMaterials
    });

    res.status(200).json({
        status: 'success',
        data: {
            stats: {
                students: totalStudents,
                teachers: totalTeachers,
                departments: totalDepartments,
                materials: totalMaterials
            },
            recentActivity
        }
    });
});

export const getTeacherDashboard = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.teacher) {
        return next(new AppError('Teacher profile not found', 404));
    }

    const teacherId = req.teacher.id; // teacher.id is BigInt

    // Materials assigned to this teacher (via TeacherMaterial join table)
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

    // Today's students (attendance records for today's sessions)
    const todaysSessions = await prisma.session.findMany({
        where: {
            teacher_id: teacherId,
            created_at: {
                gte: today,
                lt: tomorrow
            }
        },
        select: { id: true }
    });

    const todaySessionIds = todaysSessions.map(s => s.id);

    const todayAttendance = todaySessionIds.length > 0 ? await prisma.attendanceRecord.count({
        where: {
            session_id: { in: todaySessionIds }
        }
    }) : 0;

    // Calculate attendance rate: (total attendance records / (total sessions * average expected students))
    // For simplicity, we'll calculate based on actual attendance vs sessions
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
        // Count students from the session's material stage
        if (session.material) {
            const studentCount = await prisma.student.count({
                where: {
                    stage_id: session.material.stage_id
                }
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
            material: { select: { name: true } }
        }
    });

    res.status(200).json({
        status: 'success',
        data: {
            stats: {
                materials: materialsCount,
                sessions: sessionsCount,
                sessionsThisMonth: sessionsThisMonth,
                todayAttendance: todayAttendance,
                attendanceRate: attendanceRate
            },
            recentSessions
        }
    });
});

export const getStudentDashboard = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.student) {
        return next(new AppError('Student profile not found', 404));
    }

    const studentId = req.student.id;
    const stageId = req.student.stage_id;
    const departmentId = req.student.department_id;

    if (!stageId || !departmentId) {
        // Handle case where student is not assigned to a stage/department yet
        return res.status(200).json({
            status: 'success',
            data: {
                stats: {
                    totalSessions: 0,
                    attended: 0,
                    absent: 0,
                    percentage: 0
                },
                recentAttendance: []
            }
        });
    }

    // Total sessions available for this student's stage and department
    const totalPossibleSessions = await prisma.session.count({
        where: {
            material: {
                stage_id: stageId,
                department_id: departmentId
            }
        }
    });

    // Attendance records for this student (Only 'present' counts exist as records)
    const attendedCount = await prisma.attendanceRecord.count({
        where: {
            student_id: studentId
        }
    });

    // Absent count is inferred
    const absentCount = Math.max(0, totalPossibleSessions - attendedCount);

    const attendancePercentage = totalPossibleSessions > 0
        ? ((attendedCount / totalPossibleSessions) * 100).toFixed(2)
        : 0;

    const recentAttendance = await prisma.attendanceRecord.findMany({
        where: { student_id: studentId },
        take: 5,
        orderBy: { marked_at: 'desc' },
        include: {
            session: {
                include: {
                    material: { select: { name: true } }
                }
            }
        }
    });

    res.status(200).json({
        status: 'success',
        data: {
            stats: {
                totalSessions: totalPossibleSessions,
                attended: attendedCount,
                absent: absentCount,
                percentage: attendancePercentage
            },
            recentAttendance
        }
    });
});
