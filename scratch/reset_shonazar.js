const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);
  await prisma.user.update({
    where: { email: 'shonazar@salescrm.uz' },
    data: { password: hashedPassword }
  });
  console.log('✅ Shonazar paroli 123456 ga o\'zgartirildi.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
