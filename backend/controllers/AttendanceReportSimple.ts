import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import PDFDocument from 'pdfkit';

function ar(text: string): string {
    if (!text) return '';
    return String(text).split(' ').reverse().join(' ');
}

function getArabicFont(): string {
    return require.resolve('noto-sans-arabic/fonts/Regular.ttf');
}

export const generateSimpleAttendanceReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { sessionId } = req.params;

        const session = await prisma.session.findUnique({
            where: { id: BigInt(sessionId as string) },
            include: {
                material: { include: { department: true, stage: true } },
                teacher: true
            }
        });

        if (!session) {
            return next(new AppError('Session not found', 404));
        }

        const allStudents = await prisma.student.findMany({
            where: {
                department_id: session.material.department_id,
                stage_id: session.material.stage_id
            },
            include: { department: true, stage: true },
            orderBy: { name: 'asc' }
        });

        const records = await prisma.attendanceRecord.findMany({
            where: { session_id: BigInt(sessionId as string) },
            include: { student: { include: { department: true, stage: true } } },
            orderBy: { marked_at: 'asc' }
        });

        const studentList: any[] = [];
        allStudents.forEach((student) => {
            const record = records.find(r => r.student_id.toString() === student.id.toString());
            const isPresent = record && (record.status === 'PRESENT' || record.status === 'LATE');
            studentList.push({
                index: 0,
                student_id: student.student_id || '',
                name: student.name,
                department: student.department?.name || '',
                status: isPresent ? 'حاضر' : 'غائب',
                statusClass: isPresent ? 'present' : 'absent',
                time: isPresent ? record!.marked_at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-'
            });
        });

        studentList.sort((a, b) => a.name.localeCompare(b.name));
        studentList.forEach((s, i) => s.index = i + 1);

        const presentCount = studentList.filter(s => s.statusClass === 'present').length;
        const absentCount = studentList.filter(s => s.statusClass === 'absent').length;

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

            // Header
            doc.fontSize(20).text(ar('تقرير الحضور'), M, 40, { width: CW, align: 'center' });
            doc.moveDown(0.3);
            doc.moveTo(M, doc.y).lineTo(W - M, doc.y).lineWidth(2).stroke();
            doc.moveDown(0.6);

            // Info
            doc.fontSize(11);
            const info = [
                [ar('المادة:'), ar(session.material.name)],
                [ar('القسم:'), ar(session.material.department.name)],
                [ar('المرحلة:'), ar(session.material.stage.name)],
                [ar('الأستاذ:'), ar(session.teacher.name)],
                [ar('التاريخ:'), session.session_date.toLocaleDateString('en-GB')],
            ];
            for (const [label, value] of info) {
                const y = doc.y;
                doc.text(String(value), M, y, { width: CW - 120, align: 'left' });
                doc.text(String(label), W - M - 120, y, { width: 120, align: 'right' });
                doc.moveDown(0.1);
            }
            doc.moveDown(0.5);

            // Stats
            const statY = doc.y;
            const statW = CW / 3 - 5;
            const stats = [
                { label: ar('الحضور'), value: String(presentCount), color: '#155724', bg: '#d4edda' },
                { label: ar('الغياب'), value: String(absentCount), color: '#721c24', bg: '#f8d7da' },
                { label: ar('العدد الكلي'), value: String(presentCount + absentCount), color: '#383d41', bg: '#e2e3e5' },
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

            // Table
            const colWidths = [30, 90, 130, 65, 45, 50];
            const headers = [ar('ت'), ar('الرقم الجامعي'), ar('الاسم'), ar('القسم'), ar('الحالة'), ar('الوقت')];
            const rowH = 22;
            const startTableY = doc.y;

            doc.rect(M, startTableY, CW, rowH).fill('#f0f0f0');
            doc.fillColor('#000');
            let hx = M;
            for (let i = 0; i < headers.length; i++) {
                doc.fontSize(9).text(headers[i], hx + 2, startTableY + 6, { width: colWidths[i] - 4, align: 'center' });
                hx += colWidths[i];
            }
            doc.y = startTableY + rowH;

            for (let ri = 0; ri < studentList.length; ri++) {
                const s = studentList[ri];
                if (doc.y + rowH > doc.page.height - 60) {
                    doc.addPage();
                    doc.y = 40;
                }
                const rowY = doc.y;
                doc.rect(M, rowY, CW, rowH).fill(ri % 2 === 0 ? '#ffffff' : '#f9f9f9');

                const statusBg = s.statusClass === 'present' ? '#d4edda' : '#f8d7da';
                const statusColor = s.statusClass === 'present' ? '#155724' : '#721c24';

                const cells = [
                    { text: String(s.index), color: '#000', cellBg: null },
                    { text: String(s.student_id), color: '#000', cellBg: null },
                    { text: ar(s.name), color: '#000', cellBg: null },
                    { text: ar(s.department), color: '#000', cellBg: null },
                    { text: ar(s.status), color: statusColor, cellBg: statusBg },
                    { text: s.time, color: '#000', cellBg: null },
                ];

                let cx = M;
                for (let ci = 0; ci < cells.length; ci++) {
                    const cell = cells[ci];
                    if (cell.cellBg) doc.rect(cx, rowY, colWidths[ci], rowH).fill(cell.cellBg);
                    doc.fillColor(cell.color).fontSize(8)
                        .text(cell.text, cx + 2, rowY + 6, { width: colWidths[ci] - 4, align: 'center', lineBreak: false });
                    cx += colWidths[ci];
                }
                doc.rect(M, rowY, CW, rowH).stroke('#dddddd');
                doc.fillColor('#000');
                doc.y = rowY + rowH;
            }

            // Footer
            doc.moveDown(1);
            doc.moveTo(M, doc.y).lineTo(W - M, doc.y).lineWidth(1).stroke('#dddddd');
            doc.moveDown(0.3);
            doc.fontSize(9).fillColor('#666666')
                .text(`${ar('تم إنشاء التقرير في:')} ${new Date().toLocaleString('en-GB')}`, M, doc.y, { width: CW, align: 'center' });
            doc.text('Privacy-Preserving Student Attendance System', M, doc.y + 2, { width: CW, align: 'center' });

            doc.end();
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="attendance-report-${sessionId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length.toString());
        res.send(pdfBuffer);
    }
);
