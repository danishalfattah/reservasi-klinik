import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

const ROLE_DASHBOARD: Record<string, string> = {
  PASIEN: '/pasien/reservations',
  DOKTER: '/dokter',
  ADMIN: '/admin',
};

function redirectToRoleDashboard(role: string, baseUrl: string): NextResponse {
  const path = ROLE_DASHBOARD[role] ?? '/login';
  return NextResponse.redirect(new URL(path, baseUrl));
}

function getRequiredRole(pathname: string): string | null {
  if (pathname.startsWith('/pasien')) return 'PASIEN';
  if (pathname.startsWith('/dokter')) return 'DOKTER';
  if (pathname.startsWith('/admin')) return 'ADMIN';
  return null;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const requiredRole = getRequiredRole(pathname);
  if (!requiredRole) return NextResponse.next();

  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = await verifyToken(token);
    const role = payload.role as string;

    if (role !== requiredRole) {
      return redirectToRoleDashboard(role, request.url);
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

// Konfigurasi matcher
export const config = {
  matcher: ['/pasien/:path*', '/dokter/:path*', '/admin/:path*'],
};
