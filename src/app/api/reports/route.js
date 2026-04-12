import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');

  let where = {};
  if (session.user.role === 'ADMIN') {
    // Admin: return all reports for employees in their org
    where = { user: { organizationId: session.user.organizationId } };
  } else {
    // Employee: only their own
    const userId = searchParams.get('userId') || session.user.id;
    where = { userId };
  }

  if (startDateStr && endDateStr) {
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);
    
    where.date = {
      gte: start,
      lte: end,
    };
  }

  const page = searchParams.has('page') ? Math.max(1, parseInt(searchParams.get('page')) || 1) : null;
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit')) || 50));
  const skip = page ? (page - 1) * limit : 0;

  const [reports, total] = await Promise.all([
    prisma.dailyReport.findMany({
      where,
      include: { leadStatuses: { include: { stage: true } }, sourceStatuses: { include: { source: true } }, user: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
      skip,
      take: page ? limit : 200,
    }),
    page ? prisma.dailyReport.count({ where }) : Promise.resolve(0),
  ]);

  if (page) {
    return NextResponse.json({
      data: reports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }

  return NextResponse.json(reports);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'EMPLOYEE') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Noto\'g\'ri so\'rov formati' }, { status: 400 });
  }
  const { incomingCalls, outgoingCalls, qualityLeads, nonQualityLeads, officeVisits, sales, revenue, leadStatuses, sourceStatuses } = body;
  const userId = session.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // O'zbekiston vaqtida bugunni aniqlash (UTC+5)
  const now = new Date();
  const uzNow = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const today = new Date(Date.UTC(uzNow.getUTCFullYear(), uzNow.getUTCMonth(), uzNow.getUTCDate()));
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingReport = await prisma.dailyReport.findFirst({
    where: { userId, date: { gte: today, lt: tomorrow } },
  });

  if (existingReport) {
    return NextResponse.json({ error: 'Bugungi hisobot allaqachon yuborilgan' }, { status: 400 });
  }

  // Ish tugash vaqtidan oldin hisobot yozish mumkin emas
  if (user.workEndTime) {
    const [endH, endM] = user.workEndTime.split(':').map(Number);
    const uzHour = uzNow.getUTCHours();
    const uzMin = uzNow.getUTCMinutes();
    const nowTotalMin = uzHour * 60 + uzMin;
    const endTotalMin = endH * 60 + endM;

    if (nowTotalMin < endTotalMin) {
      const qoldi = endTotalMin - nowTotalMin;
      const soat = Math.floor(qoldi / 60);
      const daq = qoldi % 60;
      const vaqtStr = soat > 0 ? `${soat} soat ${daq} daqiqa` : `${daq} daqiqa`;
      return NextResponse.json({
        error: `Hisobotni faqat ish tugagandan keyin (${user.workEndTime} dan) topshirish mumkin. Yana ${vaqtStr} qoldi.`
      }, { status: 400 });
    }
  }

  const report = await prisma.dailyReport.create({
    data: {
      userId,
      date: today,
      incomingCalls: parseInt(incomingCalls) || 0,
      outgoingCalls: parseInt(outgoingCalls) || 0,
      totalCalls: (parseInt(incomingCalls) || 0) + (parseInt(outgoingCalls) || 0),
      qualityLeads: parseInt(qualityLeads) || 0,
      nonQualityLeads: parseInt(nonQualityLeads) || 0,
      officeVisits: parseInt(officeVisits) || 0,
      sales: parseInt(sales) || 0,
      revenue: parseFloat(revenue) || 0,
      leadStatuses: leadStatuses?.length ? {
        create: leadStatuses.map(ls => ({
          stageId: ls.stageId,
          count: parseInt(ls.count) || 0,
        })),
      } : undefined,
      sourceStatuses: sourceStatuses?.length ? {
        create: sourceStatuses.map(ss => ({
          sourceId: ss.sourceId,
          count: parseInt(ss.count) || 0,
        })),
      } : undefined,
    },
    include: { leadStatuses: { include: { stage: true } }, sourceStatuses: { include: { source: true } } },
  });

  if (user.workEndTime) {
    const [h, m] = user.workEndTime.split(':').map(Number);
    // O'zbekiston vaqtida ish tugash vaqtini hisoblash
    const uzDeadline = new Date(Date.UTC(uzNow.getUTCFullYear(), uzNow.getUTCMonth(), uzNow.getUTCDate(), h, m, 0));
    const reportDeadlineUTC = new Date(uzDeadline.getTime() - 5 * 60 * 60 * 1000);

    const thresholdMinutes = Math.max(0, user.reportSubmissionThreshold || 0);
    const penaltyTime = new Date(reportDeadlineUTC.getTime() + thresholdMinutes * 60000);

    if (now > penaltyTime && (user.latenessPenalty || 0) > 0) {
      const lateByMinutes = Math.ceil((now - reportDeadlineUTC) / 60000);
      await prisma.penaltyRecord.create({
        data: {
          userId,
          reason: `Hisobot ${lateByMinutes} daqiqa kech topshirildi`,
          amount: user.latenessPenalty || 0,
          assignedById: userId,
        },
      });
    }
  }

  return NextResponse.json(report);
}
