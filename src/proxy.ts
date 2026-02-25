import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logPageView } from '@/lib/access-log';
import { prisma } from '@/lib/database';

// Patrones de paths que solo buscan scanners de vulnerabilidades
const SCANNER_PATTERNS = [
  /\.php/i,
  /\/wp-/i,
  /\/wordpress/i,
  /\/\.env/i,
  /\/\.git/i,
  /\/\.aws/i,
  /\/\.docker/i,
  /\/cgi-bin/i,
  /\/phpmyadmin/i,
  /\/myadmin/i,
  /\/mysql/i,
  /\/adminer/i,
  /\/phpinfo/i,
  /\/xmlrpc/i,
  /\/config\.(json|yml|yaml|xml|bak|old)/i,
  /\/backup/i,
  /\/debug/i,
  /\/shell/i,
  /\/eval/i,
  /\/exec/i,
  /\/cmd/i,
  /\/console/i,
  /\/actuator/i,
  /\/api\/v1\/pods/i,
  /\/solr/i,
  /\/struts/i,
  /\/jenkins/i,
  /\/\.well-known\/security\.txt/i,
];

// Paths de assets/PWA que no necesitan logging
const ASSET_PATTERNS = [
  /^\/icons\//,
  /^\/manifest\.webmanifest$/,
  /^\/sw\.js$/,
  /^\/robots\.txt$/,
  /^\/sitemap/,
];

function isScannerPath(pathname: string): boolean {
  return SCANNER_PATTERNS.some((pattern) => pattern.test(pathname));
}

function isAssetPath(pathname: string): boolean {
  return ASSET_PATTERNS.some((pattern) => pattern.test(pathname));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bloquear scanners antes de cualquier procesamiento (no loguear, no gastar DB)
  if (isScannerPath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  // Extraer IP real del cliente (CF-Connecting-IP con Cloudflare, fallback a x-forwarded-for)
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null;
  const userAgent = request.headers.get('user-agent') || null;

  // No loguear assets/PWA
  if (isAssetPath(pathname)) {
    return NextResponse.next();
  }

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
