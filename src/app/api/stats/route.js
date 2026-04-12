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
  const period = searchParams.get('period') || 'monthly';

  let startDate = null;
  let endDate = null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  if (startDateStr && endDateStr) {
    startDate = new Date(startDateStr);
    endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);
  } else {
    if (period === 'daily') {
      startDate = todayStart;
      endDate = tomorrowStart;
    } else if (period === 'weekly') {
      startDate = new Date(todayStart);
      startDate.setDate(startDate.getDate() - 7);
      endDate = tomorrowStart;
    } else if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = tomorrowStart;
    } else {
      startDate = null;
      endDate = null;
    }
  }

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
      dailyReports: { include: { leadStatuses: true, sourceStatuses: { include: { source: true } } } },
      penaltyRecords: true,
      bonusRecords: true,
      kpis: true,
      attendances: true,
    },
  });

  const totalEmployees = employees.length;
  const allReports = employees.flatMap(e => e.dailyReports);
  const sumNewLeads = (reports) => reports.reduce((sum, report) => sum + (report.officeVisits || 0), 0);
  const sumLeads = (reports) => reports.reduce((sum, report) => sum + (report.qualityLeads || 0), 0);
  const sumSales = (reports) => reports.reduce((sum, report) => sum + (report.sales || 0), 0);
  const sumRevenue = (reports) => reports.reduce((sum, report) => sum + (report.revenue || 0), 0);
  const toPercent = (sales, leads) => leads > 0 ? Math.round((sales / leads) * 1000) / 10 : 0;

  const filteredReports = startDate && endDate
    ? allReports.filter(r => {
      const reportDate = new Date(r.date);
      return reportDate >= startDate && reportDate < endDate;
    })
    : allReports;

  // ---- SOTUV ----
  const totalSales = sumSales(filteredReports);
  const totalCalls = filteredReports.reduce((sum, r) => sum + r.totalCalls, 0);
  const totalNewLeads = sumNewLeads(filteredReports);
  const totalQualityLeads = sumLeads(filteredReports);
  const totalLeads = totalQualityLeads;
  const avgConversion = toPercent(totalSales, totalQualityLeads);

  const totalRevenue = sumRevenue(filteredReports);
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
  const totalSalaryFund = employees.reduce((sum, e) => sum + (e.fixedSalary || 0), 0);

  // Period bo'yicha filtrlangan moliya
  const filterByPeriod = (records) => {
    if (!startDate || !endDate) return records;
    return records.filter(r => {
      const d = new Date(r.date);
      return d >= startDate && d < endDate;
    });
  };

  const totalPenalties = employees.reduce((sum, e) => sum + filterByPeriod(e.penaltyRecords).reduce((s, r) => s + r.amount, 0), 0);
  const totalBonuses = employees.reduce((sum, e) => sum + filterByPeriod(e.bonusRecords).reduce((s, r) => s + r.amount, 0), 0);
  const netFinancialBalance = totalRevenue - (totalSalaryFund + totalBonuses - totalPenalties);
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
    ? Math.round(activeKpis.reduce((sum, k) => sum + (k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0), 0) / activeKpis.length)
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
    const empReportIds = new Set(employee.dailyReports.map(r => r.id));
    const employeeFilteredReports = filteredReports.filter(report => empReportIds.has(report.id));
    const employeeLeads = sumLeads(employeeFilteredReports);
    const employeeSales = sumSales(employeeFilteredReports);
    const employeeRevenue = sumRevenue(employeeFilteredReports);
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
  let strategyTargetSales = 0;
  let strategyActualSales = 0;
  if (strategy) {
    strategyTargetSales = strategy.targetSales;

    // actualSales ni haqiqiy hisobotlardan hisoblaymiz (strategy davri bo'yicha)
    const strategyStart = new Date(strategy.startDate);
    const strategyEnd = new Date(strategy.endDate);
    strategyEnd.setMonth(strategyEnd.getMonth() + 1); // end of last month
    const strategyReports = allReports.filter(r => {
      const d = new Date(r.date);
      return d >= strategyStart && d < strategyEnd;
    });
    strategyActualSales = strategyReports.reduce((s, r) => s + (r.sales || 0), 0);
    strategyProgress = strategyTargetSales > 0 ? Math.round(strategyActualSales / strategyTargetSales * 100) : 0;
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
    const stageReportIds = new Set(stage.reportLeadStatuses.map(rls => rls.reportId));
    const filteredStageReports = filteredReports.filter(r => stageReportIds.has(r.id));
    const count = filteredStageReports.reduce((sum, r) => {
      const reportLeadStatuses = stage.reportLeadStatuses.filter(rls => rls.reportId === r.id);
      return sum + reportLeadStatuses.reduce((s, rls) => s + rls.count, 0);
    }, 0);

    if (index === 0) {
      return {
        name: stage.name,
        count,
        conversionFromPrev: 100,
        dropOffPercent: 0,
      };
    }

    const prevStageReportIds = new Set(funnelStages[index - 1].reportLeadStatuses.map(rls => rls.reportId));
    const prevFilteredStageReports = filteredReports.filter(r => prevStageReportIds.has(r.id));
    const previousCount = prevFilteredStageReports.reduce((sum, r) => {
      const reportLeadStatuses = funnelStages[index - 1].reportLeadStatuses.filter(rls => rls.reportId === r.id);
      return sum + reportLeadStatuses.reduce((s, rls) => s + rls.count, 0);
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

  // ---- ASOSIY VORONKA (7 ta o'zgarmas bosqich) ----
  const totalIncoming = filteredReports.reduce((s, r) => s + (r.incomingCalls || 0), 0);
  const totalOutgoing = filteredReports.reduce((s, r) => s + (r.outgoingCalls || 0), 0);
  const totalNonQualityLeads = filteredReports.reduce((s, r) => s + (r.nonQualityLeads || 0), 0);

  const mainFunnel = [
    { name: 'Kiruvchi qo\'ng\'iroq', count: totalIncoming },
    { name: 'Zadacha', count: totalOutgoing },
    { name: 'Yangi lidlar', count: totalNewLeads },
    { name: 'Sifatli lidlar', count: totalQualityLeads },
    { name: 'Sifatsiz lidlar', count: totalNonQualityLeads },
    { name: 'Sotib olganlar', count: totalSales },
  ].map((stage, i, arr) => {
    if (i === 0) return { ...stage, conversionFromPrev: 100, dropOffPercent: 0 };
    const prev = arr[i - 1].count;
    const conv = prev > 0 ? Math.round((stage.count / prev) * 1000) / 10 : 0;
    const drop = prev > 0 ? Math.round((Math.max(prev - stage.count, 0) / prev) * 1000) / 10 : 0;
    return { ...stage, conversionFromPrev: Math.min(conv, 100), dropOffPercent: drop };
  });

  const mainWeakestStage = mainFunnel.slice(1).filter(s => s.count > 0 || mainFunnel[0].count > 0).reduce((lowest, stage) => {
    if (!lowest) return stage;
    return stage.conversionFromPrev < lowest.conversionFromPrev ? stage : lowest;
  }, null);

  const weakestStage = funnelStageAnalytics.slice(1).reduce((lowest, stage) => {
    if (!lowest) return stage;
    return stage.conversionFromPrev < lowest.conversionFromPrev ? stage : lowest;
  }, null);

  // ---- TOP PERFORMER ----
  const empSales = employees.map(e => {
    const empReportIds = new Set(e.dailyReports.map(r => r.id));
    const empFilteredReports = filteredReports.filter(r => empReportIds.has(r.id));
    return {
      name: e.name,
      leads: sumLeads(empFilteredReports),
      sales: sumSales(empFilteredReports),
      revenue: sumRevenue(empFilteredReports),
      conversion: toPercent(sumSales(empFilteredReports), sumLeads(empFilteredReports)),
    };
  }).sort((a, b) => b.sales - a.sales);
  const topPerformer = empSales[0] || { name: '—', sales: 0, leads: 0, revenue: 0, conversion: 0 };

  return NextResponse.json({
    // Asosiy
    totalEmployees,
    attendanceRate,
    todayAttendance,
    topPerformer,

    // Sotuv
    totalSales,
    totalNewLeads,
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
    strategyTargetSales,
    strategyActualSales,

    // Voronka
    funnelDistribution,
    funnelStageAnalytics,
    weakestStage,

    // Asosiy voronka (7 ta o'zgarmas)
    mainFunnel,
    mainWeakestStage,

    // Lid manbalari statistikasi
    sourceStats: (() => {
      const sourceMap = {};
      filteredReports.forEach(r => {
        if (r.sourceStatuses) {
          r.sourceStatuses.forEach(ss => {
            const name = ss.source?.name || 'Noma\'lum';
            const icon = ss.source?.icon || '📱';
            if (!sourceMap[name]) sourceMap[name] = { name, icon, count: 0 };
            sourceMap[name].count += ss.count || 0;
          });
        }
      });
      return Object.values(sourceMap).sort((a, b) => b.count - a.count);
    })(),

    // Conversion dashboard
    employeeConversions,
    conversionSummary: {
      today: { conversion: todayConversion, leads: todayQualityLeads, sales: todaySales, revenue: todayRevenue },
      weekly: { conversion: weeklyConversion, leads: weeklyLeads, sales: thisWeekSales, revenue: weeklyRevenue },
      monthly: { conversion: monthlyConversion, leads: monthlyLeads, sales: monthlySales, revenue: monthlyRevenue },
    },
  });
}
