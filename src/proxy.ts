import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logPageView } from '@/lib/access-log';
import { prisma } from '@/lib/database';
import {
  isRuntimeFreezeActive,
  registerRuntimePressureHit,
} from '@/lib/runtime-freeze';

const BOT_UA_PATTERN =
  /bot|crawler|spider|slurp|bingpreview|google web preview|facebookexternalhit|whatsapp|telegrambot|discordbot/i;

const BANNED_IP_CACHE_TTL_MS = 5 * 60 * 1000;
const ANON_LOG_SAMPLE_HIGH = normalizeSampleRate(
  process.env.PUBLIC_PAGE_LOG_SAMPLE_HIGH,
  0.2
);
const ANON_LOG_SAMPLE_LOW = normalizeSampleRate(
  process.env.PUBLIC_PAGE_LOG_SAMPLE_LOW,
  0.03
);
const DISABLE_ANON_LOGGING = normalizeBoolean(
  process.env.PUBLIC_ANON_LOG_DISABLED,
  false
);
const ANON_LOG_GUARD_ENABLED = normalizeBoolean(
  process.env.PUBLIC_ANON_LOG_GUARD_ENABLED,
  true
);
const ANON_LOG_GUARD_WINDOW_MS = normalizePositiveInt(
  process.env.PUBLIC_ANON_LOG_GUARD_WINDOW_MS,
  60_000
);
const ANON_LOG_GUARD_HIT_THRESHOLD = normalizePositiveInt(
  process.env.PUBLIC_ANON_LOG_GUARD_HIT_THRESHOLD,
  800
);
const ANON_LOG_GUARD_COOLDOWN_MS = normalizePositiveInt(
  process.env.PUBLIC_ANON_LOG_GUARD_COOLDOWN_MS,
  15 * 60_000
);

const HIGH_SIGNAL_PUBLIC_PATHS = new Set([
  '/',
  '/catalogo',
  '/ver',
  '/noticias',
  '/novedades',
  '/contenido',
]);

type BannedIpCacheRecord = {
  banned: boolean;
  expiresAt: number;
};

const bannedIpCache = new Map<string, BannedIpCacheRecord>();

type AnonymousLogGuardState = {
  windowStartMs: number;
  hitsInWindow: number;
  disabledUntilMs: number;
};

const anonymousLogGuard: AnonymousLogGuardState = {
  windowStartMs: Date.now(),
  hitsInWindow: 0,
  disabledUntilMs: 0,
};

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

function isPrefetchRequest(request: NextRequest): boolean {
  const purpose = request.headers.get('purpose');
  const nextPrefetch = request.headers.get('next-router-prefetch');
  return purpose === 'prefetch' || nextPrefetch === '1';
}

function hasSessionCookie(request: NextRequest): boolean {
  // NextAuth/Auth.js puede usar cualquiera de estas cookies segun entorno.
  return (
    request.cookies.has('authjs.session-token') ||
    request.cookies.has('__Secure-authjs.session-token') ||
    request.cookies.has('next-auth.session-token') ||
    request.cookies.has('__Secure-next-auth.session-token')
  );
}

function isCrawlerUserAgent(userAgent: string | null): boolean {
  return userAgent ? BOT_UA_PATTERN.test(userAgent) : false;
}

function normalizeSampleRate(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(0, Math.min(1, parsed));
}

function normalizePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.floor(parsed);
  return rounded > 0 ? rounded : fallback;
}

function normalizeBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (!raw) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes') {
    return true;
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no') {
    return false;
  }
  return fallback;
}

function shouldLogAnonymousPublicPath(pathname: string): boolean {
  const sampleRate = HIGH_SIGNAL_PUBLIC_PATHS.has(pathname)
    ? ANON_LOG_SAMPLE_HIGH
    : ANON_LOG_SAMPLE_LOW;
  return Math.random() < sampleRate;
}

