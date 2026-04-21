import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import puppeteer from 'puppeteer';
import os from 'os';
import path from 'path';
import fs from 'fs';

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
                time: isPresent
                    ? record!.marked_at.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
                    : '-'
            });
        });

        studentList.sort((a, b) => a.name.localeCompare(b.name));
        studentList.forEach((s, i) => (s.index = i + 1));

        const presentCount = studentList.filter(s => s.statusClass === 'present').length;
        const absentCount = studentList.filter(s => s.statusClass === 'absent').length;
        const totalCount = presentCount + absentCount;

        // ─── HTML ──────────────────────────────────────────────────────────
        // لا يوجد أي اعتماد على شبكة الإنترنت — Times New Roman موجود على
        // كل نظام Windows / Linux (liberation-serif) / macOS
        const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>تقرير الحضور</title>
<style>
  /* ─── Reset ─────────────────────────────────── */
  * { margin: 0; padding: 0; box-sizing: border-box; }

  /* ─── Base ──────────────────────────────────── */
  body {
    font-family: "Times New Roman", "Liberation Serif", serif;
    font-size: 14pt;
    color: #111;
    background: #fff;
    padding: 30px 40px;
    direction: rtl;
  }

  /* ─── Header ────────────────────────────────── */
  .header {
    text-align: center;
    border-bottom: 3px double #333;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .header h1 {
    font-size: 26pt;
    font-weight: bold;
    letter-spacing: 1px;
  }

  /* ─── Info table ────────────────────────────── */
  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 22px;
    font-size: 13pt;
  }
  .info-table td {
    padding: 5px 10px;
    vertical-align: top;
  }
  .info-table .lbl {
    font-weight: bold;
    white-space: nowrap;
    width: 130px;
    color: #444;
  }

  /* ─── Stats bar ─────────────────────────────── */
  .stats {
    display: flex;
    gap: 16px;
    margin-bottom: 22px;
  }
  .stat {
    flex: 1;
    text-align: center;
    padding: 10px 6px;
    border-radius: 6px;
    font-size: 13pt;
    font-weight: bold;
    border: 1.5px solid;
  }
  .stat-present { background: #e9f5ec; color: #1a5c2a; border-color: #a3d9ae; }
  .stat-absent  { background: #fdf0f0; color: #7b1c1c; border-color: #f0aaaa; }
  .stat-total   { background: #f0f0f0; color: #333;    border-color: #bbb;    }
  .stat span    { display: block; font-size: 10pt; font-weight: normal; margin-bottom: 4px; }

  /* ─── Main table ────────────────────────────── */
  table.data {
    width: 100%;
    border-collapse: collapse;
    font-size: 12pt;
  }
  table.data thead tr {
    background: #2c2c2c;
    color: #fff;
  }
  table.data th {
    padding: 10px 8px;
    text-align: center;
    font-weight: bold;
    border: 1px solid #444;
  }
  table.data td {
    padding: 8px;
    text-align: center;
    border: 1px solid #ccc;
  }
  table.data tbody tr:nth-child(even) { background: #f9f9f9; }
  table.data tbody tr:hover           { background: #f0f4ff; }

  .present { color: #1a5c2a; font-weight: bold; }
  .absent  { color: #7b1c1c; font-weight: bold; }

  /* ─── Footer ────────────────────────────────── */
  .footer {
    margin-top: 28px;
    text-align: center;
    font-size: 10pt;
    color: #777;
    border-top: 1px solid #ddd;
    padding-top: 12px;
  }
</style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <h1>تقرير الحضور</h1>
  </div>

  <!-- INFO -->
  <table class="info-table">
    <tr>
      <td class="lbl">المادة:</td>
      <td>${session.material.name}</td>
      <td class="lbl">الأستاذ:</td>
      <td>${session.teacher.name}</td>
    </tr>
    <tr>
      <td class="lbl">القسم:</td>
      <td>${session.material.department.name}</td>
      <td class="lbl">المرحلة:</td>
      <td>${session.material.stage.name}</td>
    </tr>
    <tr>
      <td class="lbl">التاريخ:</td>
      <td colspan="3">${session.session_date.toLocaleDateString('ar-IQ')}</td>
    </tr>
  </table>

  <!-- STATS -->
  <div class="stats">
    <div class="stat stat-present"><span>الحضور</span>${presentCount}</div>
    <div class="stat stat-absent"><span>الغياب</span>${absentCount}</div>
    <div class="stat stat-total"><span>المجموع</span>${totalCount}</div>
  </div>

  <!-- DATA TABLE -->
  <table class="data">
    <thead>
      <tr>
        <th style="width:50px">ت</th>
        <th style="width:120px">الرقم الجامعي</th>
        <th>الاسم</th>
        <th style="width:160px">القسم</th>
        <th style="width:80px">الحالة</th>
        <th style="width:90px">الوقت</th>
      </tr>
    </thead>
    <tbody>
      ${studentList.map((s: any) => `
      <tr>
        <td>${s.index}</td>
        <td>${s.student_id}</td>
        <td style="text-align:right; padding-right:12px">${s.name}</td>
        <td>${s.department}</td>
        <td class="${s.statusClass}">${s.status}</td>
        <td>${s.time}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <!-- FOOTER -->
  <div class="footer">
    <p>تم إنشاء التقرير في: ${new Date().toLocaleString('ar-IQ')}</p>
    <p>Privacy-Preserving Student Attendance System</p>
  </div>

</body>
</html>`;

        // ─── Puppeteer ─────────────────────────────────────────────────────
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-'));

        // دعم Windows و Linux في نفس الوقت
        const chromePaths = [
            // Windows
            'C:/Program Files/Google/Chrome/Application/chrome.exe',
            'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
            // Linux (Ubuntu / Debian)
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
        ];
        const executablePath = chromePaths.find(p => fs.existsSync(p));

        const browser = await puppeteer.launch({
            headless: true,
            executablePath,
            userDataDir: tmpDir,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--disable-extensions',
            ]
        });

        const page = await browser.newPage();

        // domcontentloaded — لا ننتظر أي طلبات شبكة
        await page.setContent(html, { waitUntil: 'domcontentloaded' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
        });

        await browser.close();
        fs.rmSync(tmpDir, { recursive: true, force: true });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="attendance-report-${sessionId}.pdf"`
        );
        res.setHeader('Content-Length', pdfBuffer.length.toString());
        res.send(Buffer.from(pdfBuffer));
    }
);