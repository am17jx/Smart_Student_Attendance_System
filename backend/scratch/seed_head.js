const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("🚀 Starting seeding for Department Head...");

        // 1. Ensure a department exists or create one
        const deptName = "قسم الحاسوب";
        let department = await prisma.department.findUnique({
            where: { name: deptName }
        });

        if (!department) {
            department = await prisma.department.create({
                data: { name: deptName }
            });
            console.log(`✅ Created new department: ${deptName}`);
        } else {
            console.log(`✅ Found existing department: ${deptName}`);
        }

        // 2. Head Credentials
        const headEmail = 'head@university.edu';
        const headPassword = 'head'; // Change this to your desired password
        const headName = 'رئيس قسم الحاسوب';

        const existingHead = await prisma.admin.findUnique({
            where: { email: headEmail }
        });

        if (existingHead) {
            console.log(`⚠️ Department Head with email ${headEmail} already exists!`);
        } else {
            // Hash password
            const hashedPassword = await bcrypt.hash(headPassword, 10);

            // Create Head
            const newHead = await prisma.admin.create({
                data: {
                    name: headName,
                    email: headEmail,
                    password: hashedPassword,
                    department_id: department.id,
                    role: 'DEPARTMENT_HEAD'
                }
            });

            console.log(`✅ Successfully created Department Head!`);
            console.log(`📧 Email: ${newHead.email}`);
            console.log(`🔑 Password: ${headPassword}`);
            console.log(`🏢 Department: ${deptName}`);
        }

    } catch (error) {
        console.error("❌ Error seeding Department Head:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
