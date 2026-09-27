import {
  readWatchingPreferences,
  type WatchingPreferences,
} from './watching-collection';

export type WatchingPreferenceChange =
  | { view: WatchingPreferences['view'] }
  | { sort: WatchingPreferences['sort'] }
  | { pin: { id: number; pinned: boolean } };

/** Strict API input; a malformed bootstrap must not discard legacy device settings. */
export function parseInitialPreferences(
  value: unknown
): WatchingPreferences | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some((key) => !['view', 'sort', 'pinned'].includes(key)))
    return null;
  if (row.view !== 'list' && row.view !== 'grid') return null;
  if (!['recent', 'name', 'remaining'].includes(String(row.sort))) return null;
  if (
    !Array.isArray(row.pinned) ||
    row.pinned.length > 100 ||
    row.pinned.some(
      (id: unknown) =>
        typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0
    )
  )
    return null;
  return readWatchingPreferences(row);
}

export function parsePreferenceChange(
  value: unknown
): WatchingPreferenceChange | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).length !== 1) return null;
  if (row.view === 'list' || row.view === 'grid') return { view: row.view };
  if (row.sort === 'recent' || row.sort === 'name' || row.sort === 'remaining')
    return { sort: row.sort };
  if (row.pin && typeof row.pin === 'object' && !Array.isArray(row.pin)) {
    const pin = row.pin as Record<string, unknown>;
    if (Object.keys(pin).some((key) => !['id', 'pinned'].includes(key)))
      return null;
    if (
      typeof pin.id === 'number' &&
      Number.isSafeInteger(pin.id) &&
      pin.id > 0 &&
      typeof pin.pinned === 'boolean'
    ) {
      return { pin: { id: pin.id, pinned: pin.pinned } };
    }
  }
  return null;
}

export function applyPreferenceChange(
  current: WatchingPreferences,
  change: WatchingPreferenceChange
): WatchingPreferences {
  if ('pin' in change) {
    const pinned = current.pinned.filter((id) => id !== change.pin.id);
    if (change.pin.pinned) pinned.push(change.pin.id);
    return readWatchingPreferences({ ...current, pinned });
  }
  return { ...current, ...change };
}
