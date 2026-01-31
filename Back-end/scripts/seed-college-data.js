const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DATA = {
    departments: [
        {
            name: "هندسة المعلومات والاتصالات",
            stages: [
                {
                    level: 1,
                    semesters: {
                        SEMESTER_1: ["Arabic Language", "Human Rights", "Engineering Drawing", "Computer Fundamentals", "Calculus I", "Physics"],
                        SEMESTER_2: ["Biology", "Computer Fundamentals Lab", "Calculus II", "Physics Lab", "Introduction to Programming"]
                    }
                },
                {
                    level: 2,
                    semesters: {
                        SEMESTER_1: ["English Language II", "Probability and Statistics", "Electronics", "Object Oriented Programming", "Data Structures"],
                        SEMESTER_2: ["Electronics Lab", "OOP Lab", "Data Structures Lab", "Database Systems", "Database Systems Lab"]
                    }
                },
                {
                    level: 3,
                    semesters: {
                        SEMESTER_1: ["Communication Systems", "Digital Signal Processing", "Transmission Lines", "Computer Architecture", "Numerical Methods"],
                        SEMESTER_2: ["Communication Systems Lab", "DSP Lab", "Numerical Methods Lab", "Internet Programming", "Information Theory", "Principles of Management"]
                    }
                },
                {
                    level: 4,
                    semesters: {
                        SEMESTER_1: ["Operating Systems", "Wireless Communications", "Cryptography", "Internet of Things", "Professional Ethics"],
                        SEMESTER_2: ["Operating Systems Lab", "Wireless Communications Lab", "Cryptography Lab", "IoT Lab", "Graduation Project"]
                    }
                }
            ]
        },
        {
            name: "هندسة شبكات الحاسوب",
            stages: [
                {
                    level: 1,
                    semesters: {
                        SEMESTER_1: ["Arabic Language", "Human Rights", "Engineering Mathematics I", "Computer Fundamentals", "Programming I", "Physics"],
                        SEMESTER_2: ["Programming I Lab", "Engineering Mathematics II", "Computer Fundamentals Lab", "Physics Lab", "Introduction to Networks"]
                    }
                },
                {
                    level: 2,
                    semesters: {
                        SEMESTER_1: ["Data Structures", "Probability and Statistics", "Computer Networks I", "Operating Systems I", "Database Systems"],
                        SEMESTER_2: ["Data Structures Lab", "Networks Lab I", "Operating Systems Lab I", "Database Lab", "Discrete Mathematics"]
                    }
                },
                {
                    level: 3,
                    semesters: {
                        SEMESTER_1: ["Computer Networks II", "Routing and Switching", "Network Security", "Distributed Systems", "Numerical Methods"],
                        SEMESTER_2: ["Networks Lab II", "Network Security Lab", "Web Programming", "Web Programming Lab", "Wireless Networks"]
                    }
                },
                {
                    level: 4,
                    semesters: {
                        SEMESTER_1: ["Advanced Networking", "Cloud Computing", "Network Management", "Professional Ethics"],
                        SEMESTER_2: ["Cloud Computing Lab", "Network Design", "Graduation Project"]
                    }
                }
            ]
        },
        {
            name: "هندسة الأمن السيبراني",
            stages: [
                {
                    level: 1,
                    semesters: {
                        SEMESTER_1: ["Arabic Language", "Human Rights", "Computer Fundamentals", "Programming I", "Calculus I", "Physics"],
                        SEMESTER_2: ["Programming I Lab", "Information Technology Basics", "Calculus II", "Physics Lab", "Introduction to Cybersecurity"]
                    }
                },
                {
                    level: 2,
                    semesters: {
                        SEMESTER_1: ["Data Structures", "Computer Networks", "Operating Systems", "Probability and Statistics", "Discrete Mathematics"],
                        SEMESTER_2: ["Data Structures Lab", "Networks Lab", "Operating Systems Lab", "Secure Programming", "Cybersecurity Tools"]
                    }
                },
                {
                    level: 3,
                    semesters: {
                        SEMESTER_1: ["Cryptography I", "Cyber Security Fundamentals", "Network Security", "Digital Forensics", "Malware Analysis"],
                        SEMESTER_2: ["Cryptography Lab", "Etical Hacking", "Secure Systems Design", "Security Monitoring"]
                    }
                },
                {
                    level: 4,
                    semesters: {
                        SEMESTER_1: ["Cryptography II", "Penetration Testing", "Incident Response", "Cyber Law and Ethics"],
                        SEMESTER_2: ["Security Management", "Graduation Project"]
                    }
                }
            ]
        },
        {
            name: "هندسة الأتمتة والذكاء الاصطناعي",
            stages: [
                {
                    level: 1,
                    semesters: {
                        SEMESTER_1: ["Arabic Language", "Human Rights", "Programming I", "Calculus I", "Physics", "Engineering Drawing"],
                        SEMESTER_2: ["Programming I Lab", "Computer Fundamentals", "Calculus II", "Physics Lab", "Introduction to Engineering"]
                    }
                },
                {
                    level: 2,
                    semesters: {
                        SEMESTER_1: ["Data Structures", "Linear Algebra", "Probability and Statistics", "Electronics", "Object Oriented Programming"],
                        SEMESTER_2: ["Data Structures Lab", "Electronics Lab", "Control Systems", "Control Systems Lab"]
                    }
                },
                {
                    level: 3,
                    semesters: {
                        SEMESTER_1: ["Artificial Intelligence", "Machine Learning", "Robotics", "Sensors and Actuators", "Numerical Methods"],
                        SEMESTER_2: ["Machine Learning Lab", "Embedded Systems", "IoT Systems", "IoT Lab"]
                    }
                },
                {
                    level: 4,
                    semesters: {
                        SEMESTER_1: ["Deep Learning", "Automation Systems", "Professional Ethics"],
                        SEMESTER_2: ["Graduation Project"]
                    }
                }
            ]
        }
    ]
};

