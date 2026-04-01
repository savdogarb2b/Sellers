import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const stages = await prisma.funnelStage.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(stages);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await request.json();
  const maxOrder = await prisma.funnelStage.findFirst({
    where: { organizationId: session.user.organizationId },
    orderBy: { order: 'desc' },
  });

  const stage = await prisma.funnelStage.create({
    data: { organizationId: session.user.organizationId, name, order: (maxOrder?.order || 0) + 1 },
  });
  return NextResponse.json(stage);
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name } = await request.json();
  const stage = await prisma.funnelStage.update({
    where: { id },
    data: { name },
  });
  return NextResponse.json(stage);
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  await prisma.funnelStage.delete({ where: { id: searchParams.get('id') } });
  return NextResponse.json({ success: true });
}
