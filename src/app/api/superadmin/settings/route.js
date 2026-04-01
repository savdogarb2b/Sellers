import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await prisma.systemSettings.findMany();
  const settingsMap = {};
  settings.forEach(s => { settingsMap[s.key] = s.value; });
  return NextResponse.json(settingsMap);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  for (const [key, value] of Object.entries(body)) {
    await prisma.systemSettings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }

  const settings = await prisma.systemSettings.findMany();
  const settingsMap = {};
  settings.forEach(s => { settingsMap[s.key] = s.value; });
  return NextResponse.json(settingsMap);
}
