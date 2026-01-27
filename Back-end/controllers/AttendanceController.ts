import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";
import PDFDocument from "pdfkit";

/**
  GET /attendance/session/:sessionId
 */
export const getSessionAttendance = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {

        const { sessionId } = req.params;

        const records = await prisma.attendanceRecord.findMany({
            where: {
                session_id: BigInt(sessionId),
            },
            include: {
                student: true,
            },
        });

        res.status(200).json({
            status: "success",
            results: records.length,
            data: { records },
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
                student_id: BigInt(studentId),
            },
            include: {
                session: true,
            },
        });

        res.status(200).json({
            status: "success",
            results: records.length,
            data: { records },
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
            where: { id: BigInt(id) }
        });

        if (!existing) {
            return next(new AppError('Attendance record not found', 404));
        }

        const record = await prisma.attendanceRecord.update({
            where: { id: BigInt(id) },
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
            where: { id: BigInt(sessionId) },
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
                session_id: BigInt(sessionId),
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

