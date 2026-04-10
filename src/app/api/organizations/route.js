import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { generateUniqueLogin, generatePassword } from '@/lib/credentials';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizations = await prisma.organization.findMany({
    include: {
      _count: { select: { users: true } },
      users: {
        include: {
          kpis: true,
          penaltyRecords: true,
          bonusRecords: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(organizations);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { orgName, orgAddress, orgPhone, adminName, description, maxEmployees, subscriptionPlan } = body;
  const parsedMaxEmployees = maxEmployees === undefined || maxEmployees === null || maxEmployees === ''
    ? 50
    : Number(maxEmployees);

  if (!orgName || !orgName.trim()) {
    return NextResponse.json({ error: 'Tashkilot nomi kerak' }, { status: 400 });
  }
  if (!adminName || !adminName.trim()) {
    return NextResponse.json({ error: 'Admin ismi kerak' }, { status: 400 });
  }
  if (orgName.trim().length < 2) {
    return NextResponse.json({ error: 'Tashkilot nomi kamida 2 ta belgidan iborat bo\'lishi kerak' }, { status: 400 });
  }
  if (orgPhone && !/^[+\d\s()-]{5,20}$/.test(orgPhone)) {
    return NextResponse.json({ error: 'Telefon raqami formati noto\'g\'ri' }, { status: 400 });
  }

  const adminEmail = await generateUniqueLogin(adminName || orgName);
  const adminPassword = generatePassword(adminName || orgName);

  const org = await prisma.organization.create({
    data: {
      name: orgName,
      address: orgAddress || '',
      phone: orgPhone || '',
      description: description || '',
      maxEmployees: Number.isNaN(parsedMaxEmployees) ? 50 : parsedMaxEmployees,
      subscriptionPlan: subscriptionPlan || 'BASIC',
      status: 'ACTIVE',
    },
  });

  const hashedPassword = await hash(adminPassword, 10);
  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  return NextResponse.json({
    ...org,
    generatedCredentials: {
      login: adminEmail,
      password: adminPassword,
    },
  });
}

// Edit organization
export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, address, phone, description, maxEmployees, subscriptionPlan } = body;
  const parsedMaxEmployees = maxEmployees === undefined || maxEmployees === null || maxEmployees === ''
    ? undefined
    : Number(maxEmployees);

  if (!id) {
    return NextResponse.json({ error: 'ID kerak' }, { status: 400 });
  }
  if (name !== undefined && (!name || name.trim().length < 2)) {
    return NextResponse.json({ error: 'Tashkilot nomi kamida 2 ta belgidan iborat bo\'lishi kerak' }, { status: 400 });
  }
  if (phone !== undefined && phone && !/^[+\d\s()-]{5,20}$/.test(phone)) {
    return NextResponse.json({ error: 'Telefon raqami formati noto\'g\'ri' }, { status: 400 });
  }

  const existing = await prisma.organization.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'Tashkilot topilmadi' }, { status: 404 });

  const updated = await prisma.organization.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(phone !== undefined && { phone }),
      ...(description !== undefined && { description }),
      ...(parsedMaxEmployees !== undefined && !Number.isNaN(parsedMaxEmployees) && { maxEmployees: parsedMaxEmployees }),
      ...(subscriptionPlan !== undefined && { subscriptionPlan }),
    },
  });

  return NextResponse.json(updated);
}

// Freeze/Unfreeze/Delete organization
export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, action, reason } = body;

  if (!id || !action) {
    return NextResponse.json({ error: 'ID va action kerak' }, { status: 400 });
  }

  let data = {};
  switch (action) {
    case 'FREEZE':
      data = { status: 'FROZEN', frozenAt: new Date(), frozenReason: reason || '' };
      break;
    case 'UNFREEZE':
      data = { status: 'ACTIVE', frozenAt: null, frozenReason: null };
      break;
    case 'DELETE':
      data = { status: 'DELETED' };
      break;
    case 'RESTORE':
      data = { status: 'ACTIVE' };
      break;
    default:
      return NextResponse.json({ error: 'Noma\'lum action' }, { status: 400 });
  }

  const updated = await prisma.organization.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID kerak' }, { status: 400 });

  const org = await prisma.organization.findUnique({ where: { id }, select: { status: true, _count: { select: { users: true } } } });
  if (!org) return NextResponse.json({ error: 'Tashkilot topilmadi' }, { status: 404 });

  if (org.status !== 'DELETED') {
    return NextResponse.json({ error: 'Faqat DELETED statusdagi tashkilotni butunlay o\'chirish mumkin. Avval PATCH orqali o\'chiring.' }, { status: 400 });
  }

  await prisma.organization.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
