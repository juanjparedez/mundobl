import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

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
 *
 * No requiere confirmacion por email (a diferencia de DELETE /account)
 * porque no es tan catastrofico como borrar la cuenta: el usuario sigue
 * logueado, solo pierde su historial de seguimiento.
 */
export async function POST() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const [viewStatus, userRating, userFavorite, episodeNote, seriesNote] =
    await prisma.$transaction([
      prisma.viewStatus.deleteMany({ where: { userId: auth.userId } }),
      prisma.userRating.deleteMany({ where: { userId: auth.userId } }),
      prisma.userFavorite.deleteMany({ where: { userId: auth.userId } }),
      prisma.episodeNote.deleteMany({ where: { userId: auth.userId } }),
      prisma.seriesNote.deleteMany({ where: { userId: auth.userId } }),
    ]);

  return NextResponse.json({
    ok: true,
    deleted: {
      viewStatus: viewStatus.count,
      userRating: userRating.count,
      userFavorite: userFavorite.count,
      episodeNote: episodeNote.count,
      seriesNote: seriesNote.count,
    },
  });
}
