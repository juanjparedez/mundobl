/**
 * Database helper functions for MundoBL
 *
 * Este archivo proporciona funciones helpers para acceso fácil y type-safe
 * a la base de datos usando Prisma.
 */

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../generated/prisma';
import { isPlayableIn } from './playability';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;

// ============================================
// GLOSARIO CULTURAL
// ============================================

/** Terminos editoriales visibles en las superficies publicas del glosario. */
export async function getPublishedGlossaryTerms() {
  return prisma.glossaryTerm.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      slug: true,
      term: true,
      transliteration: true,
      country: true,
      category: true,
      meaning: true,
      context: true,
      commonMistake: true,
      examples: true,
      sourceName: true,
      sourceUrl: true,
      tags: {
        select: { tag: { select: { id: true, name: true } } },
      },
    },
    orderBy: [{ country: 'asc' }, { term: 'asc' }],
  });
}

// ============================================
// SERIES
// ============================================

/**
 * Obtener todas las series con información básica.
 *
 * Si se proporciona `userId`, incluye el `ViewStatus` filtrado por ese
 * usuario para que `/catalogo` muestre los badges (Visto/Viendo/etc.)
 * del usuario actual. Sin `userId`, NO se incluye `viewStatus` para
 * evitar que el cache global filtre datos de otro usuario.
 */
