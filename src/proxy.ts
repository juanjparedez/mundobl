import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const session = await auth();

    if (!session) {
      return NextResponse.redirect(new URL('/api/auth/signin', request.url));
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
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
