const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  const superadmin = await prisma.user.upsert({
    where: { email: 'admin@salescrm.uz' },
    update: {},
    create: { email: 'admin@salescrm.uz', password: hashedPassword, name: 'Super Admin', role: 'SUPERADMIN' },
  });
  console.log('✅ Superadmin:', superadmin.email);

  const org = await prisma.organization.create({
    data: { name: 'Demo Kompaniya', address: 'Toshkent, Chilonzor tumani', phone: '+998901234567' },
  });
  console.log('✅ Tashkilot:', org.name);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.uz' },
    update: {},
    create: { email: 'admin@demo.uz', password: hashedPassword, name: 'Admin Adminov', role: 'ADMIN', organizationId: org.id },
  });
  console.log('✅ Admin:', admin.email);

  const employee = await prisma.user.upsert({
    where: { email: 'xodim@demo.uz' },
    update: {},
    create: {
      email: 'xodim@demo.uz', password: hashedPassword, name: 'Ali Valiyev', role: 'EMPLOYEE',
      organizationId: org.id, fixedSalary: 5000000, workStartTime: '09:00', workEndTime: '18:00',
      latenessPenalty: 50000, locationLat: 41.2995, locationLng: 69.2401, locationRadius: 200,
    },
  });

  const employee2 = await prisma.user.upsert({
    where: { email: 'xodim2@demo.uz' },
    update: {},
    create: {
      email: 'xodim2@demo.uz', password: hashedPassword, name: 'Sardor Karimov', role: 'EMPLOYEE',
      organizationId: org.id, fixedSalary: 4500000, workStartTime: '09:00', workEndTime: '18:00',
      latenessPenalty: 50000, locationLat: 41.2995, locationLng: 69.2401, locationRadius: 200,
    },
  });
  console.log('✅ Xodimlar yaratildi');

  const now = new Date();
  await prisma.kPI.createMany({
    data: [
      { userId: employee.id, name: 'Sotuvlar soni', targetValue: 20, currentValue: 12, month: now.getMonth() + 1, year: now.getFullYear() },
      { userId: employee.id, name: 'Konversiya foizi', targetValue: 30, currentValue: 22, month: now.getMonth() + 1, year: now.getFullYear() },
      { userId: employee2.id, name: 'Sotuvlar soni', targetValue: 20, currentValue: 16, month: now.getMonth() + 1, year: now.getFullYear() },
      { userId: employee2.id, name: 'Konversiya foizi', targetValue: 30, currentValue: 28, month: now.getMonth() + 1, year: now.getFullYear() },
    ],
  });

  await prisma.penalty.createMany({
    data: [
      { organizationId: org.id, reason: 'Ishga kechikish', amount: 50000 },
      { organizationId: org.id, reason: 'Ish vaqtida telefon ishlatish', amount: 30000 },
      { organizationId: org.id, reason: 'Rejani bajara olmaslik', amount: 100000 },
    ],
  });

  await prisma.bonus.createMany({
    data: [
      { organizationId: org.id, reason: 'Rejani oshirib bajarish', amount: 500000 },
      { organizationId: org.id, reason: 'Eng yaxshi menejer', amount: 300000 },
      { organizationId: org.id, reason: 'Yangi mijoz jalb qilish', amount: 200000 },
    ],
  });

  await prisma.funnelStage.createMany({
    data: [
      { organizationId: org.id, name: 'Yangi lid', order: 1 },
      { organizationId: org.id, name: 'Aloqaga chiqildi', order: 2 },
      { organizationId: org.id, name: 'Taklif yuborildi', order: 3 },
      { organizationId: org.id, name: 'Muzokara', order: 4 },
      { organizationId: org.id, name: 'Sotuv amalga oshdi', order: 5 },
      { organizationId: org.id, name: 'Rad etildi', order: 6 },
    ],
  });

  const strategy = await prisma.salesStrategy.create({
    data: {
      organizationId: org.id, targetSales: 120, targetConversion: 25,
      startDate: new Date(now.getFullYear(), 0, 1), endDate: new Date(now.getFullYear(), 11, 31),
    },
  });

  for (let m = 0; m < 12; m++) {
    await prisma.salesStrategyMonth.create({
      data: {
        strategyId: strategy.id, month: m + 1, year: now.getFullYear(),
        targetSales: 10, requiredLeads: 40,
        actualSales: m < now.getMonth() ? Math.floor(Math.random() * 5) + 7 : 0,
      },
    });
  }

  await prisma.penaltyRecord.create({
    data: { userId: employee.id, reason: 'Ishga kechikish', amount: 50000, assignedById: admin.id },
  });
  await prisma.bonusRecord.create({
    data: { userId: employee.id, reason: 'Rejani oshirib bajarish', amount: 500000, assignedById: admin.id },
  });

  for (let d = 1; d <= Math.min(now.getDate(), 20); d++) {
    const date = new Date(now.getFullYear(), now.getMonth(), d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const isLate = Math.random() < 0.15;
    const lateMinutes = isLate ? Math.floor(Math.random() * 30) + 5 : 0;
    await prisma.attendance.create({
      data: {
        userId: employee.id, date,
        checkInTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), isLate ? 9 : 8, isLate ? lateMinutes : 45 + Math.floor(Math.random() * 15)),
        isLate, lateMinutes, penaltyApplied: isLate ? 50000 : 0,
      },
    });
  }

  console.log('🎉 Seed muvaffaqiyatli yakunlandi!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
