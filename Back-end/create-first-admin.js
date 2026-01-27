const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        console.log('🔍 Checking for existing admin...');

        // Check if admin exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { email: 'admin@test.com' }
        });

        if (existingAdmin) {
            console.log('✅ Admin already exists!');
            console.log('📧 Email: admin@test.com');
            console.log('🔑 Password: Admin123!');
            console.log('\n⚠️  Try logging in with these credentials');
            return;
        }

        console.log('👨‍💼 Creating admin...');
        const hashedPassword = await bcrypt.hash('Admin123!', 10);

        const admin = await prisma.admin.create({
            data: {
                name: 'System Administrator',
                email: 'admin@test.com',
                password: hashedPassword,
            },
        });

        console.log('\n✅ Admin created successfully!');
        console.log('─────────────────────────────────────');
        console.log('📧 Email: admin@test.com');
        console.log('🔑 Password: Admin123!');
        console.log('─────────────────────────────────────');
        console.log('\n⚠️  Please change this password after first login!');
        console.log('\n🚀 You can now login in Postman:');
        console.log('   POST http://localhost:3000/api/v1/auth/login');
        console.log('   Body: { "email": "admin@test.com", "password": "Admin123!" }');
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'P2002') {
            console.error('Email already exists in database');
        }
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
