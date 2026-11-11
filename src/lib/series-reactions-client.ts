'use client';

import {
  isSeriesReactionKey,
  type SeriesReactionKey,
} from '@/lib/series-reactions';

// Que reacciono este navegador: { [seriesId]: ['laugh', 'fire'] }. Vive solo
// aca, nunca en la base (la base guarda totales).
const REACTIONS_STORAGE_KEY = 'mundobl.reactions';
// El boton "Me gusta" viejo de /ver guardaba aca los ids. La migracion paso
// esos likes al total del corazon, asi que siguen contando como "mi" ❤️
// hasta que la serie tenga una entrada propia en REACTIONS_STORAGE_KEY.
const LEGACY_LIKES_STORAGE_KEY = 'mundobl.likes';

type StoredReactions = Record<string, SeriesReactionKey[]>;

let cachedRaw: string | null = null;
let cachedLegacyRaw: string | null = null;
let cached: StoredReactions = {};
let cachedLegacy: number[] = [];
const EMPTY: SeriesReactionKey[] = [];
const bySeries = new Map<number, SeriesReactionKey[]>();

function readJson(key: string): unknown {
  const raw = window.localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

function load(): void {
  try {
    const raw = window.localStorage.getItem(REACTIONS_STORAGE_KEY);
    const legacyRaw = window.localStorage.getItem(LEGACY_LIKES_STORAGE_KEY);
    if (raw === cachedRaw && legacyRaw === cachedLegacyRaw) return;
    cachedRaw = raw;
    cachedLegacyRaw = legacyRaw;
    bySeries.clear();

    const parsed = raw ? readJson(REACTIONS_STORAGE_KEY) : null;
    cached = {};
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      for (const [id, list] of Object.entries(parsed)) {
        if (Array.isArray(list)) cached[id] = list.filter(isSeriesReactionKey);
      }
    }
    const legacy = legacyRaw ? readJson(LEGACY_LIKES_STORAGE_KEY) : null;
    cachedLegacy = Array.isArray(legacy)
      ? legacy.filter((n): n is number => typeof n === 'number')
      : [];
  } catch {
    /* Storage roto o bloqueado: queda lo ultimo que se leyo. */
  }
}

/** Reacciones de este navegador para la serie (misma referencia si no cambio). */
export function getOwnReactions(seriesId: number): SeriesReactionKey[] {
  if (typeof window === 'undefined') return EMPTY;
  load();
  const memo = bySeries.get(seriesId);
  if (memo) return memo;
  const own =
    cached[String(seriesId)] ??
    (cachedLegacy.includes(seriesId) ? ['love' as const] : EMPTY);
  bySeries.set(seriesId, own);
  return own;
}

export function setOwnReactions(
  seriesId: number,
  reactions: SeriesReactionKey[]
): void {
  try {
    load();
    const next: StoredReactions = { ...cached };
    // Una entrada vacia tambien se guarda: pisa el like viejo si lo quito.
    next[String(seriesId)] = reactions;
    window.localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new StorageEvent('storage'));
  } catch {
    /* Sin storage la reaccion cuenta igual, solo no se recuerda. */
  }
}

export function subscribeOwnReactions(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

/** Suma o resta uno al total. false si el servidor no lo tomo. */
export async function sendReaction(
  seriesId: number,
  reaction: SeriesReactionKey,
  active: boolean
): Promise<boolean> {
  try {
    const response = await fetch(`/api/series/${seriesId}/reactions`, {
      method: 'POST',
      keepalive: true,
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reaction, active }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
