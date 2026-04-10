import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const daysParam = searchParams.get('days');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let dateFrom = null;
  if (daysParam && daysParam !== 'all') {
    const days = parseInt(daysParam);
    if (!isNaN(days) && days > 0) {
      dateFrom = new Date(now);
      dateFrom.setDate(dateFrom.getDate() - days + 1);
      dateFrom.setHours(0, 0, 0, 0);
    }
  }

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const reportDateFilter = dateFrom ? { gte: dateFrom } : { gte: startOfMonth };

  // All organizations with all relations
  const allOrgs = await prisma.organization.findMany({
    include: {
      _count: { select: { users: true } },
      users: {
        include: {
          kpis: { where: { month: now.getMonth() + 1, year: now.getFullYear() } },
          penaltyRecords: { where: { date: reportDateFilter } },
          bonusRecords: { where: { date: reportDateFilter } },
          dailyReports: { where: { date: reportDateFilter } },
          attendances: { where: { date: reportDateFilter } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // ─── Users ───────────────────────────────────────────────────────────────────
  const allUsers = allOrgs.flatMap(o => o.users);
  const employees = allUsers.filter(u => u.role === 'EMPLOYEE');
  const admins = allUsers.filter(u => u.role === 'ADMIN');
  const totalEmployees = employees.length;
  const totalAdmins = admins.length;
  const totalOrgs = allOrgs.length;
  const activeOrgs = allOrgs.filter(o => o.status === 'ACTIVE').length;
  const frozenOrgs = allOrgs.filter(o => o.status === 'FROZEN').length;
  const newToday = allUsers.filter(u => new Date(u.createdAt) >= startOfToday).length;

  // ─── Financial ───────────────────────────────────────────────────────────────
  const totalSalaryFund = employees.reduce((s, e) => s + (e.fixedSalary || 0), 0);
  const monthBonuses = employees.reduce((s, e) => s + e.bonusRecords.reduce((bs, b) => bs + b.amount, 0), 0);
  const monthPenalties = employees.reduce((s, e) => s + e.penaltyRecords.reduce((ps, p) => ps + p.amount, 0), 0);
  const avgSalary = totalEmployees > 0 ? Math.round(totalSalaryFund / totalEmployees) : 0;

  // ─── KPI ─────────────────────────────────────────────────────────────────────
  const allKpis = employees.flatMap(e => e.kpis);
  const totalActiveKpis = allKpis.length;
  const kpiAchieved = allKpis.filter(k => k.currentValue >= k.targetValue).length;
  const kpiNotAchieved = totalActiveKpis - kpiAchieved;
  const kpiOverAchieved = allKpis.filter(k => k.currentValue >= k.targetValue * 1.2).length;
  const avgKpiCompletion = allKpis.length > 0
    ? Math.round(allKpis.reduce((s, k) => s + (k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0), 0) / allKpis.length)
    : 0;

  const orgKpiMap = allOrgs.map(org => {
    const orgEmps = org.users.filter(u => u.role === 'EMPLOYEE');
    const orgKpis = orgEmps.flatMap(e => e.kpis);
    const avgKpi = orgKpis.length > 0
      ? Math.round(orgKpis.reduce((s, k) => s + (k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0), 0) / orgKpis.length)
      : 0;
    return { name: org.name, avgKpi, id: org.id };
  }).filter(o => o.avgKpi > 0);

  const bestKpiOrg = [...orgKpiMap].sort((a, b) => b.avgKpi - a.avgKpi)[0] || null;
  const worstKpiOrg = [...orgKpiMap].sort((a, b) => a.avgKpi - b.avgKpi)[0] || null;

  // ─── Sales & Revenue ─────────────────────────────────────────────────────────
  const allReports = employees.flatMap(e => e.dailyReports);
  const monthQualityLeads = allReports.reduce((s, r) => s + r.qualityLeads, 0);
  const monthNonQualityLeads = allReports.reduce((s, r) => s + r.nonQualityLeads, 0);
  const monthTotalCalls = allReports.reduce((s, r) => s + r.totalCalls, 0);
  const totalIncomingCalls = allReports.reduce((s, r) => s + (r.incomingCalls || 0), 0);
  const totalOutgoingCalls = allReports.reduce((s, r) => s + (r.outgoingCalls || 0), 0);
  const totalOfficeVisits = allReports.reduce((s, r) => s + (r.officeVisits || 0), 0);
  const totalRevenue = allReports.reduce((s, r) => s + (r.revenue || 0), 0);
  const totalSales = allReports.reduce((s, r) => s + (r.sales || 0), 0);

  // Konversiya: Sotuv / Sifatli Lid (Admin va Employee bilan bir xil formula)
  const overallConversion = monthQualityLeads > 0
    ? Math.round((totalSales / monthQualityLeads) * 1000) / 10
    : 0;
  // Lid-to-Call ratio (alohida ko'rsatkich sifatida)
  const leadToCallRatio = monthTotalCalls > 0
    ? Math.round((monthQualityLeads / monthTotalCalls) * 1000) / 10
    : 0;

  // Revenue efficiency metrics
  const revenuePerCall = monthTotalCalls > 0 ? Math.round(totalRevenue / monthTotalCalls) : 0;
  const revenuePerEmployee = totalEmployees > 0 ? Math.round(totalRevenue / totalEmployees) : 0;
  const revenuePerSale = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;
  const netProfit = totalRevenue - (totalSalaryFund + monthBonuses - monthPenalties);
  const payrollToRevenueRatio = totalRevenue > 0 ? Math.round(((totalSalaryFund + monthBonuses - monthPenalties) / totalRevenue) * 100) : 0;

  // Avg calls per employee per day
  const daysCount = daysParam && daysParam !== 'all' ? parseInt(daysParam) : 30;
  const avgCallsPerEmployeePerDay = totalEmployees > 0 && daysCount > 0
    ? Math.round(monthTotalCalls / totalEmployees / daysCount)
    : 0;

  // top sales org
  const topSalesOrg = allOrgs.map(org => {
    const orgEmps = org.users.filter(u => u.role === 'EMPLOYEE');
    const orgReports = orgEmps.flatMap(e => e.dailyReports);
    const revenue = orgReports.reduce((s, r) => s + (r.revenue || 0), 0);
    return { name: org.name, revenue, id: org.id };
  }).filter(o => o.revenue > 0).sort((a, b) => b.revenue - a.revenue)[0] || null;

  // ─── Subscription distribution ───────────────────────────────────────────────
  const subscriptionDist = {
    FREE: allOrgs.filter(o => o.subscriptionPlan === 'FREE').length,
    BASIC: allOrgs.filter(o => o.subscriptionPlan === 'BASIC').length,
    PREMIUM: allOrgs.filter(o => o.subscriptionPlan === 'PREMIUM').length,
  };

  // ─── Operator stats ───────────────────────────────────────────────────────────
  const operatorStats = employees.map(emp => {
    const empReports = emp.dailyReports;
    const empTotalCalls = empReports.reduce((s, r) => s + r.totalCalls, 0);
    const empIncoming = empReports.reduce((s, r) => s + (r.incomingCalls || 0), 0);
    const empOutgoing = empReports.reduce((s, r) => s + (r.outgoingCalls || 0), 0);
    const empQualityLeads = empReports.reduce((s, r) => s + r.qualityLeads, 0);
    const empNonQualityLeads = empReports.reduce((s, r) => s + r.nonQualityLeads, 0);
    const empOfficeVisits = empReports.reduce((s, r) => s + (r.officeVisits || 0), 0);
    const empRevenue = empReports.reduce((s, r) => s + (r.revenue || 0), 0);
    const empSales = empReports.reduce((s, r) => s + (r.sales || 0), 0);
    // Konversiya: Sotuv / Sifatli Lid (barcha rollar uchun bir xil)
    const empConversion = empQualityLeads > 0 ? Math.round((empSales / empQualityLeads) * 1000) / 10 : 0;
    const empRevenuePerCall = empTotalCalls > 0 ? Math.round(empRevenue / empTotalCalls) : 0;

    // KPI stats for this employee
    const empKpis = emp.kpis;
    const empAvgKpi = empKpis.length > 0
      ? Math.round(empKpis.reduce((s, k) => s + (k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0), 0) / empKpis.length)
      : 0;

    return {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      orgId: emp.organizationId,
      totalCalls: empTotalCalls,
      incomingCalls: empIncoming,
      outgoingCalls: empOutgoing,
      qualityLeads: empQualityLeads,
      nonQualityLeads: empNonQualityLeads,
      officeVisits: empOfficeVisits,
      conversion: empConversion,
      revenue: empRevenue,
      revenuePerCall: empRevenuePerCall,
      sales: empSales,
      avgKpi: empAvgKpi,
    };
  }).sort((a, b) => b.qualityLeads - a.qualityLeads);

  // ─── Org efficiency ───────────────────────────────────────────────────────────
  const orgDetails = allOrgs.map(org => {
    const orgEmps = org.users.filter(u => u.role === 'EMPLOYEE');
    const orgAdmins = org.users.filter(u => u.role === 'ADMIN');
    const orgKpis = orgEmps.flatMap(e => e.kpis);
    const orgPenalties = orgEmps.reduce((s, e) => s + e.penaltyRecords.reduce((ps, p) => ps + p.amount, 0), 0);
    const orgBonuses = orgEmps.reduce((s, e) => s + e.bonusRecords.reduce((bs, b) => bs + b.amount, 0), 0);
    const orgReports = orgEmps.flatMap(e => e.dailyReports);
    const orgAttendances = orgEmps.flatMap(e => e.attendances);
    const orgSalaryFund = orgEmps.reduce((s, e) => s + (e.fixedSalary || 0), 0);
    const orgTotalCalls = orgReports.reduce((s, r) => s + r.totalCalls, 0);
    const orgIncoming = orgReports.reduce((s, r) => s + (r.incomingCalls || 0), 0);
    const orgOutgoing = orgReports.reduce((s, r) => s + (r.outgoingCalls || 0), 0);
    const orgQualityLeads = orgReports.reduce((s, r) => s + r.qualityLeads, 0);
    const orgRevenue = orgReports.reduce((s, r) => s + (r.revenue || 0), 0);
    const orgSales = orgReports.reduce((s, r) => s + (r.sales || 0), 0);
    const orgOfficeVisits = orgReports.reduce((s, r) => s + (r.officeVisits || 0), 0);
    const orgAvgKpi = orgKpis.length > 0
      ? Math.round(orgKpis.reduce((s, k) => s + (k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0), 0) / orgKpis.length)
      : 0;
    const orgNetProfit = orgRevenue - (orgSalaryFund + orgBonuses - orgPenalties);
    const orgRevenuePerEmp = orgEmps.length > 0 ? Math.round(orgRevenue / orgEmps.length) : 0;
    const orgCapacityUsed = org.maxEmployees > 0 ? Math.round((orgEmps.length / org.maxEmployees) * 100) : 0;

    return {
      id: org.id,
      name: org.name,
      status: org.status,
      phone: org.phone,
      subscriptionPlan: org.subscriptionPlan,
      maxEmployees: org.maxEmployees,
      createdAt: org.createdAt,
      employeeCount: orgEmps.length,
      adminCount: orgAdmins.length,
      avgKpi: orgAvgKpi,
      penalties: orgPenalties,
      bonuses: orgBonuses,
      salaryFund: orgSalaryFund,
      totalCalls: orgTotalCalls,
      incomingCalls: orgIncoming,
      outgoingCalls: orgOutgoing,
      qualityLeads: orgQualityLeads,
      officeVisits: orgOfficeVisits,
      revenue: orgRevenue,
      sales: orgSales,
      netProfit: orgNetProfit,
      revenuePerEmployee: orgRevenuePerEmp,
      capacityUsed: orgCapacityUsed,
      attendanceCount: orgAttendances.length,
      lateCount: orgAttendances.filter(a => a.isLate).length,
    };
  });

  return NextResponse.json({
    dateRange: {
      days: daysParam || 'month',
      from: dateFrom ? dateFrom.toISOString() : startOfMonth.toISOString(),
      to: now.toISOString(),
    },
    global: { totalOrgs, activeOrgs, frozenOrgs, totalEmployees, totalAdmins, newToday },
    financial: { totalSalaryFund, monthBonuses, monthPenalties, avgSalary, netProfit, payrollToRevenueRatio },
    kpi: { avgKpiCompletion, kpiAchieved, kpiNotAchieved, kpiOverAchieved, totalActiveKpis, bestKpiOrg, worstKpiOrg },
    sales: {
      monthQualityLeads, monthNonQualityLeads, monthTotalCalls,
      totalIncomingCalls, totalOutgoingCalls, totalOfficeVisits,
      overallConversion, leadToCallRatio, totalRevenue, totalSales,
      revenuePerCall, revenuePerEmployee, revenuePerSale,
      avgCallsPerEmployeePerDay, topSalesOrg,
    },
    subscriptionDist,
    operatorStats,
    organizations: orgDetails,
  });
}
