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
  if (!name || !name.trim()) return NextResponse.json({ error: 'Bosqich nomi kerak' }, { status: 400 });

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
  const existingStage = await prisma.funnelStage.findFirst({
    where: { id, organizationId: session.user.organizationId },
    select: { id: true },
  });

  if (!existingStage) return NextResponse.json({ error: 'Stage topilmadi' }, { status: 404 });

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
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID kerak' }, { status: 400 });

  const stage = await prisma.funnelStage.findFirst({
    where: { id, organizationId: session.user.organizationId },
    select: { id: true, order: true },
  });

  if (!stage) return NextResponse.json({ error: 'Bosqich topilmadi' }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.dailyReportLeadStatus.deleteMany({ where: { stageId: id } });
    await tx.funnelStage.delete({ where: { id } });

    const remainingStages = await tx.funnelStage.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { order: 'asc' },
      select: { id: true },
    });

    await Promise.all(
      remainingStages.map((item, index) =>
        tx.funnelStage.update({
          where: { id: item.id },
          data: { order: index + 1 },
        })
      )
    );
  });

  return NextResponse.json({ success: true });
}
