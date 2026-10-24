// Progreso sin cuenta, en este navegador. v2 suma la intencion (Quiero
// verla, Vista, En pausa, Abandonada) para que todo lo que se puede hacer con
// cuenta se pueda hacer sin ella; VIENDO no se guarda: sale de los capitulos.
const STORAGE_KEY = 'mundobl.localProgress';
const STORAGE_VERSION = 2 as const;

/** Estados que se eligen a mano. VIENDO y SIN_VER salen del progreso. */
export const LOCAL_INTENTS = [
  'QUIERO_VER',
  'VISTA',
  'RETOMAR',
  'ABANDONADA',
] as const;
export type LocalIntent = (typeof LOCAL_INTENTS)[number];

export interface LocalSeriesProgress {
  episodeIds: number[];
  intent?: LocalIntent;
  updatedAt: number;
}

interface LocalProgressStore {
  v: typeof STORAGE_VERSION;
  series: Record<string, LocalSeriesProgress>;
}

const EMPTY_PROGRESS: LocalSeriesProgress = { episodeIds: [], updatedAt: 0 };

function isIntent(value: unknown): value is LocalIntent {
  return LOCAL_INTENTS.some((intent) => intent === value);
}

function sanitize(raw: unknown): LocalSeriesProgress | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  const episodeIds = Array.isArray(value.episodeIds)
    ? value.episodeIds.filter(
        (id): id is number => Number.isSafeInteger(id) && Number(id) > 0
      )
    : [];
  const intent = isIntent(value.intent) ? value.intent : undefined;
  if (episodeIds.length === 0 && !intent) return null;
  return {
    episodeIds,
    ...(intent ? { intent } : {}),
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : 0,
  };
}

/** v1 ({ v: 1, series: { id: { episodeIds } } }) se lee igual: solo sumo campos. */
function readStore(): LocalProgressStore {
  if (typeof window === 'undefined') return { v: STORAGE_VERSION, series: {} };

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? ''
    ) as { v?: unknown; series?: unknown };
    if ((parsed.v !== 1 && parsed.v !== 2) || !parsed.series) {
      return { v: STORAGE_VERSION, series: {} };
    }
    const series: Record<string, LocalSeriesProgress> = {};
    for (const [key, raw] of Object.entries(
      parsed.series as Record<string, unknown>
    )) {
      const progress = sanitize(raw);
      if (progress && Number.isSafeInteger(Number(key))) series[key] = progress;
    }
    return { v: STORAGE_VERSION, series };
  } catch {
    return { v: STORAGE_VERSION, series: {} };
  }
}

function writeStore(store: LocalProgressStore): void {
  try {
    const oldValue = window.localStorage.getItem(STORAGE_KEY);
    const newValue = JSON.stringify(store);
    window.localStorage.setItem(STORAGE_KEY, newValue);
    window.dispatchEvent(
      new StorageEvent('storage', { key: STORAGE_KEY, oldValue, newValue })
    );
  } catch {
    // Sin storage (modo privado estricto, cuota llena): no hay donde guardar.
  }
}

function saveEntry(
  store: LocalProgressStore,
  seriesId: number,
  progress: LocalSeriesProgress
): void {
  const key = String(seriesId);
  if (progress.episodeIds.length === 0 && !progress.intent) {
    delete store.series[key];
  } else {
    store.series[key] = { ...progress, updatedAt: Date.now() };
  }
}

/**
 * Misma regla que el servidor (tracking.ts): marcar un capitulo saca la
 * serie de Quiero verla / En pausa y la deja en Viendo. Vista y Abandonada
 * las eligio el usuario a mano: no se pisan.
 */
function intentAfterWatch(intent: LocalIntent | undefined) {
  return intent === 'QUIERO_VER' || intent === 'RETOMAR' ? undefined : intent;
}

export function getLocalSeriesProgress(seriesId: number): LocalSeriesProgress {
  return readStore().series[String(seriesId)] ?? EMPTY_PROGRESS;
}

/** El estado de la serie como lo veria el servidor. */
export function localSeriesStatus(progress: LocalSeriesProgress): string {
  if (progress.intent) return progress.intent;
  return progress.episodeIds.length > 0 ? 'VIENDO' : 'SIN_VER';
}

export function listLocalProgress(): Array<{
  seriesId: number;
  progress: LocalSeriesProgress;
}> {
  return Object.entries(readStore().series)
    .map(([seriesId, progress]) => ({ seriesId: Number(seriesId), progress }))
    .filter(({ seriesId }) => Number.isInteger(seriesId))
    .sort((a, b) => b.progress.updatedAt - a.progress.updatedAt);
}

export function setLocalEpisodesWatched(
  seriesId: number,
  episodeIds: readonly number[],
  watched: boolean
): void {
  const store = readStore();
  const previous = store.series[String(seriesId)] ?? EMPTY_PROGRESS;
  const current = new Set(previous.episodeIds);
  for (const episodeId of episodeIds) {
    if (watched) current.add(episodeId);
    else current.delete(episodeId);
  }
  const intent = watched ? intentAfterWatch(previous.intent) : previous.intent;
  saveEntry(store, seriesId, {
    episodeIds: [...current].sort((a, b) => a - b),
    ...(intent ? { intent } : {}),
    updatedAt: previous.updatedAt,
  });
  writeStore(store);
}

export function setLocalProgressThrough(
  seriesId: number,
  orderedEpisodeIds: readonly number[],
  lastWatchedIndex: number
): void {
  const watched = orderedEpisodeIds.slice(0, lastWatchedIndex + 1);
  const store = readStore();
  const previous = store.series[String(seriesId)] ?? EMPTY_PROGRESS;
  const intent =
    watched.length > previous.episodeIds.length
      ? intentAfterWatch(previous.intent)
      : previous.intent;
  saveEntry(store, seriesId, {
    episodeIds: [...new Set(watched)].sort((a, b) => a - b),
    ...(intent ? { intent } : {}),
    updatedAt: previous.updatedAt,
  });
  writeStore(store);
}

/** null vuelve al estado que da el progreso (Viendo, o nada). */
export function setLocalSeriesIntent(
  seriesId: number,
  intent: LocalIntent | null
): void {
  const store = readStore();
  const previous = store.series[String(seriesId)] ?? EMPTY_PROGRESS;
  saveEntry(store, seriesId, {
    episodeIds: previous.episodeIds,
    ...(intent ? { intent } : {}),
    updatedAt: previous.updatedAt,
  });
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
