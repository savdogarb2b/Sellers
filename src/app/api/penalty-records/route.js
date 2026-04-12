import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = session.user.organizationId;
  const userId = session.user.id;
  const isEmployee = session.user.role === 'EMPLOYEE';

  const where = isEmployee ? { userId } : { user: { organizationId: orgId } };

  const records = await prisma.penaltyRecord.findMany({
    where,
    include: { user: { select: { name: true } }, penalty: true },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json(records);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { userId, penaltyId, reason, amount } = await request.json();
    if (!userId) return NextResponse.json({ error: 'Xodim tanlanishi shart' }, { status: 400 });
    if (!reason || !reason.trim()) return NextResponse.json({ error: 'Sabab kiritilishi shart' }, { status: 400 });
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return NextResponse.json({ error: 'Summa musbat son bo\'lishi kerak' }, { status: 400 });

    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
    if (!targetUser || targetUser.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Xodim topilmadi yoki boshqa tashkilotga tegishli' }, { status: 403 });
    }

    const record = await prisma.penaltyRecord.create({
      data: {
        userId, penaltyId: penaltyId || null,
        reason: reason.trim(), amount: parsedAmount,
        assignedById: session.user.id,
      },
      include: { user: { select: { name: true } } },
    });

    return NextResponse.json(record);
  } catch (err) {
    return NextResponse.json({ error: 'Jarima yozishda xatolik' }, { status: 500 });
  }
}

// PUT — admin jarimani tahrirlaydi
export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, reason, amount } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID kerak' }, { status: 400 });

    const record = await prisma.penaltyRecord.findFirst({
      where: { id, user: { organizationId: session.user.organizationId } },
    });
    if (!record) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 });

    const data = {};
    if (reason !== undefined) data.reason = reason.trim();
    if (amount !== undefined) {
      const parsed = parseFloat(amount);
      if (isNaN(parsed) || parsed < 0) return NextResponse.json({ error: 'Summa noto\'g\'ri' }, { status: 400 });
      data.amount = parsed;
    }

    const updated = await prisma.penaltyRecord.update({
      where: { id },
      data,
      include: { user: { select: { name: true } } },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Tahrirlashda xatolik' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID kerak' }, { status: 400 });

  const record = await prisma.penaltyRecord.findFirst({
    where: {
      id,
      user: { organizationId: session.user.organizationId },
    },
    select: { id: true },
  });

  if (!record) return NextResponse.json({ error: 'Record topilmadi' }, { status: 404 });

  await prisma.penaltyRecord.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
