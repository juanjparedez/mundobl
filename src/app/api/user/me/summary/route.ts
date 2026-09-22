import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

/**
 * Resumen minimo del estado de tracking del usuario actual.
 *
 * Existe para que la home (ISR, sin `auth()` en el server) pueda decidir en
 * cliente si mandar al usuario a /watching sin traerse la lista entera.
 * Lo reusan T11b (onboarding) y T18 (push tras el primer episodio).
 */
export async function GET() {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const userId = authResult.userId;

    const [viendoCount, trackedSeriesRows, trackedViaEpisodeRows] =
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
      // Lo llena T11a; hasta entonces el contrato ya esta en su lugar.
      onboardingCompletedAt: null,
    });
  } catch (error) {
    console.error('Error fetching user summary:', error);
    return NextResponse.json(
      { error: 'Error al obtener el resumen del usuario' },
      { status: 500 }
    );
  }
}
