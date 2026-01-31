import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdmin() {
    console.log('🔧 Updating admin account to correct department...');

    // Update admin with ID 266 to be Department Head of "هندسة شبكات الحاسوب" (ID: 730)
    const updatedAdmin = await prisma.admin.update({
        where: { id: 266n },
        data: {
            department_id: 730n  // هندسة شبكات الحاسوب
        }
    });

    const dept = await prisma.department.findUnique({
        where: { id: 730n }
    });

    console.log(`\n✅ Updated admin: ${updatedAdmin.email}`);
    console.log(`   - Name: ${updatedAdmin.name}`);
    console.log(`   - Department: ${dept?.name}`);
    console.log(`   - Department ID: ${updatedAdmin.department_id}`);
    console.log(`\n🔄 Please LOGOUT and LOGIN again to see the changes!`);
}

updateAdmin()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
