import type { SerieData, SerieTag } from './catalogTypes';

export interface CatalogPayload {
  series: (Omit<SerieData, 'tags' | 'synopsis'> & { tagIds: number[] })[];
  tags: SerieTag[];
}

/** Each tag name crosses the RSC boundary once, without changing client filters. */
export function packCatalog(series: SerieData[]): CatalogPayload {
  const tags = new Map<number, SerieTag>();
  return {
    series: series.map(({ tags: entries, synopsis: _synopsis, ...item }) => {
      const tagIds = (entries ?? []).map((tag) => {
        tags.set(tag.id, tag);
        return tag.id;
      });
      return { ...item, tagIds };
    }),
    tags: [...tags.values()],
  };
}

export function unpackCatalog(payload: CatalogPayload): SerieData[] {
  const tags = new Map(payload.tags.map((tag) => [tag.id, tag]));
  return payload.series.map(({ tagIds, ...item }) => ({
    ...item,
    tags: tagIds.flatMap((id) => {
      const tag = tags.get(id);
      return tag ? [tag] : [];
    }),
  }));
}
