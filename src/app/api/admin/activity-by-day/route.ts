import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

type Period = 'week' | 'month' | 'year';

function isAdminAction(action: string): boolean {
  return action === 'CREATE' || action === 'UPDATE' || action === 'DELETE';
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

    const logs = await prisma.accessLog.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, action: true },
    });

    const buckets = new Map<string, { views: number; actions: number }>();
    for (let i = 0; i < months; i++) {
      const d = new Date(since.getFullYear(), since.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, { views: 0, actions: 0 });
    }

    for (const log of logs) {
      const key = `${log.createdAt.getFullYear()}-${String(log.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const b = buckets.get(key);
      if (!b) continue;
      if (log.action === 'PAGE_VIEW') b.views++;
      else if (isAdminAction(log.action)) b.actions++;
    }

    const series = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    return NextResponse.json({ series, period });
  }

  const days = period === 'week' ? 7 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);

  const logs = await prisma.accessLog.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, action: true },
  });

  // Bucketear por dia ISO YYYY-MM-DD.
  const buckets = new Map<string, { views: number; actions: number }>();

  // Inicializar todos los dias del rango con 0/0 (para no dejar gaps
  // en el chart si algun dia no tiene logs).
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { views: 0, actions: 0 });
  }

  for (const log of logs) {
    const key = log.createdAt.toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (!b) continue;
    if (log.action === 'PAGE_VIEW') {
      b.views++;
    } else if (isAdminAction(log.action)) {
      b.actions++;
    }
  }

  const series = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  return NextResponse.json({ series, period });
}
