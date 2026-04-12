import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET — xodim o'zining, admin tashkilotning barcha so'rovlarini oladi
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let where = {};
  if (session.user.role === 'EMPLOYEE') {
    where.userId = session.user.id;
  } else if (session.user.role === 'ADMIN') {
    where.user = { organizationId: session.user.organizationId };
  }

  const requests = await prisma.leaveRequest.findMany({
    where,
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json(requests);
}

// POST — xodim ruxsat so'raydi
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'EMPLOYEE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type, date, reason } = await request.json();

  if (!type || !['KECHIKISH', 'TOLIK_DAM', 'YARIM_KUN'].includes(type)) {
    return NextResponse.json({ error: 'Turi noto\'g\'ri' }, { status: 400 });
  }
  if (!date) return NextResponse.json({ error: 'Sana kerak' }, { status: 400 });
  if (!reason || !reason.trim()) return NextResponse.json({ error: 'Sabab yozilishi shart' }, { status: 400 });

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      userId: session.user.id,
      type,
      date: new Date(date),
      reason: reason.trim(),
      status: 'KUTILMOQDA',
    },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(leaveRequest);
}

// PATCH — admin tasdiqlaydi yoki rad etadi
export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, status, adminNote } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID kerak' }, { status: 400 });

  const existing = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { user: { select: { organizationId: true } } },
  });
  if (!existing || existing.user.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: 'Topilmadi' }, { status: 404 });
  }

  const data = {};
  if (status && ['KUTILMOQDA', 'TASDIQLANDI', 'RAD_ETILDI'].includes(status)) data.status = status;
  if (adminNote !== undefined) data.adminNote = adminNote;

  // Agar tasdiqlansa va kechikish jarimasi bo'lsa — jarimani o'chirish
  if (status === 'TASDIQLANDI' && existing.type === 'KECHIKISH') {
    const leaveDate = new Date(existing.date);
    leaveDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(leaveDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // O'sha kungi kechikish jarimalarini o'chirish
    await prisma.penaltyRecord.deleteMany({
      where: {
        userId: existing.userId,
        reason: { contains: 'kechikish' },
        date: { gte: leaveDate, lt: nextDay },
      },
    });

    // Attendance'ni ham yangilash — isLate=false
    await prisma.attendance.updateMany({
      where: {
        userId: existing.userId,
        date: { gte: leaveDate, lt: nextDay },
        isLate: true,
      },
      data: { isLate: false, lateMinutes: 0, penaltyApplied: 0 },
    });
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data,
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(updated);
}

// DELETE — admin yoki xodim o'chiradi
export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID kerak' }, { status: 400 });

  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 });

  if (session.user.role === 'EMPLOYEE' && existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  await prisma.leaveRequest.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