export async function getAllSeries(options?: {
  scope?: 'PERSONAL' | 'WATCHABLE_ONLY' | 'ALL';
  origin?: 'CURATED' | 'USER_EMBED' | 'ALL';
  userId?: string;
}) {
  const scope = options?.scope ?? 'ALL';
  const origin = options?.origin ?? 'ALL';
  const userId = options?.userId;
  const where: { catalogScope?: string; origin?: string } = {};
  if (scope !== 'ALL') where.catalogScope = scope;
  if (origin !== 'ALL') where.origin = origin;
  return await prisma.series.findMany({
    where: Object.keys(where).length === 0 ? undefined : where,
    include: {
      country: true,
      universe: true,
      seasons: {
        select: {
          id: true,
          seasonNumber: true,
          episodeCount: true,
        },
      },
      viewStatus: userId
        ? {
            select: { status: true },
            where: { userId },
            take: 1,
          }
        : {
            select: { status: true },
            where: { userId: '__none__' },
            take: 0,
          },
      tags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      genres: {
        select: {
          genre: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      title: 'asc',
    },
  });
}

/**
 * Series mirables: las que tienen al menos un episodio con embedUrl.
 * Incluye CURATED (PERSONAL + WATCHABLE_ONLY) y USER_EMBED, pero solo
 * las que tienen visibility='VISIBLE'. Usado por /ver.
 *
 * `market` es el ISO-2 del visitante y solo afecta a `playableEpisodes`
 * (cuantos embeds andan de verdad ahi). NO cambia que series se
 * devuelven: filtrar el listado por region se decide en la vista, no
 * aca, asi /ver puede elegir entre esconderlas o mostrarlas con aviso.
 */
export async function getWatchableSeries(market = 'AR') {
  const series = await prisma.series.findMany({
    where: {
      visibility: 'VISIBLE',
      seasons: {
        some: {
          episodes: {
            some: { embedUrl: { not: null } },
          },
        },
      },
    },
    include: {
      country: true,
      universe: true,
      submittedBy: {
        select: { id: true, name: true, nickname: true },
      },
      seasons: {
        select: {
          id: true,
          seasonNumber: true,
          title: true,
          episodes: {
            where: { embedUrl: { not: null } },
            select: {
              id: true,
              episodeNumber: true,
              embedPlatform: true,
              embedChannelName: true,
              embedUrl: true,
              playback: true,
              playbackBlockedMarkets: true,
            },
            orderBy: { episodeNumber: 'asc' },
          },
        },
        orderBy: { seasonNumber: 'asc' },
      },
      tags: {
        select: { tag: { select: { id: true, name: true } } },
      },
      linkedSeries: {
        select: { id: true, title: true, imageUrl: true },
      },
    },
    orderBy: { title: 'asc' },
  });

  return series.map((s) => {
    const episodesWithEmbed = s.seasons.reduce(
      (acc, season) => acc + season.episodes.length,
      0
    );
    const totalEpisodes = s.seasons.reduce((acc, season) => {
      // Aproximación: cuenta los episodios con embed (los que importan en /ver).
      // Si querés "X de Y disponibles", habría que cargar episodeCount aparte.
      return acc + season.episodes.length;
    }, 0);
    // Cuantos de esos embeds se pueden mirar de verdad desde `market`.
    // Un episodio sin sondear (UNKNOWN) cuenta como reproducible: ver
    // isPlayableIn en src/lib/playability.ts.
    const playableEpisodes = s.seasons.reduce(
      (acc, season) =>
        acc +
        season.episodes.filter((e) =>
          isPlayableIn(e.playback, e.playbackBlockedMarkets, market)
        ).length,
      0
    );
    return {
      ...s,
      episodesWithEmbed,
      totalEpisodes,
      playableEpisodes,
    };
  });
}

/**
 * Detalle para /ver/[id]: serie con todas las temporadas y episodios
 * embebidos. Solo retorna si visibility='VISIBLE' (admin/owner ven HIDDEN
 * via getWatchableSeriesByIdAdmin).
 */
export async function getWatchableSeriesById(id: number) {
  return await prisma.series.findFirst({
    where: { id, visibility: 'VISIBLE' },
    include: watchableInclude,
  });
}

/**
 * Variante admin de getWatchableSeriesById: no filtra visibility.
 * Usar solo desde rutas /admin y desde flow de owner que ya validaron sesion.
 */
export async function getWatchableSeriesByIdAdmin(id: number) {
  return await prisma.series.findUnique({
    where: { id },
    include: watchableInclude,
  });
}

/** Una serie tal como la ve el panel /admin/ver. */
export interface VerAdminRow {
  id: number;
  title: string;
  year: number | null;
  origin: string;
  catalogScope: string;
  visibility: string;
  geoRestrictedCore: boolean;
  submittedBy: string | null;
  platforms: string[];
  channels: string[];
  totalEmbeds: number;
  /** Desglose por estado del ultimo sondeo (ver Episode.playback). */
  playbackCounts: Record<string, number>;
  /** Episodios reproducibles en `market`. */
  playable: number;
  lastCheckedAt: string | null;
}

/**
 * Todo lo que hoy esta publicado en /ver, para administrarlo.
 *
 * A diferencia de `/admin/series` (que filtra `origin=CURATED`) y de
 * `/admin/series/user-submitted` (que filtra `origin=USER_EMBED`), esta
 * vista NO filtra por origen: muestra /ver tal como lo ve el visitante,
 * que es justo lo que faltaba para poder auditarlo. Ojo: es una vista de
 * ADMINISTRACION del contenido embebido, no mezcla los catalogos — lo
 * que se lista es "lo que tiene embed", nunca el catalogo curado entero.
 *
 * Incluye HIDDEN a proposito: si algo esta oculto, el admin tiene que
 * poder verlo y revertirlo.
 */
export async function getVerAdminRows(market = 'AR'): Promise<VerAdminRow[]> {
  const series = await prisma.series.findMany({
    where: {
      seasons: { some: { episodes: { some: { embedUrl: { not: null } } } } },
    },
    select: {
      id: true,
      title: true,
      year: true,
      origin: true,
      catalogScope: true,
      visibility: true,
      geoRestrictedCore: true,
      submittedBy: { select: { name: true, nickname: true } },
      seasons: {
        select: {
          episodes: {
            where: { embedUrl: { not: null } },
            select: {
              embedPlatform: true,
              embedChannelName: true,
              playback: true,
              playbackBlockedMarkets: true,
              playbackCheckedAt: true,
            },
          },
        },
      },
    },
    orderBy: { title: 'asc' },
  });

  return series.map((s) => {
    const eps = s.seasons.flatMap((season) => season.episodes);
    const playbackCounts: Record<string, number> = {};
    let lastChecked: Date | null = null;
    for (const e of eps) {
      playbackCounts[e.playback] = (playbackCounts[e.playback] ?? 0) + 1;
      if (
        e.playbackCheckedAt &&
        (!lastChecked || e.playbackCheckedAt > lastChecked)
      ) {
        lastChecked = e.playbackCheckedAt;
      }
    }
    return {
      id: s.id,
      title: s.title,
      year: s.year,
      origin: s.origin,
      catalogScope: s.catalogScope,
      visibility: s.visibility,
      geoRestrictedCore: s.geoRestrictedCore,
      submittedBy: s.submittedBy?.nickname ?? s.submittedBy?.name ?? null,
      platforms: Array.from(
        new Set(eps.map((e) => e.embedPlatform).filter((p): p is string => !!p))
      ),
      channels: Array.from(
        new Set(
          eps.map((e) => e.embedChannelName).filter((c): c is string => !!c)
        )
      ),
      totalEmbeds: eps.length,
      playbackCounts,
      playable: eps.filter((e) =>
        isPlayableIn(e.playback, e.playbackBlockedMarkets, market)
      ).length,
      lastCheckedAt: lastChecked ? lastChecked.toISOString() : null,
    };
  });
}

const watchableInclude = Prisma.validator<Prisma.SeriesInclude>()({
  country: true,
  universe: true,
  productionCompany: {
    select: { id: true, name: true },
  },
  submittedBy: {
    select: { id: true, name: true, nickname: true, role: true },
  },
  linkedSeries: {
    select: {
      id: true,
      title: true,
      imageUrl: true,
      synopsis: true,
      year: true,
    },
  },
  actors: {
    include: {
      actor: {
        select: { id: true, name: true, stageName: true, imageUrl: true },
      },
    },
    take: 8,
  },
  seasons: {
    include: {
      episodes: {
        orderBy: { episodeNumber: 'asc' },
      },
    },
    orderBy: { seasonNumber: 'asc' },
  },
  directors: {
    include: { director: { select: { id: true, name: true } } },
  },
  tags: {
    select: { tag: { select: { id: true, name: true } } },
  },
  genres: {
    select: { genre: { select: { id: true, name: true } } },
  },
});

/**
 * Carga liviana de los filtros "extendidos" del catálogo (género, director,
 * actor, productora, idioma). Sólo IDs y nombres, sin includes anidados —
 * sirve para deep-links del detalle sin inflar getAllSeries.
 */
export async function getCatalogFilterIndex() {
  // Solo se indexa para series PERSONAL + CURATED — el catalogo principal
  // no muestra WATCHABLE_ONLY ni USER_EMBED, asi que sus actores/generos/
  // etc. no deben aparecer como opciones de filtro.
  const personalScope = {
    series: { catalogScope: 'PERSONAL', origin: 'CURATED' },
  };
  const [genres, directors, actors, productionCompanies, languages, platforms] =
    await Promise.all([
      prisma.seriesGenre.findMany({
        where: personalScope,
        select: { seriesId: true, genre: { select: { name: true } } },
      }),
      prisma.seriesDirector.findMany({
        where: personalScope,
        select: { seriesId: true, director: { select: { name: true } } },
      }),
      prisma.seriesActor.findMany({
        where: personalScope,
        select: { seriesId: true, actor: { select: { name: true } } },
      }),
      prisma.series.findMany({
        where: {
          productionCompanyId: { not: null },
          catalogScope: 'PERSONAL',
          origin: 'CURATED',
        },
        select: {
          id: true,
          productionCompany: { select: { name: true } },
        },
      }),
      prisma.series.findMany({
        where: {
          originalLanguageId: { not: null },
          catalogScope: 'PERSONAL',
          origin: 'CURATED',
        },
        select: {
          id: true,
          originalLanguage: { select: { name: true } },
        },
      }),
      prisma.watchLink.findMany({
        where: personalScope,
        select: { seriesId: true, platform: true },
      }),
    ]);

  return {
    genres,
    directors,
    actors,
    productionCompanies,
    languages,
    platforms,
  };
}

/**
 * Obtener una serie por ID con toda la información (publico). Devuelve null
 * si origin='USER_EMBED' — los detalles user-submitted viven solo en /ver,
 * no en /series/[id]. Para acceso admin, usar getSeriesByIdAdmin.
 *
 * Si se pasa `userId`, los includes de `viewStatus` (a nivel serie, season
 * y episode) se filtran por ese usuario para que el render publico no
 * exponga el estado de otros usuarios.
 */
export async function getSeriesById(id: number, userId?: string) {
  return await prisma.series.findFirst({
    where: { id, origin: 'CURATED' },
    include: buildSeriesFullInclude(userId),
  });
}

/**
 * Variante admin: no filtra origin y trae TODOS los viewStatuses (para
 * que el admin pueda ver el estado de todos los usuarios). Usar solo
 * desde rutas /admin que ya validaron sesion ADMIN/MODERATOR.
 */
export async function getSeriesByIdAdmin(id: number) {
  return await prisma.series.findUnique({
    where: { id },
    include: buildSeriesFullInclude(undefined, { adminViewAll: true }),
  });
}

// Filter helper para viewStatus segun el userId:
// - userId presente: trae solo el row del usuario actual (take: 1)
// - userId ausente + adminViewAll: trae TODO (vista admin completa)
// - userId ausente + !adminViewAll: NO trae nada (vista publica anonima)
function viewStatusFilter(userId?: string, adminViewAll = false) {
  if (userId) return { where: { userId }, take: 1 };
  if (adminViewAll) return true as const;
  return { where: { userId: '__none__' }, take: 0 };
}

function buildSeriesFullInclude(
  userId?: string,
  opts: { adminViewAll?: boolean } = {}
) {
  const vs = viewStatusFilter(userId, opts.adminViewAll);
  return {
    country: true,
    universe: true,
    seasons: {
      include: {
        actors: {
          include: {
            actor: true,
          },
        },
        episodes: {
          include: {
            viewStatus: vs,
            // Solo el conteo para el badge de EpisodesList — el contenido
            // (con replies + user de cada comentario) se pide bajo demanda
            // via GET /api/episodes/[id]/comments cuando el usuario expande
            // esa fila (CommentsList ya hace ese fetch). Antes esto traia
            // el arbol completo de TODOS los episodios en cada carga de
            // /series/[id], se expandiera algo o no.
            _count: {
              select: { comments: { where: { parentId: null } } },
            },
          },
          orderBy: {
            episodeNumber: 'asc',
          },
        },
        ratings: true,
        viewStatus: vs,
      },
      orderBy: {
        seasonNumber: 'asc',
      },
    },
    actors: {
      include: {
        actor: true,
      },
    },
    directors: {
      include: {
        director: true,
      },
    },
    ratings: true,
    // Removido: CommentsSection pide GET /api/series/[id]/comments por su
    // cuenta al montar (mismo criterio que el resto). El query anterior ni
    // siquiera filtraba parentId=null ni sanitizaba isAnonymous/isPrivate
    // como si hace la ruta de API — mezclaba replies como si fueran
    // comentarios de primer nivel.
    viewStatus: vs,
    tags: {
      include: {
        tag: true,
      },
    },
    infoBlocks: {
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    },
    productionCompany: true,
    originalLanguage: true,
    dubbings: {
      include: {
        language: true,
      },
    },
    genres: {
      include: {
        genre: true,
      },
    },
    watchLinks: true,
    relatedSeriesFrom: {
      include: {
        relatedSeries: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            imageThumbUrl: true,
            imagePosition: true,
            year: true,
            type: true,
          },
        },
      },
    },
    relatedSeriesTo: {
      include: {
        mainSeries: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            imageThumbUrl: true,
            imagePosition: true,
            year: true,
            type: true,
          },
        },
      },
    },
    // User-embeds que se asociaron a esta serie CURATED via /ver/agregar.
    // Para mostrar badge "También disponible para ver →" en /series/[id].
    // Solo trae los VISIBLE — si el admin escondió alguno, no aparece.
    linkedFromUserEmbeds: {
      where: { origin: 'USER_EMBED', visibility: 'VISIBLE' },
      select: { id: true, title: true },
    },
  } satisfies Prisma.SeriesInclude;
}

