import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { organization: true },
  });

  return NextResponse.json(adminUser);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { organizationName, name, email, workStartTime, workEndTime, latenessPenalty, latenessThreshold, reportSubmissionThreshold } = await request.json();

    if (!name || !name.trim()) return NextResponse.json({ error: 'Ism kerak' }, { status: 400 });
    if (!email || !email.trim()) return NextResponse.json({ error: 'Email kerak' }, { status: 400 });

    if (workStartTime && !/^\d{2}:\d{2}$/.test(workStartTime)) {
      return NextResponse.json({ error: 'Ish boshlanish vaqti formati noto\'g\'ri (HH:MM)' }, { status: 400 });
    }
    if (workEndTime && !/^\d{2}:\d{2}$/.test(workEndTime)) {
      return NextResponse.json({ error: 'Ish tugash vaqti formati noto\'g\'ri (HH:MM)' }, { status: 400 });
    }

    // Update organization
    if (session.user.organizationId && organizationName) {
      await prisma.organization.update({
        where: { id: session.user.organizationId },
        data: { name: organizationName.trim() },
      });
    }

    // Check email uniqueness (if changed)
    if (email !== session.user.email) {
      const emailExists = await prisma.user.findUnique({ where: { email: email.trim() } });
      if (emailExists) return NextResponse.json({ error: 'Bu email allaqachon band' }, { status: 400 });
    }

    // Update user default settings
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        email: email.trim(),
        workStartTime,
        workEndTime,
        latenessPenalty: Number(latenessPenalty) || 0,
        latenessThreshold: Number(latenessThreshold) || 0,
        reportSubmissionThreshold: Number(reportSubmissionThreshold) || 0,
      },
      include: { organization: true },
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    return NextResponse.json({ error: 'Sozlamalar saqlashda xatolik' }, { status: 500 });
  }
}
