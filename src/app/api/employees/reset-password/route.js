import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { generatePassword } from '@/lib/credentials';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 401 });
  }

  const { id } = await request.json();
  
  if (!id) {
    return NextResponse.json({ error: 'Xodim ID si kiritilmagan' }, { status: 400 });
  }

  const employee = await prisma.user.findFirst({
    where: { 
      id,
      organizationId: session.user.organizationId,
      role: 'EMPLOYEE'
    }
  });

  if (!employee) {
    return NextResponse.json({ error: 'Xodim topilmadi yoki bu xodimga ruxsatingiz yo\'q' }, { status: 404 });
  }

  // Generate new password
  const newPassword = generatePassword(employee.name);
  const hashedPassword = await hash(newPassword, 10);

  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });

  return NextResponse.json({
    success: true,
    newPassword,
    login: employee.email,
    empName: employee.name
  });
}
