import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET — tashkilot lokatsiyasini olish
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { locationLat: true, locationLng: true, locationRadius: true },
  });

  return NextResponse.json(org || {});
}

// POST — admin lokatsiyani saqlaydi
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { lat, lng, radius } = await request.json();

  if (!lat || !lng) return NextResponse.json({ error: 'Koordinatalar kerak' }, { status: 400 });
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: 'Koordinatalar noto\'g\'ri' }, { status: 400 });
  }

  const parsedRadius = Math.max(50, Math.min(5000, parseInt(radius) || 200));

  const updated = await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: { locationLat: parseFloat(lat), locationLng: parseFloat(lng), locationRadius: parsedRadius },
    select: { locationLat: true, locationLng: true, locationRadius: true },
  });

  return NextResponse.json(updated);
}
