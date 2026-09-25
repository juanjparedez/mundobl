import { Prisma } from '@/generated/prisma';

/**
 * Adjunta episodios embebidos a una serie que YA existe, en vez de crear una
 * serie gemela.
 *
 * Por que existe: medido el 2026-09-10, de 613 fichas del catalogo curado
 * solo 5 tenian reproductor propio y 455 no tenian ninguna forma de ver la
 * serie. La accion de mayor retorno del proyecto es justamente darle
 * reproductor a una ficha que ya recibe trafico de Google — y era la unica
 * que el sistema impedia, porque el confirm del importador cortaba con 409
 * cuando el titulo ya existia en el catalogo.
 *
 * Relacion con `POST /api/admin/user-series/[id]/link`: ese endpoint resuelve
 * el mismo problema pero moviendo filas `Episode` que ya estan persistidas
 * (un aporte USER_EMBED). Aca los episodios todavia no existen, vienen del
 * preview del importador, asi que se crean. La politica de fusion es la
 * misma y deliberadamente conservadora: nunca se pisa un embed existente.
 */

export interface AttachEpisodeInput {
  episodeNumber: number;
  title: string | null;
  embedUrl: string;
  embedPlatform: string;
  embedVideoId: string;
  embedChannelName: string | null;
  embedChannelUrl: string | null;
  airDate: Date | null;
}

export interface AttachSeasonInput {
  seasonNumber: number;
  episodes: AttachEpisodeInput[];
}

export interface AttachResult {
  /** Episodios que no existian en la serie destino y se crearon. */
  created: number;
  /** Episodios que existian sin embed y ahora lo tienen. */
  enriched: number;
  /** Episodios que ya tenian embed: no se tocan nunca. */
  skipped: number;
  /** Temporadas que hubo que crear en la serie destino. */
  seasonsCreated: number;
  /** Los que pasaron a poder verse (creados + enriquecidos), para avisar a
   *  quienes siguen la serie una vez confirmada la transaccion. */
  available: Array<{ seasonNumber: number; episodeNumber: number }>;
}

export async function attachEpisodesToSeries(
  tx: Prisma.TransactionClient,
  targetSeriesId: number,
  seasons: AttachSeasonInput[],
  targetYear?: number | null
): Promise<AttachResult> {
  const result: AttachResult = {
    created: 0,
    enriched: 0,
    skipped: 0,
    seasonsCreated: 0,
    available: [],
  };

  for (const srcSeason of seasons) {
    let targetSeason = await tx.season.findFirst({
      where: { seriesId: targetSeriesId, seasonNumber: srcSeason.seasonNumber },
      select: { id: true },
    });

    if (!targetSeason) {
      targetSeason = await tx.season.create({
        data: {
          seriesId: targetSeriesId,
          seasonNumber: srcSeason.seasonNumber,
          episodeCount: srcSeason.episodes.length,
          year: targetYear ?? undefined,
        },
        select: { id: true },
      });
      result.seasonsCreated++;
    }

    // Se cargan de una todos los episodios existentes de la temporada para no
    // pegarle a la DB una vez por episodio: una serie tailandesa parte cada
    // capitulo en 4 videos, asi que una temporada puede traer 200 filas.
    const existing = await tx.episode.findMany({
      where: { seasonId: targetSeason.id },
      select: {
        id: true,
        episodeNumber: true,
        embedUrl: true,
        title: true,
        airDate: true,
      },
    });
    const existingByNumber = new Map(existing.map((e) => [e.episodeNumber, e]));

    for (const ep of srcSeason.episodes) {
      const match = existingByNumber.get(ep.episodeNumber);

      if (!match) {
        await tx.episode.create({
          data: {
            seasonId: targetSeason.id,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            embedUrl: ep.embedUrl,
            embedPlatform: ep.embedPlatform,
            embedVideoId: ep.embedVideoId,
            embedChannelName: ep.embedChannelName,
            embedChannelUrl: ep.embedChannelUrl,
            airDate: ep.airDate,
          },
        });
        result.created++;
        result.available.push({
          seasonNumber: srcSeason.seasonNumber,
          episodeNumber: ep.episodeNumber,
        });
        continue;
      }

      if (match.embedUrl) {
        // Ya se puede ver: no se pisa. Puede ser una fuente mejor que la que
        // estamos importando y la curadora no pidio reemplazarla.
        result.skipped++;
        continue;
      }

      await tx.episode.update({
        where: { id: match.id },
        data: {
          embedUrl: ep.embedUrl,
          embedPlatform: ep.embedPlatform,
          embedVideoId: ep.embedVideoId,
          embedChannelName: ep.embedChannelName,
          embedChannelUrl: ep.embedChannelUrl,
          // Titulo y fecha solo si el episodio no los tenia: la ficha curada
          // manda sobre los datos que vienen del titulo de un video.
          title: match.title ?? ep.title,
          airDate: match.airDate ?? ep.airDate,
        },
      });
      result.enriched++;
      result.available.push({
        seasonNumber: srcSeason.seasonNumber,
        episodeNumber: ep.episodeNumber,
      });
    }

    // El contador de la temporada queda alineado con la realidad.
    const total = await tx.episode.count({
      where: { seasonId: targetSeason.id },
    });
    await tx.season.update({
      where: { id: targetSeason.id },
      data: { episodeCount: total },
    });
  }

  return result;
}