function isAnonymousLoggingGuardActive(nowMs: number): boolean {
  return anonymousLogGuard.disabledUntilMs > nowMs;
}

function registerAnonymousPublicHit(nowMs: number): void {
  if (!ANON_LOG_GUARD_ENABLED) return;

  if (nowMs - anonymousLogGuard.windowStartMs >= ANON_LOG_GUARD_WINDOW_MS) {
    anonymousLogGuard.windowStartMs = nowMs;
    anonymousLogGuard.hitsInWindow = 0;
  }

  anonymousLogGuard.hitsInWindow += 1;

  if (anonymousLogGuard.hitsInWindow >= ANON_LOG_GUARD_HIT_THRESHOLD) {
    anonymousLogGuard.disabledUntilMs = nowMs + ANON_LOG_GUARD_COOLDOWN_MS;
  }
}

function getCachedBannedIp(ip: string): boolean | null {
  const cached = bannedIpCache.get(ip);
  if (!cached) return null;
  if (cached.expiresAt < Date.now()) {
    bannedIpCache.delete(ip);
    return null;
  }
  return cached.banned;
}

function setCachedBannedIp(ip: string, banned: boolean): void {
  bannedIpCache.set(ip, {
    banned,
    expiresAt: Date.now() + BANNED_IP_CACHE_TTL_MS,
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || null;
  const skipLog =
    isPrefetchRequest(request) ||
    (isCrawlerUserAgent(userAgent) && !pathname.startsWith('/admin'));

  // Bloquear scanners antes de cualquier procesamiento (no loguear, no gastar DB)
  if (isScannerPath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  // Extraer IP real del cliente (CF-Connecting-IP con Cloudflare, fallback a x-forwarded-for)
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null;

  // No loguear assets/PWA
  if (isAssetPath(pathname)) {
    return NextResponse.next();
  }

  // Check IP ban
  if (ip) {
    const cached = getCachedBannedIp(ip);
    if (cached === true) {
      return new NextResponse('Acceso denegado', { status: 403 });
    }
    if (cached === null) {
      const bannedIp = await prisma.bannedIp.findUnique({ where: { ip } });
      const isBanned = bannedIp != null;
      setCachedBannedIp(ip, isBanned);
      if (isBanned) {
        return new NextResponse('Acceso denegado', { status: 403 });
      }
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

    // Rutas de crear/editar series y seasons: Admin + Moderator. El
    // workspace /admin/series/[id] (vista densa con tabs, analisis por
    // episodio, reseñas vinculadas y herramientas) tambien lo permite
    // MODERATOR — es la vista de trabajo principal para administrar el
    // catalogo, no solo el form puntual de /editar.
    const isEditRoute =
      pathname === '/admin/series/nueva' ||
      /^\/admin\/series\/\d+$/.test(pathname) ||
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
    if (!skipLog) {
      logPageView(pathname, ip, userAgent, session.user?.id || null);
    }
  } else {
    // Paginas publicas: evitar auth() cuando no hay cookie de sesion para
    // bajar CPU en trafico anonimo (principal consumidor en Vercel).
    if (hasSessionCookie(request)) {
      const session = await auth();
      if (session?.user?.banned) {
        return new NextResponse('Tu cuenta ha sido suspendida', {
          status: 403,
        });
      }
      if (!skipLog) {
        logPageView(pathname, ip, userAgent, session?.user?.id || null);
      }
    } else {
      const nowMs = Date.now();
      registerRuntimePressureHit();
      registerAnonymousPublicHit(nowMs);
      const anonLoggingEnabledByGuard = !isAnonymousLoggingGuardActive(nowMs);
      if (
        !skipLog &&
        !DISABLE_ANON_LOGGING &&
        anonLoggingEnabledByGuard &&
        !isRuntimeFreezeActive('anon-logging') &&
        shouldLogAnonymousPublicPath(pathname)
      ) {
        logPageView(pathname, ip, userAgent, null);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Todas las paginas excepto assets estaticos, API routes e internos de Next
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
