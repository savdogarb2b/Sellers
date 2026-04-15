import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET — tashkilot lokatsiyasini olish
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!session.user.organizationId) {
      return NextResponse.json({ error: 'Tashkilot topilmadi' }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { locationLat: true, locationLng: true, locationRadius: true },
    });

    return NextResponse.json(org || {});
  } catch (error) {
    console.error('Location GET error:', error);
    return NextResponse.json({ error: 'Serverda xatolik yuz berdi' }, { status: 500 });
  }
}

// POST — admin lokatsiyani saqlaydi
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 401 });
    }

    if (!session.user.organizationId) {
      return NextResponse.json({ error: 'Tashkilot ID topilmadi. Qayta kiring.' }, { status: 400 });
    }

    const body = await request.json();
    const { lat, lng, radius } = body;

    // Koordinatalarni to'liq tekshirish (0 ham to'g'ri koordinata!)
    if (lat === undefined || lat === null || lng === undefined || lng === null) {
      return NextResponse.json({ error: 'Koordinatalar (lat, lng) majburiy' }, { status: 400 });
    }

    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);

    if (isNaN(numLat) || isNaN(numLng)) {
      return NextResponse.json({ error: 'Koordinatalar son bo\'lishi kerak' }, { status: 400 });
    }

    if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
      return NextResponse.json({ error: 'Koordinatalar diapazondan tashqari' }, { status: 400 });
    }

    const parsedRadius = Math.max(50, Math.min(5000, parseInt(radius) || 200));

    const updated = await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: {
        locationLat: numLat,
        locationLng: numLng,
        locationRadius: parsedRadius,
      },
      select: { locationLat: true, locationLng: true, locationRadius: true },
    });

    return NextResponse.json({ success: true, ...updated });
  } catch (error) {
    console.error('Location POST error:', error);
    return NextResponse.json(
      { error: 'Saqlashda xatolik: ' + (error.message || 'Noma\'lum xato') },
      { status: 500 }
    );
  }
}
