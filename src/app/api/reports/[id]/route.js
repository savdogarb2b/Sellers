import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = params.id;
  const data = await request.json();

  try {
    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Only allow Admin to edit reports of users in their own organization
    if (session.user.role === 'ADMIN' && report.user.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      incomingCalls,
      outgoingCalls,
      qualityLeads,
      nonQualityLeads,
      officeVisits,
      sales,
      revenue,
      leadStatuses
    } = data;

    const updatedReport = await prisma.dailyReport.update({
      where: { id },
      data: {
        incomingCalls: parseInt(incomingCalls) || 0,
        outgoingCalls: parseInt(outgoingCalls) || 0,
        totalCalls: (parseInt(incomingCalls) || 0) + (parseInt(outgoingCalls) || 0),
        qualityLeads: parseInt(qualityLeads) || 0,
        nonQualityLeads: parseInt(nonQualityLeads) || 0,
        officeVisits: parseInt(officeVisits) || 0,
        sales: parseInt(sales) || 0,
        revenue: parseFloat(revenue) || 0,
        leadStatuses: {
          deleteMany: {},
          create: leadStatuses?.map(ls => ({
            stageId: ls.stageId,
            count: parseInt(ls.count) || 0,
          })) || [],
        },
      },
      include: { leadStatuses: { include: { stage: true } }, user: { select: { id: true, name: true } } },
    });

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
