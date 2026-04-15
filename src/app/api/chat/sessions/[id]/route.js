import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: sessionId } = await params;
  const messages = await prisma.chatMessage.findMany({
    where: { 
      userId: session.user.id,
      sessionId: sessionId
    },
    orderBy: { createdAt: 'asc' },
    take: 150,
  });

  return NextResponse.json(messages);
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: sessionId } = await params;
  
  await prisma.chatSession.deleteMany({
    where: {
      id: sessionId,
      userId: session.user.id
    }
  });

  return NextResponse.json({ success: true });
}
