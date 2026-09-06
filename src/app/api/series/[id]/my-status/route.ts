import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

/**
 * Estado del usuario actual sobre una serie puntual: viewStatus (serie,
 * temporadas, episodios) + suscripcion, en un solo request.
 *
 * Por que existe: /series/[id] dejo de llamar `await auth()` en el server
 * (eso mataba el `revalidate` — la ruta de mas trafico del sitio se volvia
 * dinamica para TODOS los visitantes, logueados o no). Todo lo que antes
 * viajaba ya resuelto desde el servidor (ViewStatusToggle, SeasonsList,
 * EpisodesList, ReviewsSection, SeriesSubscribeButton) ahora se hidrata
 * client-side via SeriesUserStatusProvider, que pega este endpoint una sola
 * vez por carga de pagina.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const seriesId = parseInt(id, 10);
    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const [seriesVs, seasonRows, episodeRows, subscription] = await Promise.all(
      [
        prisma.viewStatus.findUnique({
          where: {
            userId_seriesId: { userId: authResult.userId, seriesId },
          },
          select: { status: true },
        }),
        prisma.viewStatus.findMany({
          where: { userId: authResult.userId, season: { seriesId } },
          select: { seasonId: true, status: true },
        }),
        prisma.viewStatus.findMany({
          where: {
            userId: authResult.userId,
            episode: { season: { seriesId } },
          },
          select: { episodeId: true, status: true },
        }),
        prisma.seriesSubscription.findUnique({
          where: {
            userId_seriesId: { userId: authResult.userId, seriesId },
          },
          select: { id: true },
        }),
      ]
    );

    const seasonStatus: Record<number, string> = {};
    seasonRows.forEach((r) => {
      if (r.seasonId !== null) seasonStatus[r.seasonId] = r.status;
    });

    const episodeStatus: Record<number, string> = {};
    episodeRows.forEach((r) => {
      if (r.episodeId !== null) episodeStatus[r.episodeId] = r.status;
    });

    return NextResponse.json({
      seriesStatus: seriesVs?.status ?? 'SIN_VER',
      seasonStatus,
      episodeStatus,
      subscribed: subscription !== null,
    });
  } catch (error) {
    console.error('Error fetching series my-status:', error);
    return NextResponse.json(
      { error: 'Error al obtener el estado del usuario' },
      { status: 500 }
    );
  }
}
