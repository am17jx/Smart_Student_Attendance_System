
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

const FIRST_NAMES = [
    'Ahmed', 'Mohamed', 'Ali', 'Omar', 'Hassan', 'Ibrahim', 'Youssef', 'Khalid', 'Amr', 'Tarek',
    'Sara', 'Fatima', 'Nour', 'Mona', 'Hoda', 'Laila', 'Salma', 'Dina', 'Rania', 'Mariam'
];

const LAST_NAMES = [
    'Ali', 'Hassan', 'Mohamed', 'Ibrahim', 'Saleh', 'Ezzat', 'Kamel', 'Fawzy', 'Nabil', 'Samir',
    'Adel', 'Mahmoud', 'Saeed', 'Mostafa', 'Osman', 'Zaki', 'Farid', 'Yasser', 'Salem', 'Hady'
];

function getRandomElement(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomName() {
    return `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`;
}

function generateRandomGmail(name: string) {
    const sanitized = name.toLowerCase().replace(/\s+/g, '.');
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    return `${sanitized}.${randomSuffix}@gmail.com`;
}

function generateStudentId() {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 1000 - 9999
    return `STU${new Date().getFullYear()}${randomNum}${crypto.randomBytes(2).toString('hex')}`;
}

async function main() {
    console.log('🌱 Starting random student seed...');

    const departments = await prisma.department.findMany();
    const stages = await prisma.stage.findMany();

    if (departments.length === 0 || stages.length === 0) {
        console.error('❌ No departments or stages found. Please seed basic data first.');
        return;
    }

    console.log(`Found ${departments.length} departments and ${stages.length} stages.`);

    const passwordHash = await bcrypt.hash('student123', 10);
    const STUDENTS_PER_GROUP = 5;
    let totalCreated = 0;

    for (const dept of departments) {
        for (const stage of stages) {
            console.log(`Processing Department: ${dept.name} | Stage: ${stage.name}`);

            for (let i = 0; i < STUDENTS_PER_GROUP; i++) {
                const name = generateRandomName();
                const email = generateRandomGmail(name);
                const studentId = generateStudentId();

                try {
                    await prisma.student.create({
                        data: {
                            student_id: studentId,
                            name: name,
                            email: email,
                            password: passwordHash,
                            must_change_password: false,
                            is_verified: true,
                            department_id: dept.id,
                            stage_id: stage.id,
                            // Ensure valid academic year if required by new schema
                            academic_year: "2024-2025"
                        }
                    });
                    totalCreated++;
                } catch (error) {
                    console.error(`Failed to create student ${name}:`, error);
                }
            }
        }
    }

    console.log(`\n✅ Successfully created ${totalCreated} random students.`);
    console.log(`   Default Password: student123`);
}

main()
    .catch((e) => {
        console.error('❌ Error during seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
