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
 *      el target CURATED. Mueve el episodio (update seasonId).
 *   3. Borra el row USER_EMBED (cascade limpia seasons vacios sobrantes).
 *
 * Todo en una transaccion. Si el episode con mismo (seasonId, episodeNumber)
 * ya existe en el target, se omite ese episodio y se cuenta como skip.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireRole(['ADMIN']);
  if (!auth.authorized) return auth.response;

  const { id } = await context.params;
  const userEmbedId = parseInt(id, 10);
  if (isNaN(userEmbedId)) {
    return NextResponse.json({ error: 'ID invalido.' }, { status: 400 });
  }

  let body: { targetCuratedSeriesId?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido.' }, { status: 400 });
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
      { error: 'USER_EMBED no encontrado.' },
      { status: 404 }
    );
  }
  if (source.origin !== 'USER_EMBED') {
    return NextResponse.json(
      { error: 'El source debe ser un aporte USER_EMBED.' },
      { status: 422 }
    );
  }

  const target = await prisma.series.findUnique({
    where: { id: targetId },
    select: { id: true, origin: true, year: true },
  });
  if (!target) {
    return NextResponse.json(
      { error: 'Serie target no encontrada.' },
      { status: 404 }
    );
  }
  if (target.origin !== 'CURATED') {
    return NextResponse.json(
      { error: 'La serie target debe ser CURATED.' },
      { status: 422 }
    );
  }

  // Transaccion: por cada season del USER_EMBED, asegurar Season del target
  // y mover los episodios. Skip si (seasonId, episodeNumber) ya existe.
  const result = await prisma.$transaction(async (tx) => {
    let moved = 0;
    let skipped = 0;
    for (const srcSeason of source.seasons) {
      let targetSeason = await tx.season.findFirst({
        where: { seriesId: targetId, seasonNumber: srcSeason.seasonNumber },
        select: { id: true },
      });
      if (!targetSeason) {
        const created = await tx.season.create({
          data: {
            seriesId: targetId,
            seasonNumber: srcSeason.seasonNumber,
            episodeCount: srcSeason.episodes.length,
            year: srcSeason.year ?? target.year ?? undefined,
          },
          select: { id: true },
        });
        targetSeason = created;
      }
      for (const ep of srcSeason.episodes) {
        const existingEp = await tx.episode.findFirst({
          where: {
            seasonId: targetSeason.id,
            episodeNumber: ep.episodeNumber,
          },
          select: { id: true, embedUrl: true },
        });
        if (existingEp) {
          // Si el episodio destino existe pero no tiene embedUrl, lo enriquecemos.
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
          continue;
        }
        await tx.episode.update({
          where: { id: ep.id },
          data: { seasonId: targetSeason.id },
        });
        moved++;
      }
    }
    await tx.series.delete({ where: { id: userEmbedId } });
    return { moved, skipped };
  });

  return NextResponse.json({
    ok: true,
    targetCuratedSeriesId: targetId,
    movedEpisodeCount: result.moved,
    skippedEpisodeCount: result.skipped,
  });
}
