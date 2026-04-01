import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized or no organization' }, { status: 401 });
  }

  const strategies = await prisma.salesStrategy.findMany({
    where: { organizationId: session.user.organizationId },
    include: { months: { orderBy: { month: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(strategies);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN' || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized or no organization' }, { status: 401 });
  }

  const { targetSales, targetConversion, startDate, endDate } = await request.json();
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = [];
  let totalMonths = 0;
  
  const d = new Date(start);
  while (d <= end) {
    totalMonths++;
    d.setMonth(d.getMonth() + 1);
  }

  const monthlySales = Math.ceil(targetSales / totalMonths);
  const monthlyLeads = Math.ceil(monthlySales / (targetConversion / 100));
  
  const d2 = new Date(start);
  while (d2 <= end) {
    months.push({
      month: d2.getMonth() + 1,
      year: d2.getFullYear(),
      targetSales: monthlySales,
      requiredLeads: monthlyLeads,
    });
    d2.setMonth(d2.getMonth() + 1);
  }

  const strategy = await prisma.salesStrategy.create({
    data: {
      organizationId: session.user.organizationId,
      targetSales: parseInt(targetSales),
      targetConversion: parseFloat(targetConversion),
      startDate: start,
      endDate: end,
      months: { create: months },
    },
    include: { months: true },
  });

  // Avtomatik taqsimlash
  const employees = await prisma.user.findMany({
    where: { organizationId: session.user.organizationId, role: 'EMPLOYEE' },
    select: { id: true }
  });

  if (employees.length > 0) {
    const upsertPromises = [];
    months.forEach(m => {
      const share = Math.round(m.targetSales / employees.length);
      employees.forEach(emp => {
        upsertPromises.push(
          prisma.employeeMonthlyPlan.upsert({
            where: {
              userId_month_year: { userId: emp.id, month: m.month, year: m.year },
            },
            update: { targetSales: share },
            create: { userId: emp.id, month: m.month, year: m.year, targetSales: share },
          })
        );
      });
    });
    
    await Promise.all(upsertPromises);
  }

  return NextResponse.json(strategy);
}
