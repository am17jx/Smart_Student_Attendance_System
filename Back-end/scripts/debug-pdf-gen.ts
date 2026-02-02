
import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function generateReport(sessionId: bigint) {
    console.log('📊 Generating PDF for session:', sessionId);

    // Get session details
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
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
        console.error('Session not found');
        return;
    }

    // Get ALL students
    const allStudents = await prisma.student.findMany({
        where: {
            department_id: session.material.department_id,
            stage_id: session.material.stage_id
        },
        include: {
            department: true,
            stage: true
        },
        orderBy: {
            name: 'asc'
        }
    });

    // Get attendance records
    const records = await prisma.attendanceRecord.findMany({
        where: {
            session_id: sessionId,
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

    const rosterStudentIds = new Set(allStudents.map(s => s.id.toString()));
    const attendedStudentIds = new Set<string>();

    const studentList: any[] = [];

    // Process Present
    records.forEach(record => {
        const studentIdStr = record.student_id.toString();
        attendedStudentIds.add(studentIdStr);
        const isGuest = !rosterStudentIds.has(studentIdStr);

        studentList.push({
            student_id: record.student.student_id || '',
            name: record.student.name,
            department: record.student.department?.name || '',
            status: 'حاضر',
            statusClass: 'present',
            isGuest: isGuest,
            time: record.marked_at.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
        });
    });

    // Process Absent
    allStudents.forEach(student => {
        if (!attendedStudentIds.has(student.id.toString())) {
            studentList.push({
                student_id: student.student_id || '',
                name: student.name,
                department: student.department?.name || '',
                status: 'غائب',
                statusClass: 'absent',
                isGuest: false,
                time: '-'
            });
        }
    });

    studentList.sort((a, b) => {
        if (a.isGuest && !b.isGuest) return 1;
        if (!a.isGuest && b.isGuest) return -1;
        return a.name.localeCompare(b.name);
    });

    const finalStudentList = studentList.map((s, index) => ({ ...s, index: index + 1 }));

    const totalAttendees = records.length;
    const absentCount = allStudents.length - records.filter(r => rosterStudentIds.has(r.student_id.toString())).length;
    const classSize = allStudents.length;

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>Attendance Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, parse; padding: 40px; background: white; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #333; padding-bottom: 20px; }
        h1 { font-size: 28px; }
        .info { margin-bottom: 30px; }
        .info-row { display: flex; margin-bottom: 8px; }
        .info-label { font-weight: bold; width: 150px; }
        .stats { display: flex; gap: 20px; margin-bottom: 20px; }
        .stat-box { padding: 10px 20px; border-radius: 8px; background: #eee; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
        .present { background: #d4edda; color: #155724; }
        .absent { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="header"><h1>تقرير الحضور</h1></div>
    <div class="info">
        <div class="info-row"><span class="info-label">المادة:</span><span>${session.material.name}</span></div>
    </div>
    <div class="stats">
        <div class="stat-box">الحضور: ${totalAttendees}</div>
        <div class="stat-box">الغياب: ${absentCount}</div>
    </div>
    <table>
        <thead>
            <tr><th>الوقت</th><th>الحالة</th><th>الاسم</th></tr>
        </thead>
        <tbody>
            ${finalStudentList.map(s => `
                <tr>
                    <td>${s.time}</td>
                    <td class="${s.statusClass}">${s.status}</td>
                    <td>${s.name}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>
    `;

    console.log('🚀 Launching Puppeteer...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    console.log('📄 Setting content...');
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    console.log('🖨️ Generating PDF...');
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true
    });

    await browser.close();

    fs.writeFileSync('debug_generated_report.pdf', pdfBuffer);
    console.log(`✅ PDF Generated: debug_generated_report.pdf (${pdfBuffer.length} bytes)`);
}

generateReport(BigInt(221))
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
