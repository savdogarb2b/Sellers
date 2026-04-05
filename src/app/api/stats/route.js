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
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
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
  const allReports = employees.flatMap(e => e.dailyReports);
  const sumLeads = (reports) => reports.reduce((sum, report) => sum + (report.leadStatuses ? report.leadStatuses.reduce((acc, status) => acc + (status.count || 0), 0) : 0), 0);
  const sumSales = (reports) => reports.reduce((sum, report) => sum + (report.sales || 0), 0);
  const sumRevenue = (reports) => reports.reduce((sum, report) => sum + (report.revenue || 0), 0);
  const toPercent = (sales, leads) => leads > 0 ? Math.round((sales / leads) * 1000) / 10 : 0;

  // ---- SOTUV ----
  const totalSales = sumSales(allReports);
  const totalCalls = employees.reduce((sum, e) => sum + e.dailyReports.reduce((s, r) => s + r.totalCalls, 0), 0);
  const totalQualityLeads = sumLeads(allReports);
  const totalLeads = totalQualityLeads;
  const avgConversion = toPercent(totalSales, totalQualityLeads);

  const totalRevenue = sumRevenue(allReports);
  const avgCheck = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;

  const todayReports = allReports.filter(report => {
    const reportDate = new Date(report.date);
    return reportDate >= todayStart && reportDate < tomorrowStart;
  });
  const weeklyReports = allReports.filter(report => new Date(report.date) >= weekAgo);
  const monthlyReports = allReports.filter(report => {
    const reportDate = new Date(report.date);
    return reportDate.getMonth() + 1 === currentMonth && reportDate.getFullYear() === currentYear;
  });

  const todayQualityLeads = sumLeads(todayReports);
  const todaySales = sumSales(todayReports);
  const todayRevenue = sumRevenue(todayReports);
  const thisWeekSales = sumSales(weeklyReports);
  const weeklyRevenue = sumRevenue(weeklyReports);
  const weeklyLeads = sumLeads(weeklyReports);
  const monthlySales = sumSales(monthlyReports);
  const monthlyRevenue = sumRevenue(monthlyReports);
  const monthlyLeads = sumLeads(monthlyReports);
  const todayConversion = toPercent(todaySales, todayQualityLeads);
  const weeklyConversion = toPercent(thisWeekSales, weeklyLeads);
  const monthlyConversion = toPercent(monthlySales, monthlyLeads);

  // Xodim boshiga o'rtacha sotuv
  const salesPerEmployee = totalEmployees > 0 ? Math.round(totalSales / totalEmployees) : 0;

  // Haftalik trend: bu haftadagi vs o'tgan haftadagi sotuvlar
  const lastWeekSales = employees.reduce((sum, e) => 
    sum + e.dailyReports.filter(r => { const d = new Date(r.date); return d >= twoWeeksAgo && d < weekAgo; }).reduce((s, r) => s + r.sales, 0), 0);
  const weeklyTrendPercent = lastWeekSales > 0 ? Math.round((thisWeekSales - lastWeekSales) / lastWeekSales * 100) : (thisWeekSales > 0 ? 100 : 0);

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

  const employeeConversions = employees.map(employee => {
    const employeeMonthReports = employee.dailyReports.filter(report => {
      const reportDate = new Date(report.date);
      return reportDate.getMonth() + 1 === currentMonth && reportDate.getFullYear() === currentYear;
    });
    const employeeLeads = sumLeads(employeeMonthReports);
    const employeeSales = sumSales(employeeMonthReports);
    const employeeRevenue = sumRevenue(employeeMonthReports);
    const todayAttendanceRecord = employee.attendances.find(attendance => {
      const attendanceDate = new Date(attendance.date);
      return attendanceDate >= todayStart && attendanceDate < tomorrowStart;
    });

    return {
      id: employee.id,
      name: employee.name,
      leads: employeeLeads,
      sales: employeeSales,
      revenue: employeeRevenue,
      conversion: toPercent(employeeSales, employeeLeads),
      checkedIn: Boolean(todayAttendanceRecord),
      isLate: Boolean(todayAttendanceRecord?.isLate),
    };
  }).sort((a, b) => {
    if (b.conversion !== a.conversion) return b.conversion - a.conversion;
    if (b.sales !== a.sales) return b.sales - a.sales;
    return b.leads - a.leads;
  });

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

  const funnelStageAnalytics = funnelStages.map((stage, index) => {
    const count = stage.reportLeadStatuses.reduce((sum, item) => {
      const reportDate = new Date(item.report.date);
      if (reportDate.getMonth() + 1 !== currentMonth || reportDate.getFullYear() !== currentYear) return sum;
      return sum + item.count;
    }, 0);

    if (index === 0) {
      return {
        name: stage.name,
        count,
        conversionFromPrev: 100,
        dropOffPercent: 0,
      };
    }

    const previousCount = funnelStages[index - 1].reportLeadStatuses.reduce((sum, item) => {
      const reportDate = new Date(item.report.date);
      if (reportDate.getMonth() + 1 !== currentMonth || reportDate.getFullYear() !== currentYear) return sum;
      return sum + item.count;
    }, 0);

    const conversionFromPrev = previousCount > 0 ? Math.min(100, Math.round((count / previousCount) * 1000) / 10) : 0;
    const dropOffPercent = previousCount > 0 ? Math.round((Math.max(previousCount - count, 0) / previousCount) * 1000) / 10 : 0;

    return {
      name: stage.name,
      count,
      conversionFromPrev,
      dropOffPercent,
    };
  });

  const weakestStage = funnelStageAnalytics.slice(1).reduce((lowest, stage) => {
    if (!lowest) return stage;
    return stage.conversionFromPrev < lowest.conversionFromPrev ? stage : lowest;
  }, null);

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
    todaySales,
    todayRevenue,
    salesPerEmployee,
    thisWeekSales,
    weeklyTrendPercent,
    weeklyConversion,
    todayConversion,
    monthlyConversion,
    monthlyLeads,
    monthlySales,
    monthlyRevenue,
    weeklyLeads,
    todayLeads: todayQualityLeads,

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
    funnelStageAnalytics,
    weakestStage,

    // Conversion dashboard
    employeeConversions,
    conversionSummary: {
      today: { conversion: todayConversion, leads: todayQualityLeads, sales: todaySales, revenue: todayRevenue },
      weekly: { conversion: weeklyConversion, leads: weeklyLeads, sales: thisWeekSales, revenue: weeklyRevenue },
      monthly: { conversion: monthlyConversion, leads: monthlyLeads, sales: monthlySales, revenue: monthlyRevenue },
    },
  });
}
