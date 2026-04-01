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

  const { userId, penaltyId, reason, amount } = await request.json();

  const record = await prisma.penaltyRecord.create({
    data: {
      userId, penaltyId: penaltyId || null,
      reason, amount: parseFloat(amount),
      assignedById: session.user.id,
    },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(record);
}
