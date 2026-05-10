import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

// GET /api/admin/activity-by-day — actividad agregada por dia para
// los ultimos 14 dias. Cuenta page views + actions (CREATE/UPDATE/
// DELETE) del AccessLog separados. Usado por ActivityChartWidget del
// dashboard configurable /admin (cubre "Recursos de actividad" del
// mock admin.png).
//
// Devuelve series por dia: { date, views, actions }.
export async function GET() {
  const authResult = await requireRole(['ADMIN', 'MODERATOR']);
  if (!authResult.authorized) return authResult.response;

  const days = 14;
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
    } else if (
      log.action === 'CREATE' ||
      log.action === 'UPDATE' ||
      log.action === 'DELETE'
    ) {
      b.actions++;
    }
  }

  const series = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  return NextResponse.json({ series });
}
