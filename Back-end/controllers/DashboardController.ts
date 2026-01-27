
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';

export const getAdminDashboard = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const totalStudents = await prisma.student.count();
    const totalTeachers = await prisma.teacher.count();
    const totalDepartments = await prisma.department.count();
    const totalMaterials = await prisma.material.count();

    // Use AttendanceRecord as a proxy for recent system activity
    const recentActivity = await prisma.attendanceRecord.findMany({
        take: 5,
        orderBy: { marked_at: 'desc' },
        include: {
            student: { select: { name: true, email: true } },
            session: { select: { material: { select: { name: true } } } }
        }
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
                sessions: sessionsCount
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
