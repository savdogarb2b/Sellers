const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const stages = await prisma.funnelStage.findMany();
  const sources = await prisma.leadSource.findMany();
  const employees = await prisma.user.findMany({ where: { role: 'EMPLOYEE' } });
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  
  console.log('STAGES:', JSON.stringify(stages, null, 2));
  console.log('SOURCES:', JSON.stringify(sources, null, 2));
  console.log('EMPLOYEES:', JSON.stringify(employees, null, 2));
  console.log('ADMINS:', JSON.stringify(admins, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
