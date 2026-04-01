const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Bazani tozalash boshlandi...');

  // Delete all data in order (handling foreign key constraints)
  await prisma.chatMessage.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.kPI.deleteMany({});
  await prisma.penaltyRecord.deleteMany({});
  await prisma.bonusRecord.deleteMany({});
  await prisma.dailyReportLeadStatus.deleteMany({});
  await prisma.dailyReport.deleteMany({});
  await prisma.employeeMonthlyPlan.deleteMany({});
  await prisma.salesStrategyMonth.deleteMany({});
  await prisma.salesStrategy.deleteMany({});
  await prisma.funnelStage.deleteMany({});
  await prisma.penalty.deleteMany({});
  await prisma.bonus.deleteMany({});
  
  // Delete users except Superadmin (or just delete all and recreate)
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.systemSettings.deleteMany({});

  console.log('✨ Baza tozalandi.');

  // Create Superadmin
  const hashedPassword = await bcrypt.hash('123456', 10);
  const superadmin = await prisma.user.create({
    data: {
      email: 'admin@salescrm.uz',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPERADMIN'
    }
  });
  console.log('✅ Superadmin yaratildi:', superadmin.email);

  // Set NEW Gemini API Key
  await prisma.systemSettings.create({
    data: {
      key: 'GEMINI_API_KEY',
      value: 'AIzaSyDHuLfJHzVB9Zryc69ciNJvSQ4OM9vz_eU'
    }
  });
  console.log('✅ Yangi Gemini API Key saqlandi.');

  console.log('🎉 Tizim toza holatga keltirildi!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
