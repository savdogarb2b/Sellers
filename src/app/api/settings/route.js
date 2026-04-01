import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { organization: true },
  });

  return NextResponse.json(adminUser);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { organizationName, name, email, workStartTime, workEndTime, latenessPenalty } = await request.json();

  // Update organization
  if (session.user.organizationId) {
    await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: { name: organizationName },
    });
  }

  // Update user default settings
  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      email,
      workStartTime,
      workEndTime,
      latenessPenalty: Number(latenessPenalty) || 0,
    },
    include: { organization: true },
  });

  return NextResponse.json(updatedUser);
}
