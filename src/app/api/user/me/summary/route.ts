import { NextResponse } from 'next/server';
import { prisma, recordUserActiveDay } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';
import { awardAchievementsAfterResponse } from '@/lib/achievement-store';

/**
 * Resumen minimo del estado de tracking del usuario actual.
 *
 * Existe para que la home (ISR, sin `auth()` en el server) pueda decidir en
 * cliente si mandar al usuario a /watching sin traerse la lista entera.
 * Lo reusan el modal del primer ingreso (FirstVisitOnboarding) y T18 (push
 * tras el primer episodio).
 *
 * Tambien anota el dia como activo (UserActiveDay): es el unico request que
 * hace cada carga de pagina de un usuario logueado, y el cliente lo cachea 5
 * minutos, asi que la escritura extra es a lo sumo una cada 5 minutos.
 */
export async function GET() {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const userId = authResult.userId;

    const [viendoCount, trackedSeriesRows, trackedViaEpisodeRows, user] =
      await Promise.all([
        prisma.viewStatus.count({
          where: { userId, seriesId: { not: null }, status: 'VIENDO' },
        }),
        prisma.viewStatus.findMany({
          where: {
            userId,
            seriesId: { not: null },
            status: { not: 'SIN_VER' },
          },
          select: { seriesId: true },
        }),
        // Una serie puede no tener fila propia y si tener episodios marcados
        // (el caso que T03 vino a corregir hacia adelante, pero que sigue
        // existiendo en filas viejas). Cuenta igual como "seguida".
        prisma.viewStatus.findMany({
          where: { userId, status: 'VISTA', episodeId: { not: null } },
          select: {
            episode: { select: { season: { select: { seriesId: true } } } },
          },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { onboardingCompletedAt: true },
        }),
        // Es una medicion: si falla, el resumen igual tiene que salir.
        recordUserActiveDay(userId).then(
          (firstVisitToday) => {
            if (firstVisitToday)
              awardAchievementsAfterResponse(userId, ['activeDays']);
          },
          () => undefined
        ),
      ]);

    const trackedSeriesIds = new Set<number>();
    for (const row of trackedSeriesRows) {
      if (row.seriesId !== null) trackedSeriesIds.add(row.seriesId);
    }
    for (const row of trackedViaEpisodeRows) {
      if (row.episode) trackedSeriesIds.add(row.episode.season.seriesId);
    }

    return NextResponse.json({
      viendoCount,
      trackedSeriesCount: trackedSeriesIds.size,
      onboardingCompletedAt: user?.onboardingCompletedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('Error fetching user summary:', error);
    return NextResponse.json(
      { error: 'Error al obtener el resumen del usuario' },
      { status: 500 }
    );
  }
}