async function main() {
    console.log('🌱 Starting academic data seed...');

    // 1. Clean up existing materials and departments
    console.log('🗑️ Cleaning up existing data...');
    // Delete materials first to avoid constraint issues if any, though cascade should handle it.
    await prisma.material.deleteMany({});

    // We can't easily delete all departments because of students/teachers, 
    // but the user asked to replace data. I'll search for these specific departments and create them if missing,
    // or clear their materials (already done). 
    // Should I delete ALL departments? User said "erase data... and add these".
    // I'll be aggressive but safe: Delete all materials. Delete departments if possible, or just upsert.
    // Let's delete departments to ensure ID consistency and cleanup if possible.
    // First, set department_id to null for students/teachers to allow deletion?
    // Schema says keys are SetNull on delete. So deleting Departments IS safe.

    await prisma.department.deleteMany({});
    await prisma.stage.deleteMany({});

    console.log('✅ Cleaned up old data.');

    // 2. Create Stages (Level 1-4)
    const stages = [];
    const stageNames = ["الأولى", "الثانية", "الثالثة", "الرابعة"];

    for (let i = 1; i <= 4; i++) {
        const stage = await prisma.stage.create({
            data: {
                name: `المرحلة ${stageNames[i - 1]}`,
                level: i
            }
        });
        stages.push(stage);
        console.log(`✅ Created Stage: ${stage.name}`);
    }

    // Map levels to IDs for easy access
    const stageMap = {};
    stages.forEach(s => stageMap[s.level] = s.id);

    // 3. Create Departments and Materials
    for (const deptData of DATA.departments) {
        const department = await prisma.department.create({
            data: { name: deptData.name }
        });
        console.log(`\n🏫 Created Department: ${department.name}`);

        for (const stageData of deptData.stages) {
            const stageId = stageMap[stageData.level];

            // Process Semesters
            for (const [semester, materials] of Object.entries(stageData.semesters)) {
                for (const matName of materials) {
                    await prisma.material.create({
                        data: {
                            name: matName,
                            department_id: department.id,
                            stage_id: stageId,
                            semester: semester // SEMESTER_1 or SEMESTER_2
                        }
                    });
                }
                console.log(`   📚 Added ${materials.length} materials for Level ${stageData.level} - ${semester}`);
            }
        }
    }

    console.log('\n🎉 Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
