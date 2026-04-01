import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET || 'salescrm-super-secret-key-2024' });
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname === '/' || pathname === '/login' || pathname.startsWith('/api/auth')) {
    if (token && (pathname === '/login' || pathname === '/')) {
      const redirectUrl = token.role === 'SUPERADMIN' ? '/superadmin' : 
                         token.role === 'ADMIN' ? '/admin' : '/employee';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    return NextResponse.next();
  }

  // Protect all routes
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based access
  if (pathname.startsWith('/superadmin') && token.role !== 'SUPERADMIN') {
    const redirectUrl = token.role === 'ADMIN' ? '/admin' : '/employee';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  if (pathname.startsWith('/admin') && token.role !== 'ADMIN') {
    const redirectUrl = token.role === 'SUPERADMIN' ? '/superadmin' : '/employee';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  if (pathname.startsWith('/employee') && token.role !== 'EMPLOYEE') {
    const redirectUrl = token.role === 'SUPERADMIN' ? '/superadmin' : '/admin';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Check frozen organization for admin/employee
  if ((token.role === 'ADMIN' || token.role === 'EMPLOYEE') && token.orgStatus === 'FROZEN') {
    if (!pathname.startsWith('/frozen')) {
      return NextResponse.redirect(new URL('/frozen', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/superadmin/:path*',
    '/admin/:path*',
    '/employee/:path*',
    '/login',
    '/frozen',
    '/',
  ],
};
