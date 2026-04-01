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

  const { reason, amount } = await request.json();
  const bonus = await prisma.bonus.create({
    data: { organizationId: session.user.organizationId, reason, amount: parseFloat(amount) },
  });
  return NextResponse.json(bonus);
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, reason, amount } = await request.json();
  const bonus = await prisma.bonus.update({
    where: { id },
    data: { reason, amount: parseFloat(amount) },
  });
  return NextResponse.json(bonus);
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  await prisma.bonus.delete({ where: { id: searchParams.get('id') } });
  return NextResponse.json({ success: true });
}
