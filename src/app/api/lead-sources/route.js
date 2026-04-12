import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sources = await prisma.leadSource.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(sources);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, icon } = await request.json();
  if (!name || !name.trim()) return NextResponse.json({ error: 'Manba nomi kerak' }, { status: 400 });

  const maxOrder = await prisma.leadSource.findFirst({
    where: { organizationId: session.user.organizationId },
    orderBy: { order: 'desc' },
  });

  const source = await prisma.leadSource.create({
    data: {
      organizationId: session.user.organizationId,
      name: name.trim(),
      icon: icon || null,
      order: (maxOrder?.order || 0) + 1,
    },
  });
  return NextResponse.json(source);
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name, icon } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID kerak' }, { status: 400 });
  if (!name || !name.trim()) return NextResponse.json({ error: 'Manba nomi kerak' }, { status: 400 });

  const existing = await prisma.leadSource.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!existing) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 });

  const updated = await prisma.leadSource.update({
    where: { id },
    data: { name: name.trim(), icon: icon || null },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID kerak' }, { status: 400 });

  const existing = await prisma.leadSource.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!existing) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.dailyReportSource.deleteMany({ where: { sourceId: id } });
    await tx.leadSource.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}
