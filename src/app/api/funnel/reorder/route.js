import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { stages } = await request.json();

  if (!stages || !Array.isArray(stages)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  // Update order for each stage within a transaction
  await prisma.$transaction(
    stages.map((stage) =>
      prisma.funnelStage.update({
        where: { id: stage.id },
        data: { order: stage.order },
      })
    )
  );

  return NextResponse.json({ success: true });
}
