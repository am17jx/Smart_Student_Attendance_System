
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Inspecting Latest Session Attendance Records...');

    // 1. Get the most recent session
    const lastSession = await prisma.session.findFirst({
        orderBy: { id: 'desc' },
        include: { material: true }
    });

    if (!lastSession) {
        console.log('❌ No sessions found.');
        return;
    }

    console.log(`SESSION ID: ${lastSession.id}`);
    console.log(`Material: ${lastSession.material.name}`);
    console.log(`Date: ${lastSession.session_date}`);
    console.log(`Is Active: ${lastSession.is_active}`);

    // 2. Get records
    const records = await prisma.attendanceRecord.findMany({
        where: { session_id: lastSession.id }
    });

    console.log(`\n📋 Attendance Records (${records.length}):`);

    const stats: { [key: string]: number } = {
        PRESENT: 0,
        ABSENT: 0,
        LATE: 0,
        EXCUSED: 0,
        system_auto: 0,
        qr_scan: 0
    };

    records.forEach(r => {
        // Count statuses
        const s = r.status || 'UNDEFINED'; // Access status if it exists
        stats[s] = (stats[s] || 0) + 1;

        // Count source
        stats[r.marked_by] = (stats[r.marked_by] || 0) + 1;

        console.log(` - Student ${r.student_id}: Status=${r.status}, MarkedBy=${r.marked_by}, Time=${r.marked_at}`);
    });

    console.log('\n📊 Summary Stats:');
    console.log(stats);

    // 3. Check for specific issue
    const autoMarkedPresent = records.filter(r => r.marked_by === 'system_auto' && r.status === 'PRESENT');
    if (autoMarkedPresent.length > 0) {
        console.log(`\n⚠️ CRITICAL ISSUE FOUND: ${autoMarkedPresent.length} records are marked by 'system_auto' but have status 'PRESENT'.`);
        console.log('   This confirms the server defaulted to PRESENT because it failed to write ABSENT.');

        // Auto-fix prompt
        console.log('\n🛠️  Attempting to FIX data...');
        const updateResult = await prisma.attendanceRecord.updateMany({
            where: {
                session_id: lastSession.id,
                marked_by: 'system_auto',
                status: 'PRESENT'
            },
            data: {
                status: 'ABSENT'
            }
        });
        console.log(`✅ Fixed ${updateResult.count} records. set to ABSENT.`);
    } else {
        console.log('\n✅ No data inconsistencies found (Auto-marked records are NOT Present).');
    }

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
