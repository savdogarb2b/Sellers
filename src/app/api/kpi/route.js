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
  if (!userId || !name || targetValue === undefined) {
    return NextResponse.json({ error: 'userId, name va targetValue kerak' }, { status: 400 });
  }

  const parsedTarget = parseFloat(targetValue);
  if (isNaN(parsedTarget) || parsedTarget < 0) {
    return NextResponse.json({ error: 'targetValue musbat son bo\'lishi kerak' }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
  if (!targetUser || targetUser.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: 'Xodim topilmadi yoki boshqa tashkilotga tegishli' }, { status: 403 });
  }

  const kpi = await prisma.kPI.create({
    data: {
      userId, name: name.trim(), targetValue: parsedTarget,
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
  if (!id) return NextResponse.json({ error: 'KPI ID kerak' }, { status: 400 });

  const parsedValue = parseFloat(currentValue);
  if (isNaN(parsedValue) || parsedValue < 0) {
    return NextResponse.json({ error: 'Qiymat musbat son bo\'lishi kerak' }, { status: 400 });
  }

  const kpi = await prisma.kPI.findUnique({ where: { id }, include: { user: true } });
  if (!kpi) return NextResponse.json({ error: 'KPI topilmadi' }, { status: 404 });

  if (session.user.role === 'EMPLOYEE' && kpi.userId !== session.user.id) {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }
  if (session.user.role === 'ADMIN' && kpi.user.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  const updated = await prisma.kPI.update({
    where: { id },
    data: { currentValue: parsedValue },
  });
  return NextResponse.json(updated);
}
