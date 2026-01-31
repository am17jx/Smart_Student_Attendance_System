
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Diagnosing Teacher Data (Attempt 2)...');

    // 1. Find the teacher
    const teacher = await prisma.teacher.findFirst({
        where: { name: { contains: 'Amr' } },
        include: {
            teacher_materials: {
                include: {
                    material: true
                }
            }
        }
    });

    if (!teacher) {
        console.log('❌ Teacher "Dr. Amr Adel" not found.');
        return;
    }

    console.log(`✅ Found Teacher: ${teacher.name} (ID: ${teacher.id})`);
    console.log(`📚 Assigned Materials Count: ${teacher.teacher_materials.length}`);

    if (teacher.teacher_materials.length === 0) {
        console.log('⚠️ No materials assigned. Attempts to assign...');
        // Find logic here if we wanted to auto-assign, but user said it IS assigned.
        // Let's just list materials available to confirm.
        const materials = await prisma.material.findMany({ take: 5 });
        console.log('Available materials in DB:', materials.map(m => `${m.name} (${m.id})`));
    } else {
        console.log('📋 Assigned Materials Details:');
        for (const tm of teacher.teacher_materials) {
            console.log(`   - Material: ${tm.material.name} (ID: ${tm.material.id})`);
            console.log(`     Details: DeptID=${tm.material.department_id}, StageID=${tm.material.stage_id}`);

            // Check for students in this specific scope
            const studentCount = await prisma.student.count({
                where: {
                    department_id: tm.material.department_id,
                    stage_id: tm.material.stage_id
                }
            });
            console.log(`     👥 Students found in this Dept/Stage: ${studentCount}`);
        }
    }

    const uniqueDepts = new Set(teacher.teacher_materials.map(tm => tm.material.department_id));
    const uniqueStages = new Set(teacher.teacher_materials.map(tm => tm.material.stage_id));

    console.log(`\n🔎 Query Logic Check:`);
    console.log(`   Unique Depts: ${Array.from(uniqueDepts).join(', ')}`);
    console.log(`   Unique Stages: ${Array.from(uniqueStages).join(', ')}`);

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
