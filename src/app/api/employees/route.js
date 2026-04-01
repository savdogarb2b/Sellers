import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { generateEmployeeLogin, generatePassword } from '@/lib/credentials';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const where = session.user.role === 'ADMIN' ? { organizationId: session.user.organizationId } : {};

  const employees = await prisma.user.findMany({
    where: { ...where, role: 'EMPLOYEE' },
    include: {
      kpis: true,
      penaltyRecords: true,
      bonusRecords: true,
      dailyReports: { include: { leadStatuses: true } },
      attendances: { orderBy: { date: 'desc' }, take: 30 },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(employees);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, fixedSalary, workStartTime, workEndTime, latenessPenalty, latenessThreshold, locationLat, locationLng, locationRadius, kpis } = body;

  if (!name) return NextResponse.json({ error: 'Xodim ismi kerak' }, { status: 400 });

  // Get org name for login generation
  const org = await prisma.organization.findUnique({ where: { id: session.user.organizationId } });
  const orgName = org?.name || 'org';

  // Auto-generate credentials from employee name
  const email = await generateEmployeeLogin(name, orgName);
  const password = generatePassword(name);
  const hashedPassword = await hash(password, 10);

  const now = new Date();

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
      latenessThreshold: parseInt(latenessThreshold) || 15,
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

  // Safely parse numeric fields
  const data = {
    ...raw,
    fixedSalary: raw.fixedSalary !== undefined ? parseFloat(raw.fixedSalary) || 0 : undefined,
    latenessPenalty: raw.latenessPenalty !== undefined ? parseFloat(raw.latenessPenalty) || 0 : undefined,
    latenessThreshold: raw.latenessThreshold !== undefined ? parseInt(raw.latenessThreshold) || 15 : undefined,
    locationLat: raw.locationLat !== undefined ? (raw.locationLat ? parseFloat(raw.locationLat) : null) : undefined,
    locationLng: raw.locationLng !== undefined ? (raw.locationLng ? parseFloat(raw.locationLng) : null) : undefined,
    locationRadius: raw.locationRadius !== undefined ? (raw.locationRadius ? parseFloat(raw.locationRadius) : null) : undefined,
  };
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

  const { searchParams } = new URL(request.url);
  await prisma.user.delete({ where: { id: searchParams.get('id') } });
  return NextResponse.json({ success: true });
}
