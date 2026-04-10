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

  const { targetSales, targetRevenue, targetConversion, startDate, endDate } = await request.json();

  if (!targetSales || !targetConversion || !startDate || !endDate) {
    return NextResponse.json({ error: 'Barcha maydonlar to\'ldirilishi shart' }, { status: 400 });
  }
  if (parseInt(targetSales) <= 0) return NextResponse.json({ error: 'Maqsad sotuv musbat bo\'lishi kerak' }, { status: 400 });
  if (parseFloat(targetConversion) <= 0 || parseFloat(targetConversion) > 100) {
    return NextResponse.json({ error: 'Konversiya 0 dan 100 gacha bo\'lishi kerak' }, { status: 400 });
  }
  if (new Date(startDate) >= new Date(endDate)) {
    return NextResponse.json({ error: 'Boshlanish sanasi tugash sanasidan oldin bo\'lishi kerak' }, { status: 400 });
  }

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
  const monthlyRevenue = totalMonths > 0 ? Number(((parseFloat(targetRevenue) || 0) / totalMonths).toFixed(2)) : 0;
  const monthlyLeads = Math.ceil(monthlySales / (targetConversion / 100));
  
  const d2 = new Date(start);
  while (d2 <= end) {
    months.push({
      month: d2.getMonth() + 1,
      year: d2.getFullYear(),
      targetSales: monthlySales,
      targetRevenue: monthlyRevenue,
      requiredLeads: monthlyLeads,
    });
    d2.setMonth(d2.getMonth() + 1);
  }

  const strategy = await prisma.salesStrategy.create({
    data: {
      organizationId: session.user.organizationId,
      targetSales: parseInt(targetSales),
      targetRevenue: parseFloat(targetRevenue) || 0,
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
      const revenueShare = Number((m.targetRevenue / employees.length).toFixed(2));
      employees.forEach(emp => {
        upsertPromises.push(
          prisma.employeeMonthlyPlan.upsert({
            where: {
              userId_month_year: { userId: emp.id, month: m.month, year: m.year },
            },
            update: { targetSales: share, targetRevenue: revenueShare },
            create: { userId: emp.id, month: m.month, year: m.year, targetSales: share, targetRevenue: revenueShare },
          })
        );
      });
    });
    
    await Promise.all(upsertPromises);
  }

  return NextResponse.json(strategy);
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN' || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized or no organization' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Strategiya ID kerak' }, { status: 400 });
  }

  const strategy = await prisma.salesStrategy.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { months: true },
  });

  if (!strategy) {
    return NextResponse.json({ error: 'Strategiya topilmadi' }, { status: 404 });
  }

  const monthKeys = strategy.months.map(month => `${month.month}-${month.year}`);

  await prisma.$transaction(async (tx) => {
    const employees = await tx.user.findMany({
      where: { organizationId: session.user.organizationId, role: 'EMPLOYEE' },
      select: { id: true },
    });

    const otherStrategies = await tx.salesStrategy.findMany({
      where: {
        organizationId: session.user.organizationId,
        id: { not: id },
      },
      include: { months: true },
    });

    const sharedMonthKeys = new Set(
      otherStrategies.flatMap(item => item.months.map(month => `${month.month}-${month.year}`))
    );

    const removableMonths = strategy.months.filter(month => !sharedMonthKeys.has(`${month.month}-${month.year}`));

    if (employees.length > 0 && removableMonths.length > 0) {
      await tx.employeeMonthlyPlan.deleteMany({
        where: {
          userId: { in: employees.map(employee => employee.id) },
          OR: removableMonths.map(month => ({ month: month.month, year: month.year })),
        },
      });
    }

    await tx.salesStrategy.delete({ where: { id } });
  });

  return NextResponse.json({ success: true, deletedMonths: monthKeys.length });
}
