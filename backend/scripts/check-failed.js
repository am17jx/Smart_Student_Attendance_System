const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFailedAttempts() {
  const attempts = await prisma.failedAttempt.findMany({
    orderBy: { attempted_at: 'desc' },
    take: 10,
    include: {
      student: { select: { name: true } },
      session: { select: { material: { select: { name: true } } } }
    }
  });

  console.log("Recent Failed Attempts:");
  for (const a of attempts) {
    console.log(`- ${a.attempted_at.toISOString()}: ${a.error_type} - ${a.error_message} (Student ID: ${a.student_id ? a.student_id.toString() : 'None'}, Session: ${a.session_id ? a.session_id.toString() : 'None'})`);
  }
}

checkFailedAttempts()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
