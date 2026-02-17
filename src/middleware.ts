import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/api/auth/signin', req.url));
    }

    const role = session.user?.role;

    // Rutas de crear/editar series y seasons: Admin + Moderator
    const isEditRoute =
      pathname === '/admin/series/nueva' ||
      /^\/admin\/series\/\d+\/editar$/.test(pathname) ||
      /^\/admin\/seasons\/\d+\/editar$/.test(pathname);

    if (isEditRoute) {
      if (role !== 'ADMIN' && role !== 'MODERATOR') {
        return NextResponse.redirect(new URL('/catalogo', req.url));
      }
    } else {
      // Resto de /admin/* (listados, CRUD entidades, usuarios): solo Admin
      if (role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/catalogo', req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};
