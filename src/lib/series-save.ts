import { Prisma } from '@/generated/prisma';
import { prepareUniverseSlot, prisma, resolveBasedOnValue } from './database';
import { getCountryCode } from './country-codes';
import { findOrCreateProductionCompany } from './tag-utils';
import {
  actorRowKey,
  cleanNames,
  dedupeActorRows,
  diffIdSets,
  nameKey,
  sameSequence,
  watchLinkRowKey,
  type ActorRow,
  type WatchLinkRow,
} from './series-relations';

/** La ficha cambio desde que se abrio el form: el guardado no se aplica. */
export class SeriesEditConflictError extends Error {
  constructor() {
    super('EDIT_CONFLICT');
  }
}

export const EDIT_CONFLICT_CODE = 'EDIT_CONFLICT';

interface NamedRow {
  id: number;
  name: string;
}

/**
 * Nombres -> ids en lote: 1 consulta si ya existen todos, 3 si hay nuevos.
 * Reemplaza al `findOrCreate*` por nombre, que eran 1-2 viajes por item.
 *
 * Va FUERA de la transaccion del guardado a proposito: `createMany` con
 * `skipDuplicates` resuelve la carrera sin tirar P2002, pero un error dentro
 * de una transaccion de Postgres la aborta entera. Un tag creado y despues no
 * usado (si el guardado falla) es inofensivo, igual que antes.
 *
 * Mismo criterio de match que findOrCreateTag: sin distinguir mayusculas ni
 * espacios de los bordes. Ante duplicados historicos gana el id mas bajo.
 */
async function resolveNamedIds(
  rawNames: readonly unknown[],
  find: (names: string[]) => Promise<NamedRow[]>,
  create: (names: string[]) => Promise<unknown>
): Promise<Map<string, number>> {
  const names = cleanNames(rawNames);
  const ids = new Map<string, number>();
  if (names.length === 0) return ids;
  const index = (rows: NamedRow[]) => {
    for (const row of rows) {
      const key = nameKey(row.name);
      if (!ids.has(key)) ids.set(key, row.id);
    }
  };
  index(await find(names));
  const missing = names.filter((name) => !ids.has(nameKey(name)));
  if (missing.length > 0) {
    await create(missing);
    index(await find(missing));
  }
  return ids;
}

const byName = (names: string[]) => ({
  where: { name: { in: names, mode: 'insensitive' as const } },
  select: { id: true, name: true },
  orderBy: { id: 'asc' as const },
});

export const resolveTagIds = (names: readonly unknown[]) =>
  resolveNamedIds(
    names,
    (n) => prisma.tag.findMany(byName(n)),
    (n) =>
      prisma.tag.createMany({
        data: n.map((name) => ({ name, category: 'trope' })),
        skipDuplicates: true,
      })
  );

export const resolveGenreIds = (names: readonly unknown[]) =>
  resolveNamedIds(
    names,
    (n) => prisma.genre.findMany(byName(n)),
    (n) =>
      prisma.genre.createMany({
        data: n.map((name) => ({ name })),
        skipDuplicates: true,
      })
  );

export const resolveActorIds = (names: readonly unknown[]) =>
  resolveNamedIds(
    names,
    (n) => prisma.actor.findMany(byName(n)),
    (n) =>
      prisma.actor.createMany({
        data: n.map((name) => ({ name })),
        skipDuplicates: true,
      })
  );

export const resolveDirectorIds = (names: readonly unknown[]) =>
  resolveNamedIds(
    names,
    (n) => prisma.director.findMany(byName(n)),
    (n) =>
      prisma.director.createMany({
        data: n.map((name) => ({ name })),
        skipDuplicates: true,
      })
  );

/**
 * Todo lo que el form puede pisar, en una sola consulta. Sirve para dos cosas:
 * la foto de SeriesRevision y el estado actual contra el que se calcula el
 * diff de relaciones (asi el diff no paga consultas propias).
 */
