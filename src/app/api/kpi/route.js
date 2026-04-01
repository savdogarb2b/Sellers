import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = session.user.organizationId;
  const userId = session.user.id;
  const role = session.user.role;

  const where = role === 'EMPLOYEE' ? { userId } : { user: { organizationId: orgId } };
  const now = new Date();

  const kpis = await prisma.kPI.findMany({
    where: { ...where, month: now.getMonth() + 1, year: now.getFullYear() },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(kpis);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId, name, targetValue, month, year } = await request.json();
  const kpi = await prisma.kPI.create({
    data: {
      userId, name, targetValue: parseFloat(targetValue),
      month: parseInt(month) || new Date().getMonth() + 1,
      year: parseInt(year) || new Date().getFullYear(),
    },
  });
  return NextResponse.json(kpi);
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, currentValue } = await request.json();
  const kpi = await prisma.kPI.update({
    where: { id },
    data: { currentValue: parseFloat(currentValue) },
  });
  return NextResponse.json(kpi);
}
