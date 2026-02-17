import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logPageView } from '@/lib/access-log';
import { prisma } from '@/lib/database';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extraer info para logging
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
  const userAgent = request.headers.get('user-agent') || null;

  // Check IP ban
  if (ip) {
    const bannedIp = await prisma.bannedIp.findUnique({ where: { ip } });
    if (bannedIp) {
      return new NextResponse('Acceso denegado', { status: 403 });
    }
  }

  if (pathname.startsWith('/admin')) {
    const session = await auth();

    if (!session) {
      return NextResponse.redirect(new URL('/api/auth/signin', request.url));
    }

    // Check user ban
    if (session.user?.banned) {
      return new NextResponse('Tu cuenta ha sido suspendida', { status: 403 });
    }

    const role = session.user?.role;

    // Rutas de crear/editar series y seasons: Admin + Moderator
    const isEditRoute =
      pathname === '/admin/series/nueva' ||
      /^\/admin\/series\/\d+\/editar$/.test(pathname) ||
      /^\/admin\/seasons\/\d+\/editar$/.test(pathname);

    if (isEditRoute) {
      if (role !== 'ADMIN' && role !== 'MODERATOR') {
        return NextResponse.redirect(new URL('/catalogo', request.url));
      }
    } else {
      // Resto de /admin/* (listados, CRUD entidades, usuarios): solo Admin
      if (role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/catalogo', request.url));
      }
    }

    // Log page view (fire-and-forget)
    logPageView(pathname, ip, userAgent, session.user?.id || null);
  } else {
    // Paginas publicas: loguear con session si existe
    const session = await auth();

    // Check user ban
    if (session?.user?.banned) {
      return new NextResponse('Tu cuenta ha sido suspendida', { status: 403 });
    }

    logPageView(pathname, ip, userAgent, session?.user?.id || null);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Todas las paginas excepto assets estaticos, API routes e internos de Next
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
