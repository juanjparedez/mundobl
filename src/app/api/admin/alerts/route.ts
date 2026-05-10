import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

// GET /api/admin/alerts — counts accionables para el widget de alerts
// del perfil admin. Reemplaza la data que antes se cargaba server-side
// en /admin/dashboard (eliminado en favor de /perfil unificado).
export async function GET() {
  const authResult = await requireRole(['ADMIN', 'MODERATOR']);
  if (!authResult.authorized) return authResult.response;

  const [
    seriesWithoutReview,
    seriesWithoutContent,
    commentsReported,
    suggestedSitesPending,
  ] = await Promise.all([
    prisma.series.count({
      where: { reviews: { none: { status: 'PUBLISHED' } } },
    }),
    prisma.series.count({ where: { embeddableContent: { none: {} } } }),
    prisma.comment.count({ where: { reportCount: { gt: 0 } } }),
    prisma.suggestedSite.count({ where: { status: 'pendiente' } }),
  ]);

  return NextResponse.json({
    seriesWithoutReview,
    seriesWithoutContent,
    commentsReported,
    suggestedSitesPending,
  });
}
