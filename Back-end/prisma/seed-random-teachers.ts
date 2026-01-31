
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

const FIRST_NAMES = [
    'Dr. Ahmed', 'Dr. Mohamed', 'Dr. Ali', 'Dr. Omar', 'Dr. Hassan', 'Dr. Ibrahim', 'Dr. Youssef', 'Dr. Khalid', 'Dr. Amr', 'Dr. Tarek',
    'Dr. Sara', 'Dr. Fatima', 'Dr. Nour', 'Dr. Mona', 'Dr. Hoda', 'Dr. Laila', 'Dr. Salma', 'Dr. Dina', 'Dr. Rania', 'Dr. Mariam'
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
    // Remove "Dr. " for email to look natural
    const cleanName = name.replace('Dr. ', '');
    const sanitized = cleanName.toLowerCase().replace(/\s+/g, '.');
    const randomSuffix = crypto.randomBytes(2).toString('hex');
    return `${sanitized}.${randomSuffix}@gmail.com`;
}

async function main() {
    console.log('🌱 Starting random teacher seed...');

    const departments = await prisma.department.findMany();

    if (departments.length === 0) {
        console.error('❌ No departments found. Please seed basic data first.');
        return;
    }

    console.log(`Found ${departments.length} departments.`);

    const passwordHash = await bcrypt.hash('teacher123', 10);
    let totalCreated = 0;

    for (const dept of departments) {
        // Check if teacher already exists for this department to avoid too many if re-run (optional, but good practice)
        // Actually user said "add for each department", so I'll just add one regardless of existing ones.

        const name = generateRandomName();
        const email = generateRandomGmail(name);

        try {
            console.log(`Processing Department: ${dept.name} -> Creating Teacher: ${name}`);

            await prisma.teacher.create({
                data: {
                    name: name,
                    email: email,
                    password: passwordHash,
                    department_id: dept.id
                }
            });
            totalCreated++;
        } catch (error) {
            console.error(`Failed to create teacher ${name}:`, error);
        }
    }

    console.log(`\n✅ Successfully created ${totalCreated} random teachers.`);
    console.log(`   Default Password: teacher123`);
}

main()
    .catch((e) => {
        console.error('❌ Error during seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
