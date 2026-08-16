import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/user-series/[id]/link
 * Body: { targetCuratedSeriesId: number }
 *
 * "Linkea" un aporte USER_EMBED con una serie CURATED existente:
 *   1. Toma los Episodes con embedUrl del USER_EMBED.
 *   2. Para cada uno: encuentra/crea Season con mismo seasonNumber en
 *      el target CURATED. Mueve el episodio o enriquece el existente.
 *   3. Borra de forma limpia el row USER_EMBED y sus dependencias.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);
    if (!auth.authorized) return auth.response;

    const { id } = await context.params;
    const userEmbedId = parseInt(id, 10);
    if (isNaN(userEmbedId)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    let body: { targetCuratedSeriesId?: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
    }
    const targetId = Number(body?.targetCuratedSeriesId);
    if (!Number.isFinite(targetId) || targetId <= 0) {
      return NextResponse.json(
        { error: 'targetCuratedSeriesId requerido.' },
        { status: 400 }
      );
    }
    if (targetId === userEmbedId) {
      return NextResponse.json(
        { error: 'targetCuratedSeriesId no puede ser el mismo USER_EMBED.' },
        { status: 400 }
      );
    }

    const source = await prisma.series.findUnique({
      where: { id: userEmbedId },
      select: {
        id: true,
        origin: true,
        seasons: {
          select: {
            id: true,
            seasonNumber: true,
            year: true,
            episodes: {
              where: { embedUrl: { not: null } },
              select: {
                id: true,
                episodeNumber: true,
                title: true,
                synopsis: true,
                duration: true,
                airDate: true,
                embedUrl: true,
                embedPlatform: true,
                embedVideoId: true,
                embedChannelName: true,
                embedChannelUrl: true,
              },
            },
          },
        },
      },
    });
    if (!source) {
      return NextResponse.json(
        { error: 'Aporte no encontrado.' },
        { status: 404 }
      );
    }
    if (source.origin !== 'USER_EMBED') {
      return NextResponse.json(
        { error: 'El origen debe ser un aporte de usuario (USER_EMBED).' },
        { status: 422 }
      );
    }

    const target = await prisma.series.findUnique({
      where: { id: targetId },
      select: { id: true, origin: true, year: true },
    });
    if (!target) {
      return NextResponse.json(
        { error: 'Serie del catálogo curado no encontrada.' },
        { status: 404 }
      );
    }
    if (target.origin !== 'CURATED') {
      return NextResponse.json(
        { error: 'La serie destino debe ser del catálogo curado.' },
        { status: 422 }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        let moved = 0;
        let skipped = 0;

        for (const srcSeason of source.seasons) {
          let targetSeason = await tx.season.findFirst({
            where: { seriesId: targetId, seasonNumber: srcSeason.seasonNumber },
            select: { id: true },
          });

          if (!targetSeason) {
            targetSeason = await tx.season.create({
              data: {
                seriesId: targetId,
                seasonNumber: srcSeason.seasonNumber,
                episodeCount: srcSeason.episodes.length,
                year: srcSeason.year ?? target.year ?? undefined,
              },
              select: { id: true },
            });
          }

          // Carga anticipada en memoria de todos los episodios existentes del target
          const existingTargetEpisodes = await tx.episode.findMany({
            where: { seasonId: targetSeason.id },
            select: { id: true, episodeNumber: true, embedUrl: true },
          });
          const existingMap = new Map(
            existingTargetEpisodes.map((e) => [e.episodeNumber, e])
          );

          for (const ep of srcSeason.episodes) {
            const existingEp = existingMap.get(ep.episodeNumber);

            if (existingEp) {
              if (!existingEp.embedUrl) {
                await tx.episode.update({
                  where: { id: existingEp.id },
                  data: {
                    embedUrl: ep.embedUrl,
                    embedPlatform: ep.embedPlatform,
                    embedVideoId: ep.embedVideoId,
                    embedChannelName: ep.embedChannelName,
                    embedChannelUrl: ep.embedChannelUrl,
                  },
                });
                moved++;
              } else {
                skipped++;
              }
              // Eliminar el episodio del aporte fuente para evitar duplicados
              await tx.episode
                .delete({ where: { id: ep.id } })
                .catch(() => {});
              continue;
            }

            await tx.episode.update({
              where: { id: ep.id },
              data: { seasonId: targetSeason.id },
            });
            moved++;
          }
        }

        // Limpieza de referencias hacia el aporte antes de borrar
        await tx.series.updateMany({
          where: { linkedSeriesId: userEmbedId },
          data: { linkedSeriesId: null },
        });

        await tx.season.deleteMany({
          where: { seriesId: userEmbedId },
        });

        await tx.series.delete({
          where: { id: userEmbedId },
        });

        return { moved, skipped };
      },
      {
        maxWait: 15000,
        timeout: 60000, // 60 segundos de timeout para series de más de 100 episodios
      }
    );

    return NextResponse.json({
      ok: true,
      targetCuratedSeriesId: targetId,
      movedEpisodeCount: result.moved,
      skippedEpisodeCount: result.skipped,
    });
  } catch (error) {
    console.error('Error al linkear serie:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error interno al linkear serie con el catálogo.',
      },
      { status: 500 }
    );
  }
}