export function loadSeriesForSave(
  tx: Prisma.TransactionClient,
  seriesId: number
) {
  return tx.series.findUnique({
    where: { id: seriesId },
    include: {
      actors: {
        orderBy: { id: 'asc' },
        include: { actor: { select: { name: true } } },
      },
      directors: { include: { director: { select: { name: true } } } },
      tags: { include: { tag: { select: { name: true } } } },
      genres: { include: { genre: { select: { name: true } } } },
      dubbings: true,
      watchLinks: { orderBy: { id: 'asc' } },
      relatedSeriesFrom: { select: { relatedSeriesId: true } },
      relatedSeriesTo: { select: { mainSeriesId: true } },
      seasons: { orderBy: { seasonNumber: 'asc' } },
      infoBlocks: { orderBy: { sortOrder: 'asc' } },
      country: { select: { name: true } },
      productionCompany: { select: { name: true } },
      originalLanguage: { select: { name: true } },
    },
  });
}

export type SeriesForSave = NonNullable<
  Awaited<ReturnType<typeof loadSeriesForSave>>
>;

/** Guarda la foto previa al guardado. Va dentro de la transaccion. */
export function recordSeriesRevision(
  tx: Prisma.TransactionClient,
  current: SeriesForSave,
  userId: string | null,
  source: 'admin-form' | 'collaborator'
) {
  return tx.seriesRevision.create({
    data: {
      seriesId: current.id,
      editVersion: current.editVersion,
      userId,
      source,
      // Ida y vuelta por JSON: Prisma.InputJsonValue no acepta Date.
      snapshot: JSON.parse(JSON.stringify(current)) as Prisma.InputJsonValue,
    },
  });
}

/**
 * Relaciones que trae el form, ya resueltas a ids. `undefined` = el form no
 * mando ese campo: no se toca (mismo contrato que el PUT anterior).
 */
export interface SeriesRelationsInput {
  actors?: ActorRow[];
  directorIds?: number[];
  dubbingIds?: number[];
  tagIds?: number[];
  genreIds?: number[];
  watchLinks?: WatchLinkRow[];
  relatedSeriesIds?: number[];
}

async function syncIdSet(
  current: readonly number[],
  desired: readonly number[] | undefined,
  remove: (ids: number[]) => Promise<unknown>,
  add: (ids: number[]) => Promise<unknown>
): Promise<void> {
  if (!desired) return;
  const { toDelete, toCreate } = diffIdSets(current, desired);
  if (toDelete.length > 0) await remove(toDelete);
  if (toCreate.length > 0) await add(toCreate);
}

/**
 * Aplica solo lo que cambio. Sin cambios en una relacion, cero consultas para
 * ella. Va dentro de la transaccion del guardado: o entra todo o nada.
 */
