import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { generateEmployeeLogin, generatePassword } from '@/lib/credentials';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit')) || 50));
  const skip = (page - 1) * limit;

  const where = session.user.role === 'ADMIN'
    ? { organizationId: session.user.organizationId }
    : session.user.role === 'EMPLOYEE'
      ? { id: session.user.id }
      : {};

  const fullWhere = { ...where, role: 'EMPLOYEE' };

  const [employees, total] = await Promise.all([
    prisma.user.findMany({
      where: fullWhere,
      include: {
        kpis: true,
        penaltyRecords: true,
        bonusRecords: true,
        dailyReports: { include: { leadStatuses: true } },
        attendances: { orderBy: { date: 'desc' }, take: 30 },
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where: fullWhere }),
  ]);

  const lateCounts = employees.length > 0
    ? await prisma.attendance.groupBy({
        by: ['userId'],
        where: {
          userId: { in: employees.map(employee => employee.id) },
          isLate: true,
        },
        _count: { _all: true },
      })
    : [];

  const lateCountMap = Object.fromEntries(lateCounts.map(item => [item.userId, item._count._all]));

  const enrichedEmployees = employees.map(employee => {
    const lateAttendanceCount = lateCountMap[employee.id] || 0;
    const latenessState = lateAttendanceCount === 0
      ? 'NORMAL'
      : lateAttendanceCount < 3
        ? 'WARNING'
        : 'PENALTY';

    return {
      ...employee,
      lateAttendanceCount,
      latenessState,
      latenessMessage: lateAttendanceCount === 0
        ? 'Kechikish qayd etilmagan'
        : lateAttendanceCount < 3
          ? `${lateAttendanceCount}-kechikish. Hozircha ogohlantirish.`
          : `${lateAttendanceCount}-kechikish. Jarima qo'llanadi.`,
    };
  });

  if (searchParams.has('page')) {
    return NextResponse.json({
      data: enrichedEmployees,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }

  return NextResponse.json(enrichedEmployees);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, fixedSalary, workStartTime, workEndTime, latenessPenalty, latenessThreshold, reportSubmissionThreshold, locationLat, locationLng, locationRadius, kpis } = body;

  if (!name || !name.trim()) return NextResponse.json({ error: 'Xodim ismi kerak' }, { status: 400 });
  if (name.trim().length < 2) return NextResponse.json({ error: 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak' }, { status: 400 });

  // Get org name for login generation
  const org = await prisma.organization.findUnique({ where: { id: session.user.organizationId } });
  const orgName = org?.name || 'org';

  // Auto-generate credentials from employee name
  const email = await generateEmployeeLogin(name, orgName);
  const password = generatePassword(name);
  const hashedPassword = await hash(password, 10);

  const now = new Date();

  const parsedLatenessThreshold = latenessThreshold === undefined || latenessThreshold === null || latenessThreshold === ''
    ? 15
    : parseInt(latenessThreshold);
  const parsedReportSubmissionThreshold = reportSubmissionThreshold === undefined || reportSubmissionThreshold === null || reportSubmissionThreshold === ''
    ? 15
    : parseInt(reportSubmissionThreshold);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'EMPLOYEE',
      organizationId: session.user.organizationId,
      fixedSalary: parseFloat(fixedSalary) || 0,
      workStartTime: workStartTime || '09:00',
      workEndTime: workEndTime || '18:00',
      latenessPenalty: parseFloat(latenessPenalty) || 0,
      latenessThreshold: Number.isNaN(parsedLatenessThreshold) ? 15 : parsedLatenessThreshold,
      reportSubmissionThreshold: Number.isNaN(parsedReportSubmissionThreshold) ? 15 : parsedReportSubmissionThreshold,
      locationLat: locationLat ? parseFloat(locationLat) : null,
      locationLng: locationLng ? parseFloat(locationLng) : null,
      locationRadius: locationRadius ? parseFloat(locationRadius) : null,
      kpis: kpis?.length ? {
        create: kpis.filter(k => k.name && k.targetValue).map(k => ({
          name: k.name,
          targetValue: parseFloat(k.targetValue) || 0,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        })),
      } : undefined,
    },
    include: { kpis: true },
  });

  return NextResponse.json({
    ...user,
    generatedCredentials: {
      login: email,
      password: password,
    },
  });
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, kpis: _kpis, ...raw } = body;

  if (!id) return NextResponse.json({ error: 'ID kerak' }, { status: 400 });

  const employee = await prisma.user.findUnique({ where: { id }, select: { organizationId: true } });
  if (!employee || employee.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: 'Xodim topilmadi' }, { status: 404 });
  }

  // Safely parse numeric fields
  const data = {
    ...raw,
    fixedSalary: raw.fixedSalary !== undefined ? parseFloat(raw.fixedSalary) || 0 : undefined,
    latenessPenalty: raw.latenessPenalty !== undefined ? parseFloat(raw.latenessPenalty) || 0 : undefined,
    latenessThreshold: raw.latenessThreshold !== undefined ? (raw.latenessThreshold === '' ? 15 : parseInt(raw.latenessThreshold)) : undefined,
    reportSubmissionThreshold: raw.reportSubmissionThreshold !== undefined ? (raw.reportSubmissionThreshold === '' ? 15 : parseInt(raw.reportSubmissionThreshold)) : undefined,
    locationLat: raw.locationLat !== undefined ? (raw.locationLat ? parseFloat(raw.locationLat) : null) : undefined,
    locationLng: raw.locationLng !== undefined ? (raw.locationLng ? parseFloat(raw.locationLng) : null) : undefined,
    locationRadius: raw.locationRadius !== undefined ? (raw.locationRadius ? parseFloat(raw.locationRadius) : null) : undefined,
  };
  if (Number.isNaN(data.latenessThreshold)) data.latenessThreshold = 15;
  if (Number.isNaN(data.reportSubmissionThreshold)) data.reportSubmissionThreshold = 15;
  // Remove undefined keys
  Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);

  const user = await prisma.user.update({ where: { id }, data });
  return NextResponse.json(user);
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID kerak' }, { status: 400 });

    const employee = await prisma.user.findUnique({ where: { id }, select: { organizationId: true, role: true } });
    if (!employee || employee.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Xodim topilmadi' }, { status: 404 });
    }
    if (employee.role === 'ADMIN') {
      return NextResponse.json({ error: 'Admin foydalanuvchini o\'chirish mumkin emas' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Xodim o\'chirishda xatolik' }, { status: 500 });
  }
}
