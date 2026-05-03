import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

/**
 * GET /api/user/account/export
 *
 * Devuelve un JSON descargable con todos los datos personales del
 * usuario autenticado: cuenta, comments, ratings, view-status,
 * favoritos, votos, sitios sugeridos, feature requests, notificaciones.
 *
 * No incluye datos derivados (ratings agregados, etc.) ni datos de
 * otros usuarios.
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const userId = auth.userId;

  const [
    user,
    comments,
    userRatings,
    viewStatuses,
    favorites,
    featureRequests,
    featureVotes,
    suggestedSites,
    notifications,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.comment.findMany({ where: { userId } }),
    prisma.userRating.findMany({ where: { userId } }),
    prisma.viewStatus.findMany({ where: { userId } }),
    prisma.userFavorite.findMany({ where: { userId } }),
    prisma.featureRequest.findMany({ where: { userId } }),
    prisma.featureVote.findMany({ where: { userId } }),
    prisma.suggestedSite.findMany({ where: { userId } }),
    prisma.notification.findMany({ where: { userId } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    user,
    comments,
    userRatings,
    viewStatuses,
    favorites,
    featureRequests,
    featureVotes,
    suggestedSites,
    notifications,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="mundobl-data-${userId}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