export async function syncSeriesRelations(
  tx: Prisma.TransactionClient,
  current: SeriesForSave,
  input: SeriesRelationsInput
): Promise<void> {
  const seriesId = current.id;

  if (input.actors) {
    const desired = dedupeActorRows(input.actors);
    const existing: ActorRow[] = current.actors.map((row) => ({
      actorId: row.actorId,
      character: row.character ?? '',
      isMain: row.isMain,
      pairingGroup: row.pairingGroup,
    }));
    // El orden del reparto es el del form: si cambio algo, se reescribe la
    // lista entera (dentro de la transaccion, asi que nunca queda a medias).
    if (!sameSequence(existing, desired, actorRowKey)) {
      await tx.seriesActor.deleteMany({ where: { seriesId } });
      if (desired.length > 0) {
        await tx.seriesActor.createMany({
          data: desired.map((row) => ({ ...row, seriesId })),
        });
      }
    }
  }

  await syncIdSet(
    current.directors.map((row) => row.directorId),
    input.directorIds,
    (ids) =>
      tx.seriesDirector.deleteMany({
        where: { seriesId, directorId: { in: ids } },
      }),
    (ids) =>
      tx.seriesDirector.createMany({
        data: ids.map((directorId) => ({ seriesId, directorId })),
      })
  );

  await syncIdSet(
    current.dubbings.map((row) => row.languageId),
    input.dubbingIds,
    (ids) =>
      tx.seriesDubbing.deleteMany({
        where: { seriesId, languageId: { in: ids } },
      }),
    (ids) =>
      tx.seriesDubbing.createMany({
        data: ids.map((languageId) => ({ seriesId, languageId })),
      })
  );

  await syncIdSet(
    current.tags.map((row) => row.tagId),
    input.tagIds,
    (ids) =>
      tx.seriesTag.deleteMany({ where: { seriesId, tagId: { in: ids } } }),
    (ids) =>
      tx.seriesTag.createMany({
        data: ids.map((tagId) => ({ seriesId, tagId })),
      })
  );

  await syncIdSet(
    current.genres.map((row) => row.genreId),
    input.genreIds,
    (ids) =>
      tx.seriesGenre.deleteMany({
        where: { seriesId, genreId: { in: ids } },
      }),
    (ids) =>
      tx.seriesGenre.createMany({
        data: ids.map((genreId) => ({ seriesId, genreId })),
      })
  );

  if (input.watchLinks) {
    const existing: WatchLinkRow[] = current.watchLinks.map((row) => ({
      platform: row.platform,
      url: row.url,
      official: row.official,
    }));
    if (!sameSequence(existing, input.watchLinks, watchLinkRowKey)) {
      await tx.watchLink.deleteMany({ where: { seriesId } });
      if (input.watchLinks.length > 0) {
        await tx.watchLink.createMany({
          data: input.watchLinks.map((row) => ({ ...row, seriesId })),
        });
      }
    }
  }

  if (input.relatedSeriesIds) {
    // Bidireccional: la relacion se guarda en las dos direcciones.
    const desired = [...new Set(input.relatedSeriesIds)].filter(
      (id) => id !== seriesId
    );
    const from = current.relatedSeriesFrom.map((row) => row.relatedSeriesId);
    const to = current.relatedSeriesTo.map((row) => row.mainSeriesId);
    const fromDiff = diffIdSets(from, desired);
    const toDiff = diffIdSets(to, desired);
    const changed =
      fromDiff.toDelete.length +
        fromDiff.toCreate.length +
        toDiff.toDelete.length +
        toDiff.toCreate.length >
      0;
    if (changed) {
      await tx.relatedSeries.deleteMany({
        where: {
          OR: [
            { mainSeriesId: seriesId, relatedSeriesId: { notIn: desired } },
            { relatedSeriesId: seriesId, mainSeriesId: { notIn: desired } },
          ],
        },
      });
      if (desired.length > 0) {
        await tx.relatedSeries.createMany({
          data: desired.flatMap((relatedId) => [
            { mainSeriesId: seriesId, relatedSeriesId: relatedId },
            { mainSeriesId: relatedId, relatedSeriesId: seriesId },
          ]),
          skipDuplicates: true,
        });
      }
    }
  }
}

/**
 * La version que manda el form. Sin version (una pestaña abierta antes de
 * este cambio) no se puede saber si esta vieja: se trata como conflicto.
 */
