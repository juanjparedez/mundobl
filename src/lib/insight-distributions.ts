import type { TrackingInsights } from './tracking-insights';

export type InsightDimension = 'country' | 'genre' | 'type' | 'format';
export type InsightRow = TrackingInsights['rows'][number];
export interface InsightCategory {
  key: string;
  name: string;
  code?: string | null;
  count: number;
}

export function rowCategories(
  row: InsightRow,
  dimension: InsightDimension
): Omit<InsightCategory, 'count'>[] {
  const meta = row.metadata;
  if (!meta) return [{ key: 'unknown', name: '' }];
  if (dimension === 'country')
    return meta.country
      ? [
          {
            key: String(meta.country.id),
            name: meta.country.name,
            code: meta.country.code,
          },
        ]
      : [{ key: 'unknown', name: '' }];
  if (dimension === 'genre')
    return meta.genres.length
      ? [
          ...new Map(
            meta.genres.map((genre) => [
              genre.id,
              { key: String(genre.id), name: genre.name },
            ])
          ).values(),
        ]
      : [{ key: 'unknown', name: '' }];
  return [{ key: meta[dimension] || 'unknown', name: meta[dimension] }];
}

/** Denominator is unique active works in the selected period, never chapters.
 * A multi-genre work belongs to each genre, once per category. */
export function insightDistribution(
  rows: InsightRow[],
  dimension: InsightDimension
): InsightCategory[] {
  const groups = new Map<string, InsightCategory>();
  for (const row of new Map(rows.map((row) => [row.id, row])).values()) {
    for (const category of rowCategories(row, dimension)) {
      const item = groups.get(category.key) ?? { ...category, count: 0 };
      item.count++;
      groups.set(category.key, item);
    }
  }
  return [...groups.values()].sort(
    (a, b) => b.count - a.count || a.key.localeCompare(b.key)
  );
}

export function filterInsightRows(
  rows: InsightRow[],
  filter: { dimension: InsightDimension; key: string } | null
) {
  return filter
    ? rows.filter((row) =>
        rowCategories(row, filter.dimension).some(
          (category) => category.key === filter.key
        )
      )
    : rows;
}
