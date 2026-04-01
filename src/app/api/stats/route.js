import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = session.user.organizationId;
  const isSuperadmin = session.user.role === 'SUPERADMIN';

  if (isSuperadmin) {
    const orgs = await prisma.organization.findMany({
      include: { _count: { select: { users: true } } },
    });
    const totalUsers = await prisma.user.count();
    const totalOrgs = orgs.length;
    return NextResponse.json({ totalOrgs, totalUsers, organizations: orgs });
  }

  // ====== ADMIN STATS — 23+ METRICS ======
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  // 7 kun oldin
  const weekAgo = new Date(todayStart);
  weekAgo.setDate(weekAgo.getDate() - 7);
  // 14 kun oldin (oldingi hafta uchun)
  const twoWeeksAgo = new Date(todayStart);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const employees = await prisma.user.findMany({
    where: { organizationId: orgId, role: 'EMPLOYEE' },
    include: {
      dailyReports: { include: { leadStatuses: true } },
      penaltyRecords: true,
      bonusRecords: true,
      kpis: true,
      attendances: true,
    },
  });

  const totalEmployees = employees.length;

  // ---- SOTUV ----
  const totalSales = employees.reduce((sum, e) => sum + e.dailyReports.reduce((s, r) => s + r.sales, 0), 0);
  const totalCalls = employees.reduce((sum, e) => sum + e.dailyReports.reduce((s, r) => s + r.totalCalls, 0), 0);
  const totalQualityLeads = employees.reduce((sum, e) => sum + e.dailyReports.reduce((s, r) => s + (r.leadStatuses ? r.leadStatuses.reduce((acc, ls) => acc + ls.count, 0) : 0), 0), 0);
  const totalLeads = totalQualityLeads;
  const avgConversion = totalQualityLeads > 0 ? Math.round((totalSales / totalQualityLeads) * 100) : 0;

  const totalRevenue = employees.reduce((sum, e) => sum + e.dailyReports.reduce((s, r) => s + r.revenue, 0), 0);
  const avgCheck = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;

  // Bugungi sifatli lidlar (Jami lidlar sifatida)
  const todayQualityLeads = employees.reduce((sum, e) => 
    sum + e.dailyReports.filter(r => new Date(r.date).toDateString() === todayStart.toDateString()).reduce((s, r) => s + (r.leadStatuses ? r.leadStatuses.reduce((acc, ls) => acc + ls.count, 0) : 0), 0), 0);

  // Xodim boshiga o'rtacha sotuv
  const salesPerEmployee = totalEmployees > 0 ? Math.round(totalSales / totalEmployees) : 0;

  // Haftalik trend: bu haftadagi vs o'tgan haftadagi sotuvlar
  const thisWeekSales = employees.reduce((sum, e) => 
    sum + e.dailyReports.filter(r => new Date(r.date) >= weekAgo).reduce((s, r) => s + r.sales, 0), 0);
  const lastWeekSales = employees.reduce((sum, e) => 
    sum + e.dailyReports.filter(r => { const d = new Date(r.date); return d >= twoWeeksAgo && d < weekAgo; }).reduce((s, r) => s + r.sales, 0), 0);
  const weeklyTrendPercent = lastWeekSales > 0 ? Math.round((thisWeekSales - lastWeekSales) / lastWeekSales * 100) : (thisWeekSales > 0 ? 100 : 0);

  // Haftalik konversiya
  const thisWeekQualityLeads = employees.reduce((sum, e) =>
    sum + e.dailyReports.filter(r => new Date(r.date) >= weekAgo).reduce((s, r) => s + (r.leadStatuses ? r.leadStatuses.reduce((acc, ls) => acc + ls.count, 0) : 0), 0), 0);
  const weeklyConversion = thisWeekQualityLeads > 0 ? Math.round(thisWeekSales / thisWeekQualityLeads * 1000) / 10 : 0;

  // ---- MOLIYA ----
  const totalPenalties = employees.reduce((sum, e) => sum + e.penaltyRecords.reduce((s, r) => s + r.amount, 0), 0);
  const totalBonuses = employees.reduce((sum, e) => sum + e.bonusRecords.reduce((s, r) => s + r.amount, 0), 0);
  const totalSalaryFund = employees.reduce((sum, e) => sum + (e.fixedSalary || 0), 0);
  const netFinancialBalance = totalSalaryFund + totalBonuses - totalPenalties;
  const avgBonusPerEmployee = totalEmployees > 0 ? Math.round(totalBonuses / totalEmployees) : 0;
  const avgPenaltyPerEmployee = totalEmployees > 0 ? Math.round(totalPenalties / totalEmployees) : 0;

  // Oylik (joriy oy) bonuslar va jarimalar
  const monthlyBonuses = employees.reduce((sum, e) => 
    sum + e.bonusRecords.filter(r => { const d = new Date(r.date); return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear; }).reduce((s, r) => s + r.amount, 0), 0);
  const monthlyPenalties = employees.reduce((sum, e) =>
    sum + e.penaltyRecords.filter(r => { const d = new Date(r.date); return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear; }).reduce((s, r) => s + r.amount, 0), 0);

  // ---- KPI ----
  const allKpis = employees.flatMap(e => e.kpis);
  const activeKpis = allKpis.filter(k => k.month === currentMonth && k.year === currentYear);
  const kpiAchievedCount = activeKpis.filter(k => k.targetValue > 0 && (k.currentValue / k.targetValue) >= 1).length;
  const avgKpiProgress = activeKpis.length > 0 
    ? Math.round(activeKpis.reduce((sum, k) => sum + (k.targetValue > 0 ? Math.min(k.currentValue / k.targetValue * 100, 100) : 0), 0) / activeKpis.length) 
    : 0;

  // Eng past KPI xodim
  const empKpiScores = employees.map(e => {
    const empKpis = e.kpis.filter(k => k.month === currentMonth && k.year === currentYear);
    const avg = empKpis.length > 0 ? empKpis.reduce((s, k) => s + (k.targetValue > 0 ? k.currentValue / k.targetValue * 100 : 0), 0) / empKpis.length : null;
    return { name: e.name, kpiAvg: avg };
  }).filter(e => e.kpiAvg !== null);
  
  const lowestKpiEmployee = empKpiScores.length > 0 
    ? empKpiScores.reduce((min, e) => e.kpiAvg < min.kpiAvg ? e : min) 
    : { name: '—', kpiAvg: 0 };

  // ---- DAVOMAT ----
  const todayAttendance = employees.filter(e => 
    e.attendances.some(a => new Date(a.date).toDateString() === todayStart.toDateString())
  ).length;
  const attendanceRate = totalEmployees > 0 ? Math.round(todayAttendance / totalEmployees * 100) : 0;

  const todayLateCount = employees.filter(e =>
    e.attendances.some(a => new Date(a.date).toDateString() === todayStart.toDateString() && a.isLate)
  ).length;

  const todayLateMinutes = employees.reduce((sum, e) => {
    const att = e.attendances.find(a => new Date(a.date).toDateString() === todayStart.toDateString() && a.isLate);
    return sum + (att ? att.lateMinutes : 0);
  }, 0);
  const avgLateMinutes = todayLateCount > 0 ? Math.round(todayLateMinutes / todayLateCount) : 0;

  // Bugungi hisobot topshirganlar
  const todayReportedCount = employees.filter(e =>
    e.dailyReports.some(r => new Date(r.date).toDateString() === todayStart.toDateString())
  ).length;

  // ---- STRATEGY ----
  const strategy = await prisma.salesStrategy.findFirst({
    where: { organizationId: orgId },
    include: { months: { orderBy: { month: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  let strategyProgress = 0;
  if (strategy) {
    const totalActual = strategy.months.reduce((s, m) => s + m.actualSales, 0);
    strategyProgress = strategy.targetSales > 0 ? Math.round(totalActual / strategy.targetSales * 100) : 0;
  }

  // ---- FUNNEL ----
  const funnelStages = await prisma.funnelStage.findMany({
    where: { organizationId: orgId },
    include: {
      reportLeadStatuses: {
        include: { report: true }
      }
    },
    orderBy: { order: 'asc' },
  });

  const funnelDistribution = funnelStages.map(stage => ({
    name: stage.name,
    count: stage.reportLeadStatuses.reduce((s, rls) => s + rls.count, 0),
  }));

  // ---- TOP PERFORMER ----
  const empSales = employees.map(e => ({
    name: e.name,
    sales: e.dailyReports.reduce((s, r) => s + r.sales, 0),
  })).sort((a, b) => b.sales - a.sales);
  const topPerformer = empSales[0] || { name: '—', sales: 0 };

  return NextResponse.json({
    // Asosiy
    totalEmployees,
    attendanceRate,
    todayAttendance,
    topPerformer,

    // Sotuv
    totalSales,
    totalQualityLeads,
    totalCalls,
    totalLeads,
    avgConversion: Math.round(avgConversion * 10) / 10,
    totalRevenue,
    avgCheck,
    todayQualityLeads,
    salesPerEmployee,
    thisWeekSales,
    weeklyTrendPercent,
    weeklyConversion,

    // Moliya
    totalSalaryFund,
    totalBonuses,
    totalPenalties,
    netFinancialBalance,
    avgBonusPerEmployee,
    avgPenaltyPerEmployee,
    monthlyBonuses,
    monthlyPenalties,

    // KPI
    avgKpiProgress,
    kpiAchievedCount,
    activeKpiCount: activeKpis.length,
    lowestKpiEmployee,

    // Davomat
    todayLateCount,
    avgLateMinutes,
    todayReportedCount,

    // Strategiya
    strategy,
    strategyProgress,

    // Voronka
    funnelDistribution,
  });
}
