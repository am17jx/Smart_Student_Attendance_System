import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed for promotion system...');

    // 1. Get or create department
    let department = await prisma.department.findFirst({ where: { name: 'علوم الحاسوب' } });
    if (!department) {
        department = await prisma.department.create({
            data: { name: 'علوم الحاسوب' }
        });
    }
    console.log('✅ Department:', department.name);

    // 2. Get or create stages
    const stageData = [
        { name: 'المرحلة الأولى', level: 1 },
        { name: 'المرحلة الثانية', level: 2 },
        { name: 'المرحلة الثالثة', level: 3 },
        { name: 'المرحلة الرابعة', level: 4 },
    ];

    const stages = [];
    for (const data of stageData) {
        let stage = await prisma.stage.findFirst({ where: { name: data.name } });
        if (!stage) {
            stage = await prisma.stage.create({ data });
        }
        stages.push(stage);
    }
    console.log('✅ Stages created');

    // 3. Create materials for Stage 3
    const stage3 = stages[2]; // المرحلة الثالثة
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
            where: { name, stage_id: stage3.id, department_id: department.id }
        });

        if (!material) {
            material = await prisma.material.create({
                data: {
                    name,
                    stage_id: stage3.id,
                    department_id: department.id,
                    is_core_subject: true,
                }
            });
        }
        materials.push(material);
    }
    console.log('✅ Materials created:', materials.length);

    // 4. Create test students in Stage 3
    const studentData = [
        { name: 'أحمد محمد', student_id: 'CS2021001', email: 'ahmed@test.com', scenario: 'full_pass' },
        { name: 'فاطمة علي', student_id: 'CS2021002', email: 'fatima@test.com', scenario: 'full_pass' },
        { name: 'علي حسن', student_id: 'CS2021003', email: 'ali@test.com', scenario: 'carry_1' },
        { name: 'سارة خالد', student_id: 'CS2021004', email: 'sara@test.com', scenario: 'carry_2' },
        { name: 'محمد أحمد', student_id: 'CS2021005', email: 'mohammed@test.com', scenario: 'repeat' },
        { name: 'نور فاضل', student_id: 'CS2021006', email: 'noor@test.com', scenario: 'repeat' },
    ];

    const students = [];
    for (const data of studentData) {
        let student = await prisma.student.findFirst({ where: { student_id: data.student_id } });

        if (!student) {
            student = await prisma.student.create({
                data: {
                    name: data.name,
                    student_id: data.student_id,
                    email: data.email,
                    password: await bcrypt.hash('student123', 10), // generated hashed dummy password
                    department_id: department.id,
                    stage_id: stage3.id,
                    academic_status: 'REGULAR',
                    academic_year: '2024-2025',
                    is_verified: true,
                }
            });
        }
        students.push({ ...student, scenario: data.scenario });
    }
    console.log('✅ Students created:', students.length);

    // 5. Create enrollments with different scenarios
    const academicYear = '2024-2025';

    for (const student of students) {
        // Check if enrollments already exist
        const existingEnrollments = await prisma.enrollment.findMany({
            where: {
                student_id: student.id,
                academic_year: academicYear,
            }
        });

        if (existingEnrollments.length > 0) {
            console.log(`⏭️  Enrollments already exist for ${student.name}`);
            continue;
        }

        // Determine results based on scenario
        let results: string[] = [];

        switch (student.scenario) {
            case 'full_pass':
                // All PASSED
                results = ['PASSED', 'PASSED', 'PASSED', 'PASSED', 'PASSED'];
                break;

            case 'carry_1':
                // 1 FAILED (carry case)
                results = ['PASSED', 'FAILED', 'PASSED', 'PASSED', 'PASSED'];
                break;

            case 'carry_2':
                // 2 FAILED (carry case - max allowed)
                results = ['PASSED', 'FAILED', 'PASSED', 'FAILED', 'PASSED'];
                break;

            case 'repeat':
                // 3+ FAILED (repeat year)
                results = ['FAILED', 'FAILED', 'FAILED', 'PASSED', 'PASSED'];
                break;
        }

        // Create enrollments
        for (let i = 0; i < materials.length; i++) {
            await prisma.enrollment.create({
                data: {
                    student_id: student.id,
                    material_id: materials[i].id,
                    academic_year: academicYear,
                    result_status: results[i] as any,
                    is_carried: false,
                }
            });
        }

        console.log(`✅ Created enrollments for ${student.name} (${student.scenario})`);
    }

    // 6. Create promotion config for department
    let config = await prisma.promotionConfig.findFirst({
        where: { department_id: department.id }
    });

    if (!config) {
        config = await prisma.promotionConfig.create({
            data: {
                department_id: department.id,
                max_carry_subjects: 2,
                fail_threshold_for_repeat: 3,
                disable_carry_for_final_year: false,
                block_carry_for_core: false,
                repeat_mode: 'repeat_failed_only',
            }
        });
        console.log('✅ Promotion config created');
    }

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log('  - Department: علوم الحاسوب');
    console.log('  - Stage: المرحلة الثالثة');
    console.log('  - Materials: 5');
    console.log('  - Students: 6');
    console.log('    • 2 students will be PROMOTED (0 failed)');
    console.log('    • 2 students will be PROMOTED_WITH_CARRY (1-2 failed)');
    console.log('    • 2 students will REPEAT_YEAR (3+ failed)');
    console.log('\n💡 To test:');
    console.log('  1. Go to /promotion');
    console.log('  2. Select: علوم الحاسوب, المرحلة الثالثة, 2024-2025');
    console.log('  3. Click "معاينة النتائج"\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