export function parseExpectedEditVersion(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

/** Lo que manda SeriesForm en modo edicion (ver /admin/series/[id]/editar). */
export interface SeriesFormBody {
  title: string;
  editVersion?: unknown;
  originalTitle?: string | null;
  year?: string | number | null;
  type?: string | null;
  durationMinutes?: string | number | null;
  basedOn?: string | null;
  format?: string | null;
  imageUrl?: string | null;
  imageThumbUrl?: string | null;
  imagePosition?: string | null;
  synopsis?: string | null;
  review?: string | null;
  soundtrack?: string | null;
  overallRating?: string | number | null;
  observations?: string | null;
  notesPrivate?: boolean;
  featured?: boolean;
  featuredOrder?: number;
  airDays?: string | null;
  catalogScope?: string;
  universeId?: string | number | null;
  isUniverseMain?: boolean;
  countryId?: string | number | null;
  countryName?: string;
  productionCompanyId?: number | null;
  productionCompanyName?: string;
  originalLanguageId?: number | null;
  originalLanguageName?: string;
  actors?: Array<{
    name?: string;
    character?: string;
    isMain?: boolean;
    pairingGroup?: number | null;
  }>;
  directors?: Array<{ name?: string }>;
  dubbingIds?: unknown[] | null;
  tags?: unknown[] | null;
  genres?: unknown[] | null;
  watchLinks?: Array<{
    platform?: string;
    url?: string;
    official?: boolean;
  }> | null;
  relatedSeriesIds?: unknown[] | null;
  seasons?: SeasonInput[] | null;
}

interface SeasonInput {
  id?: number;
  seasonNumber: number;
  episodeCount?: number | string | null;
  year?: number | null;
}

/** Imagen ya resuelta por el caller (la subida a R2 no es de este modulo). */
export interface ResolvedSeriesImage {
  url: string | null;
  /** `undefined` = no tocar la miniatura. */
  thumbUrl: string | null | undefined;
}

export type SeriesFormSaveResult = {
  updated: Prisma.SeriesGetPayload<object>;
  newSeasons: Array<{ id: number; seasonNumber: number }>;
} | null;

const toInt = (value: unknown): number | null => {
  const parsed = parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

async function resolveCountryId(body: SeriesFormBody): Promise<number | null> {
  const countryId = body.countryId ? toInt(body.countryId) : null;
  if (countryId || !body.countryName) return countryId;
  const code = getCountryCode(body.countryName);
  const country = await prisma.country.upsert({
    where: { name: body.countryName },
    update: code ? { code } : {},
    create: { name: body.countryName, ...(code ? { code } : {}) },
  });
  return country.id;
}

async function resolveProductionCompanyId(
  body: SeriesFormBody
): Promise<number | null> {
  if (body.productionCompanyId || !body.productionCompanyName) {
    return body.productionCompanyId || null;
  }
  const company = await findOrCreateProductionCompany(
    prisma,
    body.productionCompanyName
  );
  return company?.id ?? null;
}

async function resolveOriginalLanguageId(
  body: SeriesFormBody
): Promise<number | null> {
  if (body.originalLanguageId || !body.originalLanguageName) {
    return body.originalLanguageId || null;
  }
  const language = await prisma.language.upsert({
    where: { name: body.originalLanguageName },
    update: {},
    create: { name: body.originalLanguageName },
  });
  return language.id;
}

/**
 * Temporadas: actualiza las que vienen con id, crea las nuevas, borra las que
 * ya no estan y genera los capitulos faltantes. Devuelve las creadas para que
 * el caller avise a los suscriptores despues del commit.
 */
async function syncSeasons(
  tx: Prisma.TransactionClient,
  seriesId: number,
  incoming: SeasonInput[],
  fallbackYear: number | null
): Promise<Array<{ id: number; seasonNumber: number }>> {
  const existing = await tx.season.findMany({
    where: { seriesId },
    select: { id: true },
  });
  const incomingIds = new Set(
    incoming
      .map((season) => season.id)
      .filter((seasonId): seasonId is number => typeof seasonId === 'number')
  );
  const toDelete = existing
    .map((season) => season.id)
    .filter((seasonId) => !incomingIds.has(seasonId));
  if (toDelete.length > 0) {
    await tx.season.deleteMany({ where: { id: { in: toDelete } } });
  }

  const created: Array<{ id: number; seasonNumber: number }> = [];
  for (const seasonData of incoming) {
    const data = {
      seasonNumber: seasonData.seasonNumber,
      episodeCount: seasonData.episodeCount
        ? Number(seasonData.episodeCount)
        : null,
      year: seasonData.year ?? fallbackYear,
    };
    let seasonId: number;
    if (seasonData.id) {
      await tx.season.update({ where: { id: seasonData.id }, data });
      seasonId = seasonData.id;
    } else {
      const season = await tx.season.create({
        data: { ...data, seriesId },
        select: { id: true, seasonNumber: true },
      });
      seasonId = season.id;
      created.push(season);
    }

    // Auto-generación de episodios faltantes si se definió episodeCount
    const targetEpisodeCount = data.episodeCount ?? 0;
    if (targetEpisodeCount > 0) {
      const existingEpisodes = await tx.episode.findMany({
        where: { seasonId },
        select: { episodeNumber: true },
      });
      const existingNums = new Set(
        existingEpisodes.map((episode) => episode.episodeNumber)
      );
      const toCreate = [];
      for (let i = 1; i <= targetEpisodeCount; i++) {
        if (!existingNums.has(i)) toCreate.push({ seasonId, episodeNumber: i });
      }
      if (toCreate.length > 0) {
        await tx.episode.createMany({ data: toCreate });
      }
    }
  }
  return created;
}

const resolvedIds = (map: Map<string, number> | null) =>
  map ? [...new Set(map.values())] : undefined;

/**
 * Guardado completo del form de edicion: un solo commit. Antes de escribir
 * guarda la foto previa (SeriesRevision) y verifica que la ficha siga en la
 * version con la que se abrio el form; si no, tira SeriesEditConflictError y
 * no cambia nada. Devuelve null si la serie no existe.
 *
 * Validar `title`, `basedOn` y `universeId` es del caller (respuestas 400).
 */
export async function saveSeriesFromForm(
  seriesId: number,
  body: SeriesFormBody,
  image: ResolvedSeriesImage,
  userId: string | null
): Promise<SeriesFormSaveResult> {
  const expectedEditVersion = parseExpectedEditVersion(body.editVersion);
  if (expectedEditVersion === null) throw new SeriesEditConflictError();

  const requestedUniverseId =
    body.universeId === undefined
      ? undefined
      : body.universeId
        ? Number(body.universeId)
        : null;

  // Todo lo que busca o crea catalogos va en paralelo y antes de la
  // transaccion (ver resolveNamedIds).
  const [
    countryId,
    productionCompanyId,
    originalLanguageId,
    normalizedBasedOn,
    actorIds,
    directorIds,
    tagIds,
    genreIds,
  ] = await Promise.all([
    resolveCountryId(body),
    resolveProductionCompanyId(body),
    resolveOriginalLanguageId(body),
    resolveBasedOnValue(body.basedOn),
    Array.isArray(body.actors)
      ? resolveActorIds(body.actors.map((actor) => actor?.name ?? ''))
      : null,
    Array.isArray(body.directors)
      ? resolveDirectorIds(body.directors.map((d) => d?.name ?? ''))
      : null,
    body.tags !== undefined ? resolveTagIds(body.tags || []) : null,
    body.genres !== undefined ? resolveGenreIds(body.genres || []) : null,
  ]);

  const relations: SeriesRelationsInput = {
    actors:
      actorIds && body.actors
        ? body.actors.flatMap((actorData) => {
            const actorId = actorIds.get(nameKey(actorData?.name ?? ''));
            return actorId
              ? [
                  {
                    actorId,
                    character: actorData.character || '',
                    isMain: actorData.isMain || false,
                    pairingGroup: actorData.pairingGroup ?? null,
                  },
                ]
              : [];
          })
        : undefined,
    directorIds: resolvedIds(directorIds),
    dubbingIds:
      body.dubbingIds !== undefined
        ? (body.dubbingIds || []).map(Number).filter(Number.isInteger)
        : undefined,
    tagIds: resolvedIds(tagIds),
    genreIds: resolvedIds(genreIds),
    watchLinks:
      body.watchLinks !== undefined
        ? (body.watchLinks || []).flatMap((link) =>
            link?.platform && link?.url
              ? [
                  {
                    platform: link.platform,
                    url: link.url,
                    official: link.official ?? true,
                  },
                ]
              : []
          )
        : undefined,
    relatedSeriesIds:
      body.relatedSeriesIds !== undefined
        ? (body.relatedSeriesIds || [])
            .map(Number)
            .filter((relatedId) => Number.isInteger(relatedId) && relatedId > 0)
        : undefined,
  };

  const year = body.year ? toInt(body.year) : null;

  return prisma.$transaction(
    async (tx) => {
      const current = await loadSeriesForSave(tx, seriesId);
      if (!current) return null;
      if (current.editVersion !== expectedEditVersion) {
        throw new SeriesEditConflictError();
      }

      const targetUniverseId =
        requestedUniverseId === undefined
          ? current.universeId
          : requestedUniverseId;
      const isUniverseMain =
        targetUniverseId !== null &&
        (body.isUniverseMain === undefined
          ? current.universeId === targetUniverseId && current.isUniverseMain
          : body.isUniverseMain === true);

      await recordSeriesRevision(tx, current, userId, 'admin-form');
      await prepareUniverseSlot(tx, targetUniverseId, isUniverseMain);

      // El WHERE con la version cubre la carrera entre la lectura de arriba y
      // esta escritura: si otro guardado entro en el medio, 0 filas.
      const { count } = await tx.series.updateMany({
        where: { id: seriesId, editVersion: expectedEditVersion },
        data: {
          editVersion: { increment: 1 },
          isUniverseMain,
          title: body.title,
          originalTitle: body.originalTitle || null,
          year,
          type: body.type || 'serie',
          durationMinutes: body.durationMinutes
            ? toInt(body.durationMinutes) || null
            : null,
          basedOn: normalizedBasedOn,
          format: body.format || 'regular',
          imageUrl: image.url,
          ...(image.thumbUrl !== undefined && {
            imageThumbUrl: image.thumbUrl,
          }),
          imagePosition: body.imagePosition || 'center',
          synopsis: body.synopsis || null,
          // Defensivo a proposito (mismo patron que `airDays` mas abajo): si el
          // body no trae la clave, no se toca la columna. Sin esto, cualquier
          // guardado desde un form que no registre el campo lo pisaba con null
          // — que es exactamente como se perdio la resena editorial de las 613
          // series del catalogo (medido 2026-09-10: 549 con nota, 0 con resena).
          review: body.review !== undefined ? body.review || null : undefined,
          soundtrack: body.soundtrack || null,
          overallRating: body.overallRating ? toInt(body.overallRating) : null,
          observations: body.observations || null,
          notesPrivate: body.notesPrivate === true,
          featured: body.featured === true,
          featuredOrder:
            typeof body.featuredOrder === 'number' ? body.featuredOrder : 0,
          airDays:
            body.airDays !== undefined ? body.airDays || null : undefined,
          catalogScope:
            body.catalogScope === 'WATCHABLE_ONLY'
              ? 'WATCHABLE_ONLY'
              : 'PERSONAL',
          countryId,
          universeId: targetUniverseId,
          productionCompanyId,
          originalLanguageId,
        },
      });
      if (count === 0) throw new SeriesEditConflictError();

      await syncSeriesRelations(tx, current, relations);
      const newSeasons =
        body.seasons !== undefined
          ? await syncSeasons(tx, seriesId, body.seasons || [], year)
          : [];

      const updated = await tx.series.findUniqueOrThrow({
        where: { id: seriesId },
      });
      return { updated, newSeasons };
    },
    // Margen para series con muchas temporadas: el default de 5 s quedaba
    // justo cuando las funciones corrian en iad1, lejos de la base (sa-east-1).
    { timeout: 30_000, maxWait: 5_000 }
  );
}
