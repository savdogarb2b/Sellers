import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'EMPLOYEE') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Check if already checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existing = await prisma.attendance.findFirst({
    where: { userId, date: { gte: today, lt: tomorrow } },
  });

  if (existing) return NextResponse.json({ error: 'Bugun allaqachon keldingiz', attendance: existing }, { status: 400 });

  // Check lateness
  const now = new Date();
  let isLate = false;
  let lateMinutes = 0;
  let penaltyApplied = 0;

  if (user.workStartTime) {
    const [h, m] = user.workStartTime.split(':').map(Number);
    const startTime = new Date(now);
    startTime.setHours(h, m, 0, 0);

    if (now > startTime) {
      isLate = true;
      lateMinutes = Math.ceil((now - startTime) / 60000);
      penaltyApplied = user.latenessPenalty || 0;
    }
  }

  const attendance = await prisma.attendance.create({
    data: {
      userId,
      date: today,
      checkInTime: now,
      isLate,
      lateMinutes,
      penaltyApplied,
    },
  });

  // If late, create penalty record automatically
  if (isLate && penaltyApplied > 0) {
    await prisma.penaltyRecord.create({
      data: {
        userId,
        reason: `Ishga ${lateMinutes} daqiqa kechikish`,
        amount: penaltyApplied,
        assignedById: userId,
      },
    });
  }

  return NextResponse.json(attendance);
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);

  let where = {};
  if (session.user.role === 'ADMIN') {
    where = { user: { organizationId: session.user.organizationId } };
  } else {
    const userId = searchParams.get('userId') || session.user.id;
    where = { userId };
  }

  const attendances = await prisma.attendance.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 300,
  });

  return NextResponse.json(attendances);
}
