import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);

  let where = {};
  if (session.user.role === 'ADMIN') {
    // Admin: return all reports for employees in their org
    where = { user: { organizationId: session.user.organizationId } };
  } else {
    // Employee: only their own
    const userId = searchParams.get('userId') || session.user.id;
    where = { userId };
  }

  const reports = await prisma.dailyReport.findMany({
    where,
    include: { leadStatuses: { include: { stage: true } }, user: { select: { id: true, name: true } } },
    orderBy: { date: 'desc' },
    take: 200,
  });

  return NextResponse.json(reports);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'EMPLOYEE') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { incomingCalls, outgoingCalls, qualityLeads, nonQualityLeads, officeVisits, sales, revenue, leadStatuses } = await request.json();
  const userId = session.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
    },
    include: { leadStatuses: { include: { stage: true } } },
  });

  return NextResponse.json(report);
}
