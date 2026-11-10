import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { Role } from '@prisma/client';
import {
  ADMIN_GATE_IP_HEADER,
  ADMIN_GATE_KEY_HEADER,
  ADMIN_GATE_LOG_HEADER,
  ADMIN_GATE_PATH_HEADER,
  SCANNER_HIT_ROUTE,
} from '@/lib/admin-gate-headers';
import { isScannerPath } from '@/lib/scanner-paths';

/**
 * Proxy de /admin, sin base de datos.
 *
 * Antes importaba Prisma (ban por IP, log de visitas) y `auth()` (que arrastra
 * el adapter de Prisma). En Cloudflare Workers el proxy se empaqueta aparte y
 * eso duplicaba el cliente de Prisma: ~2 MB comprimidos de los 10 MB que
 * admite un Worker. Ahora:
 * - La sesion se lee del JWT firmado (`getToken`, la misma cookie que
 *   `auth()`); el rol y el ban viajan en el token (ver callbacks.jwt en
 *   src/lib/auth.ts, que los refresca contra la base).
 * - El ban por IP y el log de visita los hace el layout de /admin
 *   (src/app/(app)/admin/layout.tsx) con los datos que este proxy le pasa en
 *   headers.
 */

const BOT_UA_PATTERN =
  /bot|crawler|spider|slurp|bingpreview|google web preview|facebookexternalhit|whatsapp|telegrambot|discordbot/i;

interface AdminToken {
  role?: Role;
  banned?: boolean;
}

/** CF-Connecting-IP con Cloudflare; x-forwarded-for como respaldo. */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    ''
  );
}

function isPrefetchRequest(request: NextRequest): boolean {
  return (
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('next-router-prefetch') === '1'
  );
}

/** Rutas de /admin que tambien habilita MODERATOR, no solo ADMIN. */
function isModeratorAllowedRoute(pathname: string): boolean {
  return (
    pathname === '/admin/series/nueva' ||
    /^\/admin\/series\/\d+$/.test(pathname) ||
    /^\/admin\/series\/\d+\/editar$/.test(pathname) ||
    /^\/admin\/seasons\/\d+\/editar$/.test(pathname) ||
    // Soporte de colaboradores: canal colaborador <-> admins/moderadores.
    /^\/admin\/soporte(\/\d+)?$/.test(pathname)
  );
}

/** A donde mandar a este rol, o null si puede ver la ruta. */
function redirectForRole(pathname: string, role: Role | undefined) {
  // Admin reducido para colaboradores externos: solo /admin/colaborador/**
  // (docs/ai-context/context.md "Rol de colaborador externo").
  if (pathname.startsWith('/admin/colaborador')) {
    return role === 'ADMIN' || role === 'COLLABORATOR' ? null : '/catalogo';
  }
  if (role === 'COLLABORATOR') return '/admin/colaborador';
  if (isModeratorAllowedRoute(pathname)) {
    return role === 'ADMIN' || role === 'MODERATOR' ? null : '/catalogo';
  }
  return role === 'ADMIN' ? null : '/catalogo';
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // El 404 y el registro del intento (con su IP, para poder bloquearla
  // desde /admin) los resuelve una ruta interna: el proxy no toca la base.
  if (isScannerPath(pathname)) {
    const headers = new Headers(request.headers);
    headers.set(ADMIN_GATE_PATH_HEADER, pathname);
    headers.set(ADMIN_GATE_IP_HEADER, getClientIp(request));
    headers.set(ADMIN_GATE_KEY_HEADER, process.env.AUTH_SECRET ?? '');
    return NextResponse.rewrite(new URL(SCANNER_HIT_ROUTE, request.url), {
      request: { headers },
    });
  }

  const token = (await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: request.nextUrl.protocol === 'https:',
  })) as AdminToken | null;

  if (!token) {
    return NextResponse.redirect(new URL('/api/auth/signin', request.url));
  }
  if (token.banned) {
    return new NextResponse(null, { status: 403 });
  }

  const target = redirectForRole(pathname, token.role);
  if (target) return NextResponse.redirect(new URL(target, request.url));

  // Datos para el layout de /admin (ban por IP y log de visita).
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') ?? '';
  const shouldLog =
    !isPrefetchRequest(request) && !BOT_UA_PATTERN.test(userAgent);

  const headers = new Headers(request.headers);
  headers.set(ADMIN_GATE_PATH_HEADER, pathname);
  headers.set(ADMIN_GATE_IP_HEADER, ip);
  headers.set(ADMIN_GATE_LOG_HEADER, shouldLog ? '1' : '0');
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
