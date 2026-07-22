import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

interface ConfirmEpisode {
  episodeNumber: number;
  title: string;
  videoId: string;
  embedUrl: string;
  embedPlatform: string;
  embedChannelName: string;
  embedChannelUrl: string;
}

interface ConfirmSeason {
  seasonNumber: number;
  episodes: ConfirmEpisode[];
}

interface ConfirmBody {
  series: {
    title: string;
    synopsis?: string | null;
    year?: number | null;
    countryCode?: string | null;
    catalogScope?: 'WATCHABLE_ONLY' | 'PERSONAL';
    type?: string;
  };
  seasons: ConfirmSeason[];
  source?: {
    playlistId?: string;
    playlistUrl?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const body = (await request.json()) as ConfirmBody;

    if (!body?.series?.title?.trim()) {
      return NextResponse.json(
        { error: 'El titulo de la serie es requerido' },
        { status: 400 }
      );
    }
    if (!Array.isArray(body.seasons) || body.seasons.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos una temporada' },
        { status: 400 }
      );
    }

    for (const season of body.seasons) {
      const seen = new Set<number>();
      for (const ep of season.episodes) {
        if (
          typeof ep.episodeNumber !== 'number' ||
          !Number.isFinite(ep.episodeNumber)
        ) {
          return NextResponse.json(
            {
              error: `Temporada ${season.seasonNumber}: hay episodios sin numero asignado.`,
            },
            { status: 422 }
          );
        }
        if (seen.has(ep.episodeNumber)) {
          return NextResponse.json(
            {
              error: `Temporada ${season.seasonNumber}: numero de episodio duplicado (${ep.episodeNumber}). Renumerar antes de confirmar.`,
            },
            { status: 422 }
          );
        }
        seen.add(ep.episodeNumber);
      }
    }

    // Dedupe por título dentro del catálogo curado: re-importar la misma
    // playlist (o importar algo ya existente) creaba una serie CURATED gemela.
    const existingSeries = await prisma.series.findFirst({
      where: {
        origin: 'CURATED',
        title: { equals: body.series.title.trim(), mode: 'insensitive' },
      },
      select: { id: true, title: true },
    });
    if (existingSeries) {
      return NextResponse.json(
        {
          error: `Ya existe una serie "${existingSeries.title}" en el catálogo. Editála para agregar episodios en vez de reimportar.`,
          existingSeriesId: existingSeries.id,
        },
        { status: 409 }
      );
    }

    let countryId: number | null = null;
    if (body.series.countryCode) {
      const country = await prisma.country.findFirst({
        where: { code: body.series.countryCode },
        select: { id: true },
      });
      countryId = country?.id ?? null;
    }

    const created = await prisma.$transaction(async (tx) => {
      const series = await tx.series.create({
        data: {
          title: body.series.title.trim(),
          synopsis: body.series.synopsis?.trim() || null,
          year: body.series.year ?? null,
          type: body.series.type || 'serie',
          catalogScope:
            body.series.catalogScope === 'PERSONAL'
              ? 'PERSONAL'
              : 'WATCHABLE_ONLY',
          countryId,
        },
      });

      for (const season of body.seasons) {
        const createdSeason = await tx.season.create({
          data: {
            seriesId: series.id,
            seasonNumber: season.seasonNumber,
            episodeCount: season.episodes.length,
          },
        });
        if (season.episodes.length > 0) {
          await tx.episode.createMany({
            data: season.episodes.map((ep) => ({
              seasonId: createdSeason.id,
              episodeNumber: ep.episodeNumber,
              title: ep.title?.trim() || null,
              embedUrl: ep.embedUrl,
              embedPlatform: ep.embedPlatform,
              embedVideoId: ep.videoId,
              embedChannelName: ep.embedChannelName || null,
              embedChannelUrl: ep.embedChannelUrl || null,
            })),
          });
        }
      }

      return series;
    });

    revalidatePath('/admin/series');
    revalidatePath('/catalogo');
    revalidatePath('/ver');

    return NextResponse.json({
      seriesId: created.id,
      title: created.title,
      catalogScope: created.catalogScope,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al crear la serie';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
