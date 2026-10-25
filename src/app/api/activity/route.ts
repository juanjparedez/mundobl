import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { edgeCountry, isActivityKind, utcDay } from '@/lib/series-activity';

const noStore = { 'Cache-Control': 'no-store' };

// Tope por IP y por instancia, solo en memoria (nunca se guarda la IP): un
// script no puede inflar los contadores publicos. 120 por hora alcanza para
// alguien que maratonea una serie entera.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 120;
const buckets = new Map<string, { start: number; count: number }>();

function overLimit(ip: string, now: number): boolean {
  if (buckets.size > 5_000) {
    for (const [key, bucket] of buckets) {
      if (now - bucket.start > WINDOW_MS) buckets.delete(key);
    }
  }
  const bucket = buckets.get(ip);
  if (!bucket || now - bucket.start > WINDOW_MS) {
    buckets.set(ip, { start: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_PER_WINDOW;
}

/** Suma uno a la actividad anonima de una serie (ver series-activity.ts). */
export async function POST(request: NextRequest) {
  // Sin GET: crawlers y prefetch nunca cuentan.
  if (request.headers.get('origin') !== request.nextUrl.origin)
    return new NextResponse(null, { status: 403 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return new NextResponse(null, { status: 400 });
  const { seriesId, kind } = body as Record<string, unknown>;
  if (!isActivityKind(kind)) return new NextResponse(null, { status: 400 });
  if (!Number.isSafeInteger(seriesId) || Number(seriesId) < 1)
    return new NextResponse(null, { status: 400 });

  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  if (overLimit(ip, Date.now()))
    return new NextResponse(null, { status: 429, headers: noStore });

  try {
    const session = await auth();
    // El equipo prueba todo el tiempo: no es audiencia.
    if (
      session?.user?.banned ||
      ['ADMIN', 'MODERATOR', 'COLLABORATOR'].includes(session?.user?.role ?? '')
    )
      return new NextResponse(null, { status: 204, headers: noStore });

    const series = await prisma.series.findUnique({
      where: { id: Number(seriesId) },
      select: { visibility: true },
    });
    if (!series || series.visibility !== 'VISIBLE')
      return new NextResponse(null, { status: 400 });

    const key = {
      day: utcDay(),
      seriesId: Number(seriesId),
      kind,
      // El origen lo decide la sesion, no el cliente.
      source: session?.user ? 'account' : 'browser',
      country: edgeCountry(request.headers.get('x-vercel-ip-country')),
    };
    await prisma.seriesActivityDaily.upsert({
      where: { day_seriesId_kind_source_country: key },
      create: { ...key, count: 1 },
      update: { count: { increment: 1 } },
    });
    return new NextResponse(null, { status: 204, headers: noStore });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
