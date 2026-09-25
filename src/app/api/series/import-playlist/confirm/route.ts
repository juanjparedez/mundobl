import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import { checkCollaboratorImportRateLimit } from '@/lib/rate-limit';
import { parseAirDate } from '@/lib/episode-parser';
import { attachEpisodesToSeries } from '@/lib/episode-attach';
import { notifyEpisodesAvailable } from '@/lib/notifications';
import { checkOfficialYouTubeVideos } from '@/lib/official-content-guard';

interface ConfirmEpisode {
  episodeNumber: number;
  title: string;
  videoId: string;
  embedUrl: string;
  embedPlatform: string;
  embedChannelName: string;
  embedChannelUrl: string;
  // ISO 8601 de la YouTube Data API. Alimenta `Episode.airDate`, que es lo
  // que despues permite armar el calendario semanal de estrenos.
  publishedAt?: string | null;
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
    geoRestrictedCore?: boolean;
  };
  seasons: ConfirmSeason[];
  source?: {
    playlistId?: string;
    playlistUrl?: string;
  };
  /**
   * Adjuntar los episodios a una serie del catalogo que ya existe, en vez de
   * crear una serie nueva. Es la respuesta al 409 de duplicado: la ficha ya
   * esta curada y lo unico que le falta es el reproductor.
   *
   * Solo ADMIN: un COLLABORATOR nunca puede escribir sobre el catalogo curado.
   */
  targetSeriesId?: number;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'COLLABORATOR']);
    if (!authResult.authorized) return authResult.response;
    const isCollaborator = authResult.role === 'COLLABORATOR';

    if (isCollaborator) {
      const rateLimit = await checkCollaboratorImportRateLimit(
        authResult.userId
      );
      if (!rateLimit.ok) {
        return NextResponse.json(
          { error: rateLimit.reason },
          {
            status: 429,
            headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
          }
        );
      }
    }

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

    // Politica de contenido oficial: todos los videos de la playlist tienen
    // que pertenecer a un canal de la lista blanca (verificado contra
    // YouTube, no contra embedChannelUrl del body). Un solo video ajeno
    // rechaza el import entero. Se corre ACA, antes de bifurcar entre
    // "adjuntar a una ficha existente" y "crear serie nueva": la politica
    // aplica a los dos caminos por igual — adjuntar a una ficha ya curada no
    // puede ser una forma de esquivar el filtro. Ver
    // docs/politica-contenido-oficial.md.
    const allVideoIds = body.seasons.flatMap((s) =>
      s.episodes.map((ep) => ep.videoId)
    );
    const officialCheck = await checkOfficialYouTubeVideos(allVideoIds);
    if (!officialCheck.ok) {
      return NextResponse.json(
        {
          error: officialCheck.error,
          offenders: officialCheck.offenders.map((o) => o.videoId),
        },
        { status: officialCheck.status }
      );
    }

    // ── Camino "adjuntar a una ficha existente" ───────────────────────
    // Es la salida al 409 de mas abajo: en vez de rebotar la importacion
    // porque la serie ya esta en el catalogo, se le cuelgan los episodios
    // a esa ficha. Requiere que el cliente lo pida explicitamente: nunca
    // se fusiona solo.
    if (body.targetSeriesId !== undefined) {
      if (isCollaborator) {
        return NextResponse.json(
          {
            error: 'Un colaborador no puede escribir sobre el catálogo curado.',
          },
          { status: 403 }
        );
      }

      const targetId = Number(body.targetSeriesId);
      if (!Number.isFinite(targetId) || targetId <= 0) {
        return NextResponse.json(
          { error: 'targetSeriesId inválido.' },
          { status: 400 }
        );
      }

      const target = await prisma.series.findUnique({
        where: { id: targetId },
        select: { id: true, title: true, origin: true, year: true },
      });
      if (!target) {
        return NextResponse.json(
          { error: 'La serie destino no existe.' },
          { status: 404 }
        );
      }
      if (target.origin !== 'CURATED') {
        return NextResponse.json(
          { error: 'La serie destino debe ser del catálogo curado.' },
          { status: 422 }
        );
      }

      const attached = await prisma.$transaction(
        (tx) =>
          attachEpisodesToSeries(
            tx,
            target.id,
            body.seasons.map((season) => ({
              seasonNumber: season.seasonNumber,
              episodes: season.episodes.map((ep) => ({
                episodeNumber: ep.episodeNumber,
                title: ep.title?.trim() || null,
                embedUrl: ep.embedUrl,
                embedPlatform: ep.embedPlatform,
                embedVideoId: ep.videoId,
                embedChannelName: ep.embedChannelName || null,
                embedChannelUrl: ep.embedChannelUrl || null,
                airDate: parseAirDate(ep.publishedAt),
              })),
            })),
            target.year
          ),
        // Mismo margen que el endpoint de link: una serie tailandesa parte
        // cada capitulo en 4 videos y puede traer mas de 200 episodios.
        { maxWait: 15000, timeout: 60000 }
      );

      revalidatePath('/admin/series');
      revalidatePath('/catalogo');
      revalidatePath('/ver');

      // Fuera de la transaccion: solo se avisa lo que quedo escrito.
      await notifyEpisodesAvailable({
        seriesId: target.id,
        seriesTitle: target.title,
        episodes: attached.available,
      });

      return NextResponse.json({
        seriesId: target.id,
        title: target.title,
        attached,
      });
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
          error: `Ya existe una serie "${existingSeries.title}" en el catálogo.`,
          existingSeriesId: existingSeries.id,
        },
        { status: 409 }
      );
    }

    let countryId: number | null = null;
    if (body.series.countryCode) {
      // Case-insensitive: Country.code se siembra en minuscula (ver
      // src/lib/country-codes.ts) pero los selects de import mandan
      // codigos ISO en mayuscula (COUNTRY_OPTIONS) — sin esto el match
      // siempre fallaba y countryId quedaba null.
      const country = await prisma.country.findFirst({
        where: {
          code: { equals: body.series.countryCode, mode: 'insensitive' },
        },
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
          // Un COLLABORATOR nunca puede escribir en el catalogo curado:
          // se ignora lo que mande el body para estos 3 campos y se
          // fuerzan server-side, igual que en /api/user/series/embed/confirm.
          catalogScope: isCollaborator
            ? 'WATCHABLE_ONLY'
            : body.series.catalogScope === 'PERSONAL'
              ? 'PERSONAL'
              : 'WATCHABLE_ONLY',
          origin: isCollaborator ? 'USER_EMBED' : 'CURATED',
          submittedById: isCollaborator ? authResult.userId : null,
          countryId,
          geoRestrictedCore: body.series.geoRestrictedCore === true,
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
              airDate: parseAirDate(ep.publishedAt),
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
