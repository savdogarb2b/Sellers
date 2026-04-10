import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bonuses = await prisma.bonus.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(bonuses);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { reason, amount } = await request.json();
    if (!reason || !reason.trim()) return NextResponse.json({ error: 'Sabab kiritilishi shart' }, { status: 400 });
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return NextResponse.json({ error: 'Summa musbat son bo\'lishi kerak' }, { status: 400 });

    const bonus = await prisma.bonus.create({
      data: { organizationId: session.user.organizationId, reason: reason.trim(), amount: parsedAmount },
    });
    return NextResponse.json(bonus);
  } catch (err) {
    return NextResponse.json({ error: 'Bonus yaratishda xatolik' }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, reason, amount } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID kerak' }, { status: 400 });
    if (!reason || !reason.trim()) return NextResponse.json({ error: 'Sabab kiritilishi shart' }, { status: 400 });
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return NextResponse.json({ error: 'Summa musbat son bo\'lishi kerak' }, { status: 400 });

    const existing = await prisma.bonus.findFirst({ where: { id, organizationId: session.user.organizationId } });
    if (!existing) return NextResponse.json({ error: 'Bonus topilmadi' }, { status: 404 });

    const bonus = await prisma.bonus.update({
      where: { id },
      data: { reason: reason.trim(), amount: parsedAmount },
    });
    return NextResponse.json(bonus);
  } catch (err) {
    return NextResponse.json({ error: 'Bonus yangilashda xatolik' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID kerak' }, { status: 400 });

    const existing = await prisma.bonus.findFirst({ where: { id, organizationId: session.user.organizationId } });
    if (!existing) return NextResponse.json({ error: 'Bonus topilmadi' }, { status: 404 });

    await prisma.bonus.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Bonus o\'chirishda xatolik' }, { status: 500 });
  }
}
