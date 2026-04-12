import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET — xodim o'zining, admin tashkilotning barcha feedback'larini oladi
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // TAKLIF yoki SHIKOYAT
  const status = searchParams.get('status'); // YANGI, KORILDI, HAL_QILINDI
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  let where = {};

  if (session.user.role === 'EMPLOYEE') {
    where.userId = session.user.id;
  } else if (session.user.role === 'ADMIN') {
    where.user = { organizationId: session.user.organizationId };
  }
  // SUPERADMIN — hamma

  if (type) where.type = type;
  if (status) where.status = status;

  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }

  const page = searchParams.has('page') ? Math.max(1, parseInt(searchParams.get('page')) || 1) : null;
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit')) || 15));
  const skip = page ? (page - 1) * limit : 0;

  const [feedbacks, total] = await Promise.all([
    prisma.customerFeedback.findMany({
      where,
      include: { user: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
      skip,
      take: page ? limit : 200,
    }),
    page ? prisma.customerFeedback.count({ where }) : Promise.resolve(0),
  ]);

  if (page) {
    return NextResponse.json({
      data: feedbacks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }

  return NextResponse.json(feedbacks);
}

// POST — xodim yangi taklif/shikoyat yozadi
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'EMPLOYEE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type, customerName, customerPhone, message, category } = await request.json();

    if (!type || !['TAKLIF', 'SHIKOYAT'].includes(type)) {
      return NextResponse.json({ error: 'Turi TAKLIF yoki SHIKOYAT bo\'lishi kerak' }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Xabar yozilishi shart' }, { status: 400 });
    }

    const feedback = await prisma.customerFeedback.create({
      data: {
        userId: session.user.id,
        type,
        customerName: customerName?.trim() || null,
        customerPhone: customerPhone?.trim() || null,
        message: message.trim(),
        category: category || 'Boshqa',
        status: 'YANGI',
      },
      include: { user: { select: { name: true } } },
    });

    return NextResponse.json(feedback);
  } catch (err) {
    return NextResponse.json({ error: 'Feedback saqlashda xatolik' }, { status: 500 });
  }
}

// PATCH — admin status o'zgartiradi yoki izoh yozadi
export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, status, adminNote } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID kerak' }, { status: 400 });

    // Org boundary check
    if (session.user.role === 'ADMIN') {
      const feedback = await prisma.customerFeedback.findUnique({
        where: { id },
        include: { user: { select: { organizationId: true } } },
      });
      if (!feedback || feedback.user.organizationId !== session.user.organizationId) {
        return NextResponse.json({ error: 'Topilmadi' }, { status: 404 });
      }
    }

    const data = {};
    if (status && ['YANGI', 'KORILDI', 'HAL_QILINDI'].includes(status)) data.status = status;
    if (adminNote !== undefined) data.adminNote = adminNote;

    const updated = await prisma.customerFeedback.update({
      where: { id },
      data,
      include: { user: { select: { name: true } } },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Yangilashda xatolik' }, { status: 500 });
  }
}

// PUT — xodim o'z feedbackini tahrirlaydi
export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'EMPLOYEE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, type, customerName, customerPhone, message, category } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID kerak' }, { status: 400 });
    if (!message || !message.trim()) return NextResponse.json({ error: 'Xabar yozilishi shart' }, { status: 400 });

    const existing = await prisma.customerFeedback.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Topilmadi' }, { status: 404 });
    }

    const updated = await prisma.customerFeedback.update({
      where: { id },
      data: {
        ...(type && ['TAKLIF', 'SHIKOYAT'].includes(type) && { type }),
        customerName: customerName?.trim() || null,
        customerPhone: customerPhone?.trim() || null,
        message: message.trim(),
        ...(category && { category }),
      },
      include: { user: { select: { name: true } } },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Tahrirlashda xatolik' }, { status: 500 });
  }
}

// DELETE — xodim o'z feedbackini o'chiradi
export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID kerak' }, { status: 400 });

  const existing = await prisma.customerFeedback.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 });

  // Xodim faqat o'zinikini, admin tashkilotinikini o'chira oladi
  if (session.user.role === 'EMPLOYEE' && existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }
  if (session.user.role === 'ADMIN') {
    const user = await prisma.user.findUnique({ where: { id: existing.userId }, select: { organizationId: true } });
    if (!user || user.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
    }
  }

  await prisma.customerFeedback.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
