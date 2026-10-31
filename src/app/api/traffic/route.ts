import { isSameOriginRequest } from '@/lib/request-origin';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { edgeCountry, utcDay } from '@/lib/series-activity';
import {
  isTrafficFlow,
  isTrafficSection,
  type TrafficFlow,
  type TrafficSection,
} from '@/lib/site-traffic';

const noStore = { 'Cache-Control': 'no-store' };

// Tope por IP en memoria volátil (nunca se guarda la IP).
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

/**
 * Suma uno al contador diario agregado de tráfico por sección (SiteTrafficDaily).
 * Medición operativa de primera parte: cero datos personales, cero IPs en DB.
 */
export async function POST(request: NextRequest) {
  // Evitar llamadas cruzadas desde otros dominios
  if (!isSameOriginRequest(request))
    return new NextResponse(null, { status: 403 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return new NextResponse(null, { status: 400 });

  const { section, flow = 'direct' } = body as Record<string, unknown>;
  if (!isTrafficSection(section) || !isTrafficFlow(flow))
    return new NextResponse(null, { status: 400 });

  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  if (overLimit(ip, Date.now()))
    return new NextResponse(null, { status: 429, headers: noStore });

  try {
    const session = await auth();
    // Excluir staff de las métricas de tráfico
    if (
      session?.user?.banned ||
      ['ADMIN', 'MODERATOR', 'COLLABORATOR'].includes(session?.user?.role ?? '')
    )
      return new NextResponse(null, { status: 204, headers: noStore });

    const key = {
      day: utcDay(),
      section: section as TrafficSection,
      flow: flow as TrafficFlow,
      source: session?.user ? 'account' : 'browser',
      country: edgeCountry(request.headers.get('x-vercel-ip-country')),
    };

    await prisma.siteTrafficDaily.upsert({
      where: { day_section_flow_source_country: key },
      create: { ...key, count: 1 },
      update: { count: { increment: 1 } },
    });

    return new NextResponse(null, { status: 204, headers: noStore });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
