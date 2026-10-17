const STORAGE_KEY = 'mundobl.localProgress';
const STORAGE_VERSION = 1 as const;

export interface LocalSeriesProgress {
  episodeIds: number[];
  updatedAt: number;
}

interface LocalProgressStore {
  v: typeof STORAGE_VERSION;
  series: Record<string, LocalSeriesProgress>;
}

const EMPTY_STORE: LocalProgressStore = { v: STORAGE_VERSION, series: {} };

function readStore(): LocalProgressStore {
  if (typeof window === 'undefined') return EMPTY_STORE;

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? ''
    ) as Partial<LocalProgressStore>;
    if (parsed.v !== STORAGE_VERSION || !parsed.series) return EMPTY_STORE;
    return { v: STORAGE_VERSION, series: parsed.series };
  } catch {
    return EMPTY_STORE;
  }
}

function writeStore(store: LocalProgressStore): void {
  const oldValue = window.localStorage.getItem(STORAGE_KEY);
  const newValue = JSON.stringify(store);
  window.localStorage.setItem(STORAGE_KEY, newValue);
  window.dispatchEvent(
    new StorageEvent('storage', { key: STORAGE_KEY, oldValue, newValue })
  );
}

export function getLocalSeriesProgress(seriesId: number): LocalSeriesProgress {
  return (
    readStore().series[String(seriesId)] ?? { episodeIds: [], updatedAt: 0 }
  );
}

export function listLocalProgress(): Array<{
  seriesId: number;
  progress: LocalSeriesProgress;
}> {
  return Object.entries(readStore().series)
    .map(([seriesId, progress]) => ({ seriesId: Number(seriesId), progress }))
    .filter(
      ({ seriesId, progress }) =>
        Number.isInteger(seriesId) && progress.episodeIds.length > 0
    );
}

export function setLocalEpisodesWatched(
  seriesId: number,
  episodeIds: readonly number[],
  watched: boolean
): void {
  const store = readStore();
  const key = String(seriesId);
  const current = new Set(store.series[key]?.episodeIds ?? []);
  for (const episodeId of episodeIds) {
    if (watched) current.add(episodeId);
    else current.delete(episodeId);
  }

  if (current.size === 0) delete store.series[key];
  else {
    store.series[key] = {
      episodeIds: [...current].sort((a, b) => a - b),
      updatedAt: Date.now(),
    };
  }
  writeStore(store);
}

export function setLocalProgressThrough(
  seriesId: number,
  orderedEpisodeIds: readonly number[],
  lastWatchedIndex: number
): void {
  const watched = orderedEpisodeIds.slice(0, lastWatchedIndex + 1);
  const store = readStore();
  const key = String(seriesId);
  if (watched.length === 0) delete store.series[key];
  else {
    store.series[key] = {
      episodeIds: [...new Set(watched)].sort((a, b) => a - b),
      updatedAt: Date.now(),
    };
  }
  writeStore(store);
}

export function clearLocalSeriesProgress(seriesId: number): void {
  const store = readStore();
  delete store.series[String(seriesId)];
  writeStore(store);
}

export function subscribeToLocalProgress(onChange: () => void): () => void {
  const listener = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener('storage', listener);
  return () => window.removeEventListener('storage', listener);
}

const PLAYBACK_POS_KEY = 'mundobl.episodePlaybackSeconds';

export function getEpisodePlaybackPosition(episodeId: number): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = JSON.parse(
      window.localStorage.getItem(PLAYBACK_POS_KEY) ?? '{}'
    ) as Record<string, number>;
    const sec = raw[String(episodeId)];
    return typeof sec === 'number' && Number.isFinite(sec) && sec > 0 ? sec : 0;
  } catch {
    return 0;
  }
}

export function setEpisodePlaybackPosition(
  episodeId: number,
  seconds: number
): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.parse(
      window.localStorage.getItem(PLAYBACK_POS_KEY) ?? '{}'
    ) as Record<string, number>;
    if (seconds <= 5) {
      delete raw[String(episodeId)];
    } else {
      raw[String(episodeId)] = Math.floor(seconds);
    }
    window.localStorage.setItem(PLAYBACK_POS_KEY, JSON.stringify(raw));
  } catch {
    // Ignore quota errors
  }
}

export function clearEpisodePlaybackPosition(episodeId: number): void {
  setEpisodePlaybackPosition(episodeId, 0);
}
