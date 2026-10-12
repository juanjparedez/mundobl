import { CURATION_FIELDS, type CurationField } from './series-curation-fields';
import type { SeriesForSave, SeriesFormBody } from './series-save';

export function curationSnapshot(current: SeriesForSave): SeriesFormBody {
  return {
    ...current,
    countryName: current.country?.name,
    productionCompanyName: current.productionCompany?.name,
    originalLanguageName: current.originalLanguage?.name,
    actors: current.actors.map(
      ({ actor, character, isMain, pairingGroup }) => ({
        name: actor.name,
        character: character ?? '',
        isMain,
        pairingGroup,
      })
    ),
    directors: current.directors.map(({ director }) => ({
      name: director.name,
    })),
    tags: current.tags.map(({ tag }) => tag.name),
    genres: current.genres.map(({ genre }) => genre.name),
    dubbingIds: current.dubbings.map(({ languageId }) => languageId),
    relatedSeriesIds: [
      ...new Set([
        ...current.relatedSeriesFrom.map((r) => r.relatedSeriesId),
        ...current.relatedSeriesTo.map((r) => r.mainSeriesId),
      ]),
    ],
  };
}

/** Explicit choices win; empty/unselected form defaults never erase imported data. */
export function mergeCuration(
  current: SeriesForSave,
  incoming: SeriesFormBody,
  fields: CurationField[]
): SeriesFormBody {
  const body = curationSnapshot(current);
  for (const field of fields) {
    if (
      !Object.hasOwn(CURATION_FIELDS, field) ||
      !Object.hasOwn(incoming, field)
    )
      throw new Error('INVALID_CURATION_FIELD');
    Object.assign(body, { [field]: incoming[field] });
  }
  if (fields.includes('countryName')) body.countryId = null;
  if (fields.includes('productionCompanyName')) body.productionCompanyId = null;
  if (fields.includes('originalLanguageName')) body.originalLanguageId = null;
  if (fields.includes('imageUrl') && body.imageUrl !== current.imageUrl)
    body.imageThumbUrl = incoming.imageThumbUrl ?? null;
  body.editVersion = incoming.editVersion;
  body.catalogScope = 'PERSONAL';
  // Match by season number, retain every original ID and every omitted season.
  const seasons = new Map<
    number,
    NonNullable<SeriesFormBody['seasons']>[number]
  >(
    current.seasons.map((s) => [
      s.seasonNumber,
      {
        id: s.id,
        seasonNumber: s.seasonNumber,
        episodeCount: s.episodeCount,
        year: s.year,
      },
    ])
  );
  for (const next of incoming.seasons ?? []) {
    const previous = seasons.get(next.seasonNumber);
    seasons.set(next.seasonNumber, {
      id: previous?.id,
      seasonNumber: next.seasonNumber,
      episodeCount: next.episodeCount
        ? Number(next.episodeCount)
        : (previous?.episodeCount ?? null),
      year: next.year ?? previous?.year ?? null,
    });
  }
  body.seasons = [...seasons.values()];
  const links = new Map(
    current.watchLinks.map((link) => [
      link.url,
      { platform: link.platform, url: link.url, official: link.official },
    ])
  );
  for (const link of incoming.watchLinks ?? []) {
    if (link.url && link.platform)
      links.set(link.url, {
        platform: link.platform,
        url: link.url,
        official: link.official ?? true,
      });
  }
  body.watchLinks = [...links.values()];
  return body;
}
