import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// O'zbekiston vaqtini olish (UTC+5)
function getUzbekistanTime(date = new Date()) {
  return new Date(date.getTime() + 5 * 60 * 60 * 1000);
}

function getUzbekistanToday() {
  const uzNow = getUzbekistanTime();
  return new Date(Date.UTC(uzNow.getUTCFullYear(), uzNow.getUTCMonth(), uzNow.getUTCDate()));
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'EMPLOYEE') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Check if already checked in today (O'zbekiston vaqtida)
  const today = getUzbekistanToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existing = await prisma.attendance.findFirst({
    where: { userId, date: { gte: today, lt: tomorrow } },
  });

  if (existing) return NextResponse.json({ error: 'Bugun allaqachon keldingiz', attendance: existing }, { status: 400 });

  // Check lateness
  const now = new Date();
  const uzNow = getUzbekistanTime(now);
  let isLate = false;
  let lateMinutes = 0;
  let penaltyApplied = 0;
  let lateCountTotal = 0;
  let warningIssued = false;
  let warningMessage = '';

  const previousLateCount = await prisma.attendance.count({
    where: { userId, isLate: true },
  });

  if (user.workStartTime) {
    const [h, m] = user.workStartTime.split(':').map(Number);

    // O'zbekiston vaqtida ish boshlash vaqtini hisoblash
    const uzStartTime = new Date(Date.UTC(uzNow.getUTCFullYear(), uzNow.getUTCMonth(), uzNow.getUTCDate(), h, m, 0));
    // UTC ga qaytarish (UTC+5 ni hisobga olib)
    const startTimeUTC = new Date(uzStartTime.getTime() - 5 * 60 * 60 * 1000);

    const thresholdMinutes = Math.max(0, user.latenessThreshold || 15);
    const lateDeadline = new Date(startTimeUTC.getTime() + thresholdMinutes * 60000);

    // Threshold dan keyin kelgan = kechikkan
    if (now > lateDeadline) {
      isLate = true;
      lateMinutes = Math.ceil((now - lateDeadline) / 60000);
      lateCountTotal = previousLateCount + 1;

      if (lateCountTotal < 3) {
        // 1-2 marta: faqat ogohlantirish
        warningIssued = true;
        warningMessage = `${lateCountTotal}-kechikish (${lateMinutes} daq). Hozircha ogohlantirish berildi. 3-kechikishdan boshlab jarima yoziladi.`;
      } else {
        // 3+ marta: jarima
        penaltyApplied = user.latenessPenalty || 0;
        warningMessage = `${lateCountTotal}-kechikish (${lateMinutes} daq). Jarima qo'llanildi: ${penaltyApplied} so'm.`;
      }
    }
  }

  const attendance = await prisma.attendance.create({
    data: {
      userId,
      date: today,
      checkInTime: now,
      isLate,
      lateMinutes,
      penaltyApplied,
    },
  });

  // If late, create penalty record automatically
  if (isLate && penaltyApplied > 0) {
    await prisma.penaltyRecord.create({
      data: {
        userId,
        reason: `Ishga ${lateMinutes} daqiqa kechikish`,
        amount: penaltyApplied,
        assignedById: userId,
      },
    });
  }

  return NextResponse.json({
    ...attendance,
    lateCountTotal,
    warningIssued,
    warningMessage,
  });
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);

  let where = {};
  if (session.user.role === 'ADMIN') {
    where = { user: { organizationId: session.user.organizationId } };
  } else {
    const userId = searchParams.get('userId') || session.user.id;
    where = { userId };
  }

  const attendances = await prisma.attendance.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 300,
  });

  return NextResponse.json(attendances);
}
