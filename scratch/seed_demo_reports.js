const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = 'cmnvisbt50001gtksn67g2q0w';
  const stageId = 'cmnvn94aq0001gtrx3dblzlts';
  const sourceIds = ['cmnvnnhuk0001gtufrq5teo3e', 'cmnvxxjun0001yc2quoj0g74l'];
  
  console.log('🚀 Demo hisobotlar yaratilmoqda...');
  
  // Clear existing reports for this user to avoid duplication during demo setup
  await prisma.dailyReport.deleteMany({ where: { userId } });

  const reports = [];
  // Generate for the last 14 days (April 1 to April 14, 2026)
  for (let i = 1; i <= 14; i++) {
    const date = new Date(2026, 3, i); // April is index 3
    
    // Skip Sundays
    if (date.getDay() === 0) continue;
    
    const incoming = Math.floor(Math.random() * 20) + 5;
    const outgoing = Math.floor(Math.random() * 50) + 10;
    const quality = Math.floor((incoming + outgoing) * 0.4);
    const nonQuality = Math.floor((incoming + outgoing) * 0.2);
    const visits = Math.floor(quality * 0.3);
    const sales = Math.floor(visits * 0.5);
    const revenue = sales * 1200000;

    reports.push(prisma.dailyReport.create({
      data: {
        userId,
        date,
        incomingCalls: incoming,
        outgoingCalls: outgoing,
        totalCalls: incoming + outgoing,
        qualityLeads: quality,
        nonQualityLeads: nonQuality,
        officeVisits: visits,
        sales,
        revenue,
        leadStatuses: {
          create: [{ stageId, count: quality }]
        },
        sourceStatuses: {
          create: sourceIds.map(sid => ({ sourceId: sid, count: Math.floor(quality / 2) }))
        }
      }
    }));
  }

  await Promise.all(reports);
  console.log('✅ 14 kunlik demo hisobotlar muvaffaqiyatli qoshildi!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
