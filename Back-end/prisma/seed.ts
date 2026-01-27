import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Clean existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Cleaning existing data...');
    await prisma.failedAttempt.deleteMany();
    await prisma.attendanceRecord.deleteMany();
    await prisma.qRToken.deleteMany();
    await prisma.session.deleteMany();
    await prisma.student.deleteMany();
    await prisma.teacher.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.material.deleteMany();
    await prisma.geofence.deleteMany();
    await prisma.stage.deleteMany();
    await prisma.department.deleteMany();

    // 1. Create Departments
    console.log('📚 Creating departments...');
    const csDept = await prisma.department.create({
        data: { name: 'Computer Science' }
    });

    const mathDept = await prisma.department.create({
        data: { name: 'Mathematics' }
    });

    // 2. Create Stages
    console.log('🎓 Creating stages...');
    const stage1 = await prisma.stage.create({
        data: { name: 'First Year', level: 1 }
    });

    const stage2 = await prisma.stage.create({
        data: { name: 'Second Year', level: 2 }
    });

    // 3. Create Admin
    console.log('👨‍💼 Creating admin...');
    const admin = await prisma.admin.create({
        data: {
            name: 'Admin User',
            email: 'admin@university.edu',
            password: await bcrypt.hash('admin123', 10)
        }
    });
    console.log(`✅ Admin created: ${admin.email} / admin123`);

    // 4. Create Teachers
    console.log('👨‍🏫 Creating teachers...');
    const teacher1 = await prisma.teacher.create({
        data: {
            name: 'Dr. Ahmed Ali',
            email: 'ahmed.ali@university.edu',
            password: await bcrypt.hash('teacher123', 10),
            department_id: csDept.id
        }
    });
    console.log(`✅ Teacher created: ${teacher1.email} / teacher123`);

    const teacher2 = await prisma.teacher.create({
        data: {
            name: 'Dr. Sara Mohammed',
            email: 'sara.mohammed@university.edu',
            password: await bcrypt.hash('teacher123', 10),
            department_id: mathDept.id
        }
    });
    console.log(`✅ Teacher created: ${teacher2.email} / teacher123`);

    // 5. Create Students
    console.log('👨‍🎓 Creating students...');
    const student1 = await prisma.student.create({
        data: {
            student_id: 'CS2024001',
            name: 'Ali Hassan',
            email: 'ali.hassan@student.edu',
            password: await bcrypt.hash('student123', 10),
            must_change_password: false,
            is_verified: true,
            department_id: csDept.id,
            stage_id: stage1.id
        }
    });
    console.log(`✅ Student created: ${student1.email} / student123`);

    const student2 = await prisma.student.create({
        data: {
            student_id: 'CS2024002',
            name: 'Fatima Karim',
            email: 'fatima.karim@student.edu',
            password: await bcrypt.hash('student123', 10),
            must_change_password: false,
            is_verified: true,
            department_id: csDept.id,
            stage_id: stage1.id
        }
    });
    console.log(`✅ Student created: ${student2.email} / student123`);

    const student3 = await prisma.student.create({
        data: {
            student_id: 'MATH2024001',
            name: 'Omar Saleh',
            email: 'omar.saleh@student.edu',
            password: await bcrypt.hash('temppass', 10),
            must_change_password: true, // This student needs to change password
            is_verified: false,
            department_id: mathDept.id,
            stage_id: stage2.id
        }
    });
    console.log(`✅ Student created (temp password): ${student3.email} / temppass`);

    // 6. Create Geofence (University boundaries)
    console.log('🗺️ Creating geofence...');
    const geofence = await prisma.geofence.create({
        data: {
            name: 'University Campus',
            latitude: 33.3152, // Baghdad coordinates (example)
            longitude: 44.3661,
            radius_meters: 500 // 500 meters radius
        }
    });
    console.log(`✅ Geofence created: ${geofence.name} (${geofence.radius_meters}m radius)`);

    // 7. Create Materials
    console.log('📖 Creating materials...');
    const material1 = await prisma.material.create({
        data: {
            name: 'Data Structures',
            department_id: csDept.id,
            stage_id: stage1.id
        }
    });

    const material2 = await prisma.material.create({
        data: {
            name: 'Algorithms',
            department_id: csDept.id,
            stage_id: stage2.id
        }
    });

    const material3 = await prisma.material.create({
        data: {
            name: 'Calculus I',
            department_id: mathDept.id,
            stage_id: stage1.id
        }
    });
    console.log(`✅ Materials created: ${material1.name}, ${material2.name}, ${material3.name}`);

    // 8. Create a Sample Session
    console.log('📅 Creating sample session...');
    const session = await prisma.session.create({
        data: {
            session_date: new Date(),
            qr_secret: 'sample-secret-key',
            is_active: true,
            expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
            teacher_id: teacher1.id,
            material_id: material1.id,
            geofence_id: geofence.id
        }
    });
    console.log(`✅ Session created for ${material1.name}`);

    console.log('\n✅ Seed completed successfully!\n');
    console.log('📋 Summary:');
    console.log('─────────────────────────────────────────');
    console.log('👨‍💼 Admin:');
    console.log(`   Email: admin@university.edu`);
    console.log(`   Password: admin123`);
    console.log('\n👨‍🏫 Teachers:');
    console.log(`   Email: ahmed.ali@university.edu`);
    console.log(`   Password: teacher123`);
    console.log(`   Email: sara.mohammed@university.edu`);
    console.log(`   Password: teacher123`);
    console.log('\n👨‍🎓 Students:');
    console.log(`   Email: ali.hassan@student.edu`);
    console.log(`   Password: student123`);
    console.log(`   Email: fatima.karim@student.edu`);
    console.log(`   Password: student123`);
    console.log(`   Email: omar.saleh@student.edu`);
    console.log(`   Password: temppass (must change)`);
    console.log('─────────────────────────────────────────\n');
}

main()
    .catch((e) => {
        console.error('❌ Error during seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
