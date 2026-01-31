// Quick test to check if students exist in database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testQuery() {
    console.log("Testing student query with departmentId=725, stageId=814");

    const students = await prisma.student.findMany({
        where: {
            department_id: BigInt(725),
            stage_id: BigInt(814)
        },
        include: {
            department: true,
            stage: true
        }
    });

    console.log(`Found ${students.length} students:`);
    students.forEach(s => {
        console.log(`- ID: ${s.id}, Name: ${s.name}, Dept: ${s.department?.name}, Stage: ${s.stage?.name}`);
    });

    console.log("\n--- All students in database ---");
    const allStudents = await prisma.student.findMany({
        include: {
            department: true,
            stage: true
        },
        take: 10
    });

    allStudents.forEach(s => {
        console.log(`- ID: ${s.id}, Name: ${s.name}, DeptID: ${s.department_id}, StageID: ${s.stage_id}`);
    });

    await prisma.$disconnect();
}

testQuery().catch(console.error);
