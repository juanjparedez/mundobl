import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

type Period = 'week' | 'month' | 'year';

interface BucketRow {
  bucket: string;
  views: bigint;
  actions: bigint;
}

/**
 * Cuenta vistas y acciones por dia o mes (UTC) en la base. Antes se traian
 * todas las filas del rango para contarlas en el Worker: ~21.700 filas por
 * llamada con el rango de un año, el segundo mayor volumen de filas en
 * pg_stat_statements. Ahora vuelven como mucho 30 filas.
 */
async function countByBucket(
  since: Date,
  unit: 'day' | 'month'
): Promise<Map<string, { views: number; actions: number }>> {
  const format = unit === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';
  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT to_char(date_trunc(${unit}, "createdAt"), ${format}) AS bucket,
      COUNT(*) FILTER (WHERE action = 'PAGE_VIEW') AS views,
      COUNT(*) FILTER (WHERE action IN ('CREATE', 'UPDATE', 'DELETE')) AS actions
    FROM "AccessLog"
    WHERE "createdAt" >= ${since}
    GROUP BY 1
  `);
  return new Map(
    rows.map((row) => [
      row.bucket,
      { views: Number(row.views), actions: Number(row.actions) },
    ])
  );
}

// GET /api/admin/activity-by-day?range=week|month|year — actividad
// agregada del AccessLog. Cuenta page views + actions (CREATE/UPDATE/
// DELETE) separados. Usado por ActivityChartWidget ("Recursos de
// actividad") del dashboard configurable /perfil y /admin.
//
// - week / month: bucket diario (7 / 30 dias), date = "YYYY-MM-DD".
// - year: bucket mensual (12 meses), date = "YYYY-MM" (evita un chart
//   de 365 puntos ilegible).
//
// Devuelve { series, period }.
export async function GET(request: NextRequest) {
  const authResult = await requireRole(['ADMIN', 'MODERATOR']);
  if (!authResult.authorized) return authResult.response;

  const rangeParam = request.nextUrl.searchParams.get('range');
  const period: Period =
    rangeParam === 'week' || rangeParam === 'year' ? rangeParam : 'month';

  if (period === 'year') {
    const months = 12;
    const since = new Date();
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
    since.setMonth(since.getMonth() - (months - 1));

    const totals = await countByBucket(since, 'month');
    const buckets = new Map<string, { views: number; actions: number }>();
    for (let i = 0; i < months; i++) {
      const d = new Date(since.getFullYear(), since.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, totals.get(key) ?? { views: 0, actions: 0 });
    }

    const series = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    return NextResponse.json({ series, period });
  }

  const days = period === 'week' ? 7 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);

  const totals = await countByBucket(since, 'day');

  // Todos los dias del rango, con 0/0 si no hubo logs (sin gaps en el chart).
  const buckets = new Map<string, { views: number; actions: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, totals.get(key) ?? { views: 0, actions: 0 });
  }

  const series = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  return NextResponse.json({ series, period });
}
