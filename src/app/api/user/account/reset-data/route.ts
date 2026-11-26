import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';
import { trackingAchievementsWhere } from '@/lib/achievement-store';

/**
 * POST /api/user/account/reset-data
 *
 * Borra el historial de seguimiento del usuario autenticado (lo que
 * alimenta graficos/stats en /perfil) SIN tocar la cuenta ni los
 * comentarios/reviews publicos:
 *   - ViewStatus: marcas de episodios/temporadas/series vistas.
 *   - UserRating: calificaciones propias por serie/temporada.
 *   - UserFavorite: series marcadas como favoritas.
 *   - EpisodeNote / SeriesNote: notas privadas.
 *   - Los logros que salen de eso (ver trackingAchievementsWhere).
 *
 * No requiere confirmacion por email (a diferencia de DELETE /account)
 * porque no es tan catastrofico como borrar la cuenta: el usuario sigue
 * logueado, solo pierde su historial de seguimiento.
 */
export async function POST() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  // Sequential, not atomic: every step is a delete, so a retry after a
  // partial failure simply finishes the job.
  const where = { userId: auth.userId };
  const viewStatus = await prisma.viewStatus.deleteMany({ where });
  const userRating = await prisma.userRating.deleteMany({ where });
  const userFavorite = await prisma.userFavorite.deleteMany({ where });
  const episodeNote = await prisma.episodeNote.deleteMany({ where });
  const seriesNote = await prisma.seriesNote.deleteMany({ where });
  const trackingEvent = await prisma.trackingEvent.deleteMany({ where });
  const userAchievement = await prisma.userAchievement.deleteMany({
    where: trackingAchievementsWhere(auth.userId),
  });

  return NextResponse.json({
    ok: true,
    deleted: {
      viewStatus: viewStatus.count,
      userRating: userRating.count,
      userFavorite: userFavorite.count,
      episodeNote: episodeNote.count,
      seriesNote: seriesNote.count,
      trackingEvent: trackingEvent.count,
      userAchievement: userAchievement.count,
    },
  });
}