// ============================================
// ACTORES
// ============================================

/**
 * Campos de Series seguros para una tarjeta de filmografia publica.
 *
 * Es la lista blanca que usan las fichas de actor y director. Excluye a
 * proposito `review`, `observations` y `notesPrivate` (notas privadas de
 * curaduria) y todo el resto de columnas pesadas que la tarjeta no usa.
 */
const PUBLIC_SERIES_CARD_SELECT = {
  id: true,
  title: true,
  year: true,
  type: true,
  imageUrl: true,
  imageThumbUrl: true,
  // La sinopsis es publica (se muestra en /series/[id]) y la necesita la
  // vista rapida de las tarjetas: sin ella el preview no diria nada que
  // la propia tarjeta no muestre ya.
  synopsis: true,
  country: { select: { name: true, code: true } },
} as const;

/**
 * Obtener un actor por ID con sus series
 */
export async function getActorById(id: number) {
  // Filtra series por origin='CURATED' y catalogScope='PERSONAL' — los
  // actores asociados a USER_EMBED no exponen sus aportes en /actores/[id].
  //
  // `select` explicito, no `include`: la ficha de actor es publica y su
  // componente de render es 'use client', asi que TODO lo que traigamos
  // viaja en el payload RSC del HTML. Con `include` se colaban `review`,
  // `observations` y `notesPrivate` de cada serie (notas privadas de
  // curaduria). Al agregar un campo aca, chequear que sea publicable.
  return await prisma.actor.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      stageName: true,
      birthDate: true,
      nationality: true,
      imageUrl: true,
      biography: true,
      funFacts: true,
      isPlaceholder: true,
      aliases: true,
      imdbUrl: true,
      mdlUrl: true,
      wikiUrl: true,
      series: {
        where: { series: { origin: 'CURATED', catalogScope: 'PERSONAL' } },
        select: {
          character: true,
          isMain: true,
          series: { select: PUBLIC_SERIES_CARD_SELECT },
        },
      },
      seasons: {
        where: {
          season: {
            series: { origin: 'CURATED', catalogScope: 'PERSONAL' },
          },
        },
        select: {
          character: true,
          isMain: true,
          season: {
            select: {
              seasonNumber: true,
              series: { select: PUBLIC_SERIES_CARD_SELECT },
            },
          },
        },
      },
    },
  });
}

