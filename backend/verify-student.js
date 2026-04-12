const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAllStudents() {
    try {
        console.log('🔍 Searching for unverified students...');

        const unverifiedStudents = await prisma.student.findMany({
            where: { is_verified: false }
        });

        if (unverifiedStudents.length === 0) {
            console.log('✅ No unverified students found. All students are already verified.');
            return;
        }

        console.log(`Found ${unverifiedStudents.length} unverified students. Verifying...`);

        for (const student of unverifiedStudents) {
            await prisma.student.update({
                where: { id: student.id },
                data: {
                    is_verified: true,
                    email_verified_at: new Date(),
                    email_verification_token: null,
                    email_verification_expires: null
                }
            });
            console.log(`✅ Verified student: ${student.email}`);
        }

        console.log('\n🎉 All students have been verified successfully!');

    } catch (error) {
        console.error('❌ Error verifying students:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAllStudents();
