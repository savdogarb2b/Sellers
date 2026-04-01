import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const monthStr = searchParams.get('month');
  const month = monthStr ? Number(monthStr) : null;
  const yearStr = searchParams.get('year');
  const year = yearStr ? Number(yearStr) : null;

  const orgId = session.user.organizationId;

  const employees = await prisma.user.findMany({
    where: { organizationId: orgId, role: 'EMPLOYEE' },
    include: {
      dailyReports: true,
      penaltyRecords: true,
      bonusRecords: true,
      kpis: true,
    },
  });

  const isSelectedPeriod = (d) => {
    if (!month || !year) return true; // if no filter, return true
    const dt = new Date(d);
    return dt.getMonth() + 1 === month && dt.getFullYear() === year;
  };

  const ratings = employees.map(emp => {
    const periodReports = emp.dailyReports.filter(r => isSelectedPeriod(r.date));
    const periodPenaltiesRecs = emp.penaltyRecords.filter(r => isSelectedPeriod(r.date));
    const periodBonusesRecs = emp.bonusRecords.filter(r => isSelectedPeriod(r.date));

    const totalSales = periodReports.reduce((sum, r) => sum + r.qualityLeads, 0);
    const totalCalls = periodReports.reduce((sum, r) => sum + r.totalCalls, 0);
    const conversion = totalCalls > 0 ? (totalSales / totalCalls * 100) : 0;
    const totalPenalties = periodPenaltiesRecs.reduce((sum, r) => sum + r.amount, 0);
    const totalBonuses = periodBonusesRecs.reduce((sum, r) => sum + r.amount, 0);

    // Score: sales * 10 + conversion * 2 + bonuses/10000 - penalties/10000
    const score = totalSales * 10 + conversion * 2 + totalBonuses / 10000 - totalPenalties / 10000;

    return {
      id: emp.id,
      name: emp.name,
      totalSales,
      totalCalls,
      conversion: Math.round(conversion * 10) / 10,
      totalPenalties,
      totalBonuses,
      score: Math.round(score * 10) / 10,
    };
  });

  ratings.sort((a, b) => b.score - a.score);
  return NextResponse.json(ratings);
}
