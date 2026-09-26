export type WatchDateTarget =
  | { seriesId: number }
  | { seasonId: number }
  | { episodeId: number };

export function parseWatchDateEdit(value: unknown, now = new Date()) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const keys = ['seriesId', 'seasonId', 'episodeId'] as const;
  const targets = keys.filter((key) => row[key] != null);
  if (targets.length !== 1) return null;
  const key = targets[0];
  const id = row[key];
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0)
    return null;
  let watchedDate: Date | null = null;
  if (row.watchedDate !== null) {
    if (
      typeof row.watchedDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.watchedDate)
    )
      return null;
    watchedDate = new Date(`${row.watchedDate}T00:00:00.000Z`);
    if (
      !Number.isFinite(watchedDate.getTime()) ||
      watchedDate.toISOString().slice(0, 10) !== row.watchedDate ||
      row.watchedDate > now.toISOString().slice(0, 10)
    )
      return null;
  }
  let expectedDate: Date | null = null;
  if (row.expectedDate !== null) {
    if (typeof row.expectedDate !== 'string') return null;
    expectedDate = new Date(row.expectedDate);
    if (
      !Number.isFinite(expectedDate.getTime()) ||
      expectedDate.toISOString() !== row.expectedDate
    )
      return null;
  }
  const target = { [key]: id } as WatchDateTarget;
  return { target, watchedDate, expectedDate };
}