/**
 * Obtener todos los actores con conteo de series/temporadas
 */
export async function getAllActorsWithCount() {
  // _count.series cuenta solo CURATED+PERSONAL: actores que solo aparecen
  // en USER_EMBED no inflan el listing /actores.
  return await prisma.actor.findMany({
    include: {
      _count: {
        select: {
          series: {
            where: {
              series: { origin: 'CURATED', catalogScope: 'PERSONAL' },
            },
          },
          seasons: {
            where: {
              season: {
                series: { origin: 'CURATED', catalogScope: 'PERSONAL' },
              },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

// ============================================
// DIRECTORES
// ============================================

/**
 * Obtener todos los directores con conteo de series
 */
export async function getAllDirectorsWithCount() {
  return await prisma.director.findMany({
    include: {
      _count: {
        select: {
          series: {
            where: {
              series: { origin: 'CURATED', catalogScope: 'PERSONAL' },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Obtener un director por ID con sus series
 */
export async function getDirectorById(id: number) {
  // Mismo criterio que getActorById: `select` explicito porque la ficha es
  // publica y se renderiza en un client component.
  return await prisma.director.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      nationality: true,
      imageUrl: true,
      biography: true,
      aliases: true,
      imdbUrl: true,
      mdlUrl: true,
      wikiUrl: true,
      birthYear: true,
      awards: true,
      series: {
        where: { series: { origin: 'CURATED', catalogScope: 'PERSONAL' } },
        select: {
          series: {
            select: { ...PUBLIC_SERIES_CARD_SELECT, overallRating: true },
          },
        },
      },
    },
  });
}

// ============================================
// INDICES PUBLICOS DE PERSONAS Y PRODUCTORAS
// ============================================

/**
 * Listados paginados para /actores, /directores y /productoras.
 *
 * Van en SQL crudo a proposito: Prisma no sabe ordenar por un `_count`
 * FILTRADO (necesitamos contar solo creditos en series CURATED+PERSONAL, para
 * respetar la separacion con el catalogo de /ver), y ordenar por relevancia es
 * justo lo que hace util a estos indices — alfabetico deja arriba a los 910
 * actores de un solo credito. Asi el conteo, el orden y el limite ocurren en
 * una sola query, sin traer la tabla entera a memoria.
 */

export type PeopleSort = 'credits' | 'az' | 'za';

export interface PersonIndexRow {
  id: number;
  name: string;
  stageName: string | null;
  imageUrl: string | null;
  nationality: string | null;
  biography: string | null;
  creditCount: number;
}

export interface PeopleIndexResult<T> {
  rows: T[];
  total: number;
}

function personOrderBy(sort: PeopleSort): Prisma.Sql {
  switch (sort) {
    case 'az':
      return Prisma.sql`ORDER BY p.name ASC`;
    case 'za':
      return Prisma.sql`ORDER BY p.name DESC`;
    default:
      return Prisma.sql`ORDER BY "creditCount" DESC, p.name ASC`;
  }
}

export async function getActorsIndex(options?: {
  q?: string;
  nationality?: string;
  sort?: PeopleSort;
  page?: number;
  perPage?: number;
}): Promise<PeopleIndexResult<PersonIndexRow>> {
  const page = Math.max(1, options?.page ?? 1);
  const perPage = Math.min(120, Math.max(1, options?.perPage ?? 48));
  const offset = (page - 1) * perPage;
  const q = options?.q?.trim();
  const nationality = options?.nationality?.trim();

  // El placeholder "Actor no identificado" no es una persona (ver
  // src/lib/placeholder-actor.ts): nunca entra a los listados publicos.
  const where = Prisma.sql`
    WHERE p."isPlaceholder" = false
    ${q ? Prisma.sql`AND (p.name ILIKE ${'%' + q + '%'} OR p."stageName" ILIKE ${'%' + q + '%'})` : Prisma.empty}
    ${nationality ? Prisma.sql`AND p.nationality = ${nationality}` : Prisma.empty}
  `;

  const [rows, totalRows] = await Promise.all([
    prisma.$queryRaw<PersonIndexRow[]>(
      Prisma.sql`
      SELECT p.id, p.name, p."stageName", p."imageUrl", p.nationality,
             p.biography,
             (
               COALESCE((
                 SELECT COUNT(*) FROM "SeriesActor" sa
                 JOIN "Series" s ON s.id = sa."seriesId"
                 WHERE sa."actorId" = p.id
                   AND s.origin = 'CURATED' AND s."catalogScope" = 'PERSONAL'
               ), 0)
               + COALESCE((
                 SELECT COUNT(*) FROM "SeasonActor" sea
                 JOIN "Season" se ON se.id = sea."seasonId"
                 JOIN "Series" s2 ON s2.id = se."seriesId"
                 WHERE sea."actorId" = p.id
                   AND s2.origin = 'CURATED' AND s2."catalogScope" = 'PERSONAL'
               ), 0)
             )::int AS "creditCount"
      FROM "Actor" p
      ${where}
      ${personOrderBy(options?.sort ?? 'credits')}
      LIMIT ${perPage} OFFSET ${offset}
    `
    ),
    prisma.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`
      SELECT COUNT(*)::bigint AS count FROM "Actor" p ${where}
    `
    ),
  ]);

  return { rows, total: Number(totalRows[0]?.count ?? 0) };
}

export async function getDirectorsIndex(options?: {
  q?: string;
  nationality?: string;
  sort?: PeopleSort;
  page?: number;
  perPage?: number;
}): Promise<PeopleIndexResult<PersonIndexRow>> {
  const page = Math.max(1, options?.page ?? 1);
  const perPage = Math.min(120, Math.max(1, options?.perPage ?? 48));
  const offset = (page - 1) * perPage;
  const q = options?.q?.trim();
  const nationality = options?.nationality?.trim();

  const where = Prisma.sql`
    WHERE TRUE
    ${q ? Prisma.sql`AND p.name ILIKE ${'%' + q + '%'}` : Prisma.empty}
    ${nationality ? Prisma.sql`AND p.nationality = ${nationality}` : Prisma.empty}
  `;

  const [rows, totalRows] = await Promise.all([
    prisma.$queryRaw<PersonIndexRow[]>(
      Prisma.sql`
      SELECT p.id, p.name, NULL::text AS "stageName", p."imageUrl",
             p.nationality, p.biography,
             COALESCE((
               SELECT COUNT(*) FROM "SeriesDirector" sd
               JOIN "Series" s ON s.id = sd."seriesId"
               WHERE sd."directorId" = p.id
                 AND s.origin = 'CURATED' AND s."catalogScope" = 'PERSONAL'
             ), 0)::int AS "creditCount"
      FROM "Director" p
      ${where}
      ${personOrderBy(options?.sort ?? 'credits')}
      LIMIT ${perPage} OFFSET ${offset}
    `
    ),
    prisma.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`
      SELECT COUNT(*)::bigint AS count FROM "Director" p ${where}
    `
    ),
  ]);

  return { rows, total: Number(totalRows[0]?.count ?? 0) };
}

export interface CompanyIndexRow {
  id: number;
  name: string;
  imageUrl: string | null;
  description: string | null;
  countryName: string | null;
  seriesCount: number;
}

export async function getProductionCompaniesIndex(options?: {
  q?: string;
  sort?: PeopleSort;
  page?: number;
  perPage?: number;
}): Promise<PeopleIndexResult<CompanyIndexRow>> {
  const page = Math.max(1, options?.page ?? 1);
  const perPage = Math.min(120, Math.max(1, options?.perPage ?? 48));
  const offset = (page - 1) * perPage;
  const q = options?.q?.trim();

  const where = Prisma.sql`
    WHERE TRUE
    ${q ? Prisma.sql`AND p.name ILIKE ${'%' + q + '%'}` : Prisma.empty}
  `;

  // Cuenta sobre SeriesProductionCompany (co-producciones), no sobre la
  // relacion legacy 1-a-N.
  const orderBy =
    options?.sort === 'az'
      ? Prisma.sql`ORDER BY p.name ASC`
      : options?.sort === 'za'
        ? Prisma.sql`ORDER BY p.name DESC`
        : Prisma.sql`ORDER BY "seriesCount" DESC, p.name ASC`;

  const [rows, totalRows] = await Promise.all([
    prisma.$queryRaw<CompanyIndexRow[]>(
      Prisma.sql`
      SELECT p.id, p.name, p."imageUrl", p.description,
             c.name AS "countryName",
             COALESCE((
               SELECT COUNT(*) FROM "SeriesProductionCompany" spc
               JOIN "Series" s ON s.id = spc."seriesId"
               WHERE spc."productionCompanyId" = p.id
                 AND s.origin = 'CURATED' AND s."catalogScope" = 'PERSONAL'
             ), 0)::int AS "seriesCount"
      FROM "ProductionCompany" p
      LEFT JOIN "Country" c ON c.id = p."countryId"
      ${where}
      ${orderBy}
      LIMIT ${perPage} OFFSET ${offset}
    `
    ),
    prisma.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`
      SELECT COUNT(*)::bigint AS count FROM "ProductionCompany" p ${where}
    `
    ),
  ]);

  return { rows, total: Number(totalRows[0]?.count ?? 0) };
}

/** Ficha publica de productora: datos + filmografia curada. */
export async function getProductionCompanyById(id: number) {
  return await prisma.productionCompany.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      websiteUrl: true,
      youtubeUrl: true,
      foundedYear: true,
      country: true,
      countryRef: { select: { name: true, code: true } },
      seriesLinks: {
        where: {
          series: { origin: 'CURATED', catalogScope: 'PERSONAL' },
        },
        select: { series: { select: PUBLIC_SERIES_CARD_SELECT } },
      },
    },
  });
}

/** Nacionalidades disponibles, para el filtro de los indices. */
export async function getPeopleNationalities(): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ nationality: string }[]>(
    Prisma.sql`
    SELECT DISTINCT nationality FROM (
      SELECT nationality FROM "Actor" WHERE nationality IS NOT NULL
      UNION
      SELECT nationality FROM "Director" WHERE nationality IS NOT NULL
    ) t
    ORDER BY nationality ASC
  `
  );
  return rows.map((r) => r.nationality);
}

/**
 * Id del director homonimo, si existe.
 *
 * Hay personas que actuan y dirigen (5 en el catalogo). Cada una vive en dos
 * tablas distintas y hasta ahora sus fichas no se conocian entre si. Unificar
 * Actor y Director en un modelo `Person` seria un cambio grande para 5 casos:
 * alcanza con cruzar los links.
 */
export async function findDirectorIdByName(
  name: string
): Promise<number | null> {
  const director = await prisma.director.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
  });
  return director?.id ?? null;
}

/** Contraparte: id del actor homonimo, para la ficha de director. */
export async function findActorIdByName(name: string): Promise<number | null> {
  const actor = await prisma.actor.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      isPlaceholder: false,
    },
    select: { id: true },
  });
  return actor?.id ?? null;
}

