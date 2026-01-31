const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed for promotion system...');

    // 1. Create or get department
    let department = await prisma.department.findFirst({
        where: { name: 'علوم الحاسوب' }
    });

    if (!department) {
        department = await prisma.department.create({
            data: { name: 'علوم الحاسوب' }
        });
        console.log('✅ Created Department:', department.name);
    } else {
        console.log('✅ Found Department:', department.name);
    }

    // 2. Create or get stages
    const stages = [];
    for (let i = 1; i <= 4; i++) {
        let stage = await prisma.stage.findFirst({
            where: { name: `المرحلة ${i === 1 ? 'الأولى' : i === 2 ? 'الثانية' : i === 3 ? 'الثالثة' : 'الرابعة'}` }
        });

        if (!stage) {
            const names = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة'];
            stage = await prisma.stage.create({
                data: { name: `المرحلة ${names[i - 1]}`, level: i }
            });
            console.log(`✅ Created Stage: المرحلة ${names[i - 1]}`);
        }
        stages.push(stage);
    }

    const stage3 = stages[2]; // المرحلة الثالثة
    console.log('✅ Using Stage:', stage3.name);

    // 3. Create materials for Stage 3
    const materialNames = [
        'قواعد البيانات',
        'البرمجة الشيئية',
        'هندسة البرمجيات',
        'الشبكات',
        'نظم التشغيل',
    ];

    const materials = [];
    for (const name of materialNames) {
        let material = await prisma.material.findFirst({
            where: {
                name,
                stage_id: stage3.id,
                department_id: department.id
            }
        });

        if (!material) {
            material = await prisma.material.create({
                data: {
                    name,
                    stage_id: stage3.id,
                    department_id: department.id,
                }
            });
            console.log(`✅ Created Material: ${name}`);
        }
        materials.push(material);
    }

    // 4. Create test students
    const studentData = [
        { name: 'أحمد محمد - ناجح', student_id: 'TEST001', email: 'test001@test.com', scenario: 'pass' },
        { name: 'فاطمة علي - ناجحة', student_id: 'TEST002', email: 'test002@test.com', scenario: 'pass' },
        { name: 'علي حسن - محمل 1', student_id: 'TEST003', email: 'test003@test.com', scenario: 'carry1' },
        { name: 'سارة خالد - محملة 2', student_id: 'TEST004', email: 'test004@test.com', scenario: 'carry2' },
        { name: 'محمد أحمد - معيد', student_id: 'TEST005', email: 'test005@test.com', scenario: 'repeat' },
        { name: 'نور فاضل - معيدة', student_id: 'TEST006', email: 'test006@test.com', scenario: 'repeat' },
    ];

    const students = [];
    const academicYear = '2024-2025';

    for (const data of studentData) {
        // Check if student exists
        let student = await prisma.student.findFirst({
            where: { student_id: data.student_id }
        });

        if (student) {
            console.log(`⏭️  Student ${data.name} already exists`);
            students.push({ ...student, scenario: data.scenario });
            continue;
        }

        // Create student
        student = await prisma.student.create({
            data: {
                name: data.name,
                student_id: data.student_id,
                email: data.email,
                password: '$2a$10$abcdefghijklmnopqrstuv',
                department_id: department.id,
                stage_id: stage3.id,
                academic_status: 'REGULAR',
                academic_year: academicYear,
                is_verified: true,
            }
        });

        students.push({ ...student, scenario: data.scenario });
        console.log(`✅ Created student: ${data.name}`);
    }

    // 5. Create enrollments
    for (const student of students) {
        // Check existing
        const existing = await prisma.enrollment.findFirst({
            where: {
                student_id: student.id,
                academic_year: academicYear,
            }
        });

        if (existing) {
            console.log(`⏭️  Enrollments exist for ${student.name}`);
            continue;
        }

        // Define results based on scenario
        let failedIndexes = [];

        switch (student.scenario) {
            case 'pass':
                failedIndexes = []; // 0 failed
                break;
            case 'carry1':
                failedIndexes = [1]; // 1 failed
                break;
            case 'carry2':
                failedIndexes = [0, 2]; // 2 failed
                break;
            case 'repeat':
                failedIndexes = [0, 1, 3]; // 3 failed
                break;
        }

        // Create enrollments for all materials
        for (let i = 0; i < materials.length; i++) {
            const status = failedIndexes.includes(i) ? 'FAILED' : 'PASSED';

            await prisma.enrollment.create({
                data: {
                    student_id: student.id,
                    material_id: materials[i].id,
                    academic_year: academicYear,
                    result_status: status,
                    is_carried: false,
                }
            });
        }

        console.log(`✅ Created ${materials.length} enrollments for ${student.name} (${failedIndexes.length} failed)`);
    }

    console.log('\n🎉 Seed completed!\n');
    console.log('📊 Test Data:');
    console.log('  • 2 students: 0 failed → ترقية');
    console.log('  • 2 students: 1-2 failed → تحميل');
    console.log('  • 2 students: 3 failed → إعادة');
    console.log('\n💡 To test:');
    console.log('  Go to /promotion');
    console.log('  Select: علوم الحاسوب, المرحلة الثالثة, 2024-2025\n');
}

main()
    .catch(e => {
        console.error('❌ Error:', e.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
