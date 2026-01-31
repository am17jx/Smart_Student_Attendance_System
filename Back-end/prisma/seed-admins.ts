import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting admin seed...');

    const departments = await prisma.department.findMany();
    const passwordHash = await bcrypt.hash('admin123', 10);

    // 1. Create Dean - has access to ALL departments (department_id = NULL)
    console.log('👨‍💼 Creating Dean...');
    const dean = await prisma.admin.upsert({
        where: { email: 'dean@university.edu' },
        update: {},
        create: {
            name: 'عميد الكلية',
            email: 'dean@university.edu',
            password: passwordHash,
            department_id: null // NULL = Full Access
        }
    });
    console.log(`✅ Dean created: ${dean.email} (Full Access to all departments)`);

    // 2. Create Department Heads - one for each department
    console.log('\n👔 Creating Department Heads...');
    for (const dept of departments) {
        const deptHeadName = `رئيس قسم ${dept.name}`;
        const deptHeadEmail = `head.${dept.id}@university.edu`;

        const deptHead = await prisma.admin.upsert({
            where: { email: deptHeadEmail },
            update: {},
            create: {
                name: deptHeadName,
                email: deptHeadEmail,
                password: passwordHash,
                department_id: dept.id // Specific department
            }
        });
        console.log(`✅ Department Head created: ${deptHead.email} (${dept.name} only)`);
    }

    console.log('\n✅ Admin seeding completed!');
    console.log('   Default Password: admin123');
    console.log('\n📋 Summary:');
    console.log(`   1 Dean - Full Access`);
    console.log(`   ${departments.length} Department Heads - Department-specific Access`);
}

main()
    .catch((e) => {
        console.error('❌ Error during seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