// ============================================
// TAGS
// ============================================

/**
 * Obtener un tag por ID con todas sus series
 */
export async function getTagById(id: number) {
  // Filtra series por origin='CURATED' y catalogScope='PERSONAL' — los tags
  // de USER_EMBED no exponen sus aportes en /tags/[id].
  // `select` explicito por el mismo motivo que getActorById: /tags/[id] es
  // publica y renderiza en un client component, asi que `include` filtraba
  // `review`/`observations`/`notesPrivate` al payload RSC.
  return await prisma.tag.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      category: true,
      series: {
        where: { series: { origin: 'CURATED', catalogScope: 'PERSONAL' } },
        select: {
          series: {
            select: {
              ...PUBLIC_SERIES_CARD_SELECT,
              universe: { select: { name: true } },
            },
          },
        },
      },
    },
  });
}

// ============================================
// PAÍSES
// ============================================

/**
 * Obtener todos los países con conteo de series
 */
export async function getAllCountries() {
  const countries = await prisma.country.findMany({
    include: {
      _count: {
        select: {
          series: {
            where: { origin: 'CURATED', catalogScope: 'PERSONAL' },
          },
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return countries;
}

/**
 * Obtener todos los géneros
 */
export async function getAllGenres() {
  return await prisma.genre.findMany({
    orderBy: {
      name: 'asc',
    },
  });
}

// ============================================
// ESTADÍSTICAS
// ============================================

/**
 * Obtener estadísticas generales de la base de datos
 */
export async function getStats() {
  const [
    totalSeries,
    totalSeasons,
    totalActors,
    totalCountries,
    totalEpisodes,
  ] = await Promise.all([
    prisma.series.count(),
    prisma.season.count(),
    prisma.actor.count(),
    prisma.country.count(),
    prisma.episode.count(),
  ]);

  return {
    totalSeries,
    totalSeasons,
    totalActors,
    totalCountries,
    totalEpisodes,
  };
}

// ============================================
// PANEL DE COLABORADOR (rol COLLABORATOR)
// ============================================

export interface CollaboratorStats {
  totalWatching: number;
  totalWatched: number;
  totalFavorites: number;
  totalComments: number;
  totalReviews: number;
  totalSubscriptions: number;
}

/**
 * Estadisticas agregadas de los aportes de un colaborador externo
 * (Series con origin=USER_EMBED, submittedById=userId). Mismo patron de
 * agregacion anonima que /api/stats/public: solo counts, nunca se expone
 * identidad de quien vio/comento/voto — ni siquiera al propio colaborador
 * dueño del contenido.
 */
export async function getCollaboratorStats(
  userId: string
): Promise<CollaboratorStats> {
  const series = await prisma.series.findMany({
    where: { origin: 'USER_EMBED', submittedById: userId },
    select: { id: true },
  });
  const seriesIds = series.map((s) => s.id);

  if (seriesIds.length === 0) {
    return {
      totalWatching: 0,
      totalWatched: 0,
      totalFavorites: 0,
      totalComments: 0,
      totalReviews: 0,
      totalSubscriptions: 0,
    };
  }

  const [
    totalWatching,
    totalWatched,
    totalFavorites,
    totalComments,
    totalReviews,
    totalSubscriptions,
  ] = await Promise.all([
    prisma.viewStatus.count({
      where: { seriesId: { in: seriesIds }, status: 'VIENDO' },
    }),
    prisma.viewStatus.count({
      where: { seriesId: { in: seriesIds }, status: 'VISTA' },
    }),
    prisma.userFavorite.count({ where: { seriesId: { in: seriesIds } } }),
    prisma.comment.count({ where: { seriesId: { in: seriesIds } } }),
    prisma.review.count({ where: { seriesId: { in: seriesIds } } }),
    prisma.seriesSubscription.count({ where: { seriesId: { in: seriesIds } } }),
  ]);

  return {
    totalWatching,
    totalWatched,
    totalFavorites,
    totalComments,
    totalReviews,
    totalSubscriptions,
  };
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Cerrar la conexión a la base de datos
 */
export async function disconnect() {
  await prisma.$disconnect();
}
