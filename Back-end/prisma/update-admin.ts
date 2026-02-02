import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import logger from '../utils/logger';

async function updateAdmin() {
    logger.info('Updating admin account to correct department...');

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

    logger.info(`Updated admin: ${updatedAdmin.email}`, {
        name: updatedAdmin.name,
        department: dept?.name,
        departmentId: updatedAdmin.department_id?.toString()
    });
    logger.info('Please LOGOUT and LOGIN again to see the changes!');
}

updateAdmin()
    .catch((e) => {
        logger.error('Error', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
