import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hash, compare } from 'bcryptjs';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Barcha maydonlar to\'ldirilishi shart' }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Yangi parol kamida 8 ta belgidan iborat bo\'lishi kerak' }, { status: 400 });
  }

  if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return NextResponse.json({ error: 'Parolda kamida 1 ta katta harf, 1 ta kichik harf va 1 ta raqam bo\'lishi kerak' }, { status: 400 });
  }

  // Get user from DB
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 });
  }

  // Verify current password
  const isValid = await compare(currentPassword, user.password);
  if (!isValid) {
    return NextResponse.json({ error: 'Joriy parol noto\'g\'ri' }, { status: 400 });
  }

  // Hash new password and update
  const hashedPassword = await hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ success: true, message: 'Parol muvaffaqiyatli o\'zgartirildi' });
}
