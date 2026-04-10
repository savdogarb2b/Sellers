import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const monthString = searchParams.get('month');
  const yearString = searchParams.get('year');
  
  let where = {};
  if (monthString) where.month = parseInt(monthString);
  if (yearString) where.year = parseInt(yearString);
  
  if (session.user.role === 'ADMIN') {
    where.user = { organizationId: session.user.organizationId };
  } else {
    // Employee only gets their own
    where.userId = session.user.id;
  }

  const plans = await prisma.employeeMonthlyPlan.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } } }
  });

  return NextResponse.json(plans);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId, month, year, targetSales, targetRevenue } = await request.json();

  if (!userId || !month || !year) {
    return NextResponse.json({ error: 'userId, month va year kerak' }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
  if (!targetUser || targetUser.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: 'Xodim topilmadi yoki boshqa tashkilotga tegishli' }, { status: 403 });
  }

  const plan = await prisma.employeeMonthlyPlan.upsert({
    where: {
      userId_month_year: {
        userId,
        month: parseInt(month),
        year: parseInt(year)
      }
    },
    update: {
      targetSales: parseInt(targetSales) || 0,
      targetRevenue: parseFloat(targetRevenue) || 0
    },
    create: {
      userId,
      month: parseInt(month),
      year: parseInt(year),
      targetSales: parseInt(targetSales) || 0,
      targetRevenue: parseFloat(targetRevenue) || 0
    }
  });

  return NextResponse.json(plan);
}
