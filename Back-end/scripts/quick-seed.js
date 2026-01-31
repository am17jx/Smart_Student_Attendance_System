const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    console.log('\n🌱 Creating test data for promotion system...\n');

    // Get existing data
    const dept = await prisma.department.findFirst();
    const stage3 = await prisma.stage.findFirst({ where: { level: 3 } });
    const mats = await prisma.material.findMany({ where: { stage_id: stage3.id }, take: 5 });

    if (!dept || !stage3 || mats.length < 3) {
        console.log('❌ Missing basic data (department/stages/materials)');
        return;
    }

    const year = '2024-2025';
    const students = [
        { name: 'أحمد محمد - ناجح', id: 'TEST001', email: 'test001@test.com', fails: [] },
        { name: 'فاطمة علي - ناجحة', id: 'TEST002', email: 'test002@test.com', fails: [] },
        { name: 'علي حسن - محمل 1', id: 'TEST003', email: 'test003@test.com', fails: [0] },
        { name: 'سارة خالد - محملة 2', id: 'TEST004', email: 'test004@test.com', fails: [0, 1] },
        { name: 'محمد أحمد - معيد', id: 'TEST005', email: 'test005@test.com', fails: [0, 1, 2] },
        { name: 'نور فاضل - معيدة', id: 'TEST006', email: 'test006@test.com', fails: [0, 2, 3] },
    ];

    for (const s of students) {
        let student = await prisma.student.findUnique({ where: { student_id: s.id } });

        if (!student) {
            student = await prisma.student.create({
                data: {
                    name: s.name,
                    student_id: s.id,
                    email: s.email,
                    password: '$2a$10$dummy',
                    department_id: dept.id,
                    stage_id: stage3.id,
                    academic_year: year,
                    is_verified: true,
                }
            });
            console.log(`✅ Created: ${s.name}`);
        }

        const hasEnr = await prisma.enrollment.findFirst({
            where: { student_id: student.id, academic_year: year }
        });

        if (hasEnr) continue;

        for (let i = 0; i < mats.length; i++) {
            await prisma.enrollment.create({
                data: {
                    student_id: student.id,
                    material_id: mats[i].id,
                    academic_year: year,
                    result_status: s.fails.includes(i) ? 'FAILED' : 'PASSED',
                    is_carried: false,
                }
            });
        }
        console.log(`   📚 ${mats.length} enrollments (${s.fails.length} failed)`);
    }

    console.log('\n🎉 Done! Go to /promotion and select:');
    console.log(`   Department: ${dept.name}`);
    console.log(`   Stage: ${stage3.name}`);
    console.log(`   Year: ${year}\n`);
}

seed().catch(e => console.error('❌', e.message)).finally(() => prisma.$disconnect());
