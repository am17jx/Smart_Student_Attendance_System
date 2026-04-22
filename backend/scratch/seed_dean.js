const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Override database URL for local execution
process.env.DATABASE_URL = "postgresql://postgres:ameer@localhost:5432/attendance_system";

const prisma = new PrismaClient();

async function main() {
  const email = 'dean@university.edu';
  const name = 'عميد الكلية';
  const password = 'dean123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    // If exists, update password to match user request
    await prisma.admin.update({
        where: { email },
        data: { password: hashedPassword, name }
    });
    console.log('✅ Admin updated successfully:', email);
  } else {
    const dean = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        department_id: null
      }
    });
    console.log('✅ Dean account created successfully:');
  }

  console.log('Email:', email);
  console.log('Password:', password);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
