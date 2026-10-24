'use client';

import { ACTIVITY_OPT_OUT_KEY, type ActivityKind } from '@/lib/series-activity';

/** La marca propia de /privacidad ("no contar mi actividad"). */
export function storedActivityOptOut(): boolean {
  try {
    return window.localStorage.getItem(ACTIVITY_OPT_OUT_KEY) === '1';
  } catch {
    return false;
  }
}

/** El navegador ya pide no ser medido (Global Privacy Control o DNT). */
export function browserPrivacySignal(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl === true || nav.doNotTrack === '1';
}

/** true si este navegador pidio no contar nada (propio, GPC o DNT). */
export function activityOptedOut(): boolean {
  if (typeof window === 'undefined') return true;
  return storedActivityOptOut() || browserPrivacySignal();
}

export function setActivityOptOut(optOut: boolean): void {
  try {
    if (optOut) window.localStorage.setItem(ACTIVITY_OPT_OUT_KEY, '1');
    else window.localStorage.removeItem(ACTIVITY_OPT_OUT_KEY);
  } catch {
    // Sin storage no se puede recordar; GPC/DNT siguen valiendo.
  }
}

// Recargar o volver a tocar no son dos capitulos. Vive en memoria a
// proposito, como recordWatchLinkClick: nada de historial por titulo en el
// storage del navegador.
const recent = new Map<string, number>();
const DEDUPE_MS = 10 * 60 * 1000;

/**
 * Suma uno al contador anonimo de la serie. Nunca bloquea ni rompe nada:
 * medir es lo ultimo que importa.
 */
export function recordSeriesActivity(
  seriesId: number,
  kind: ActivityKind,
  dedupeKey: string | number = ''
): void {
  try {
    if (activityOptedOut()) return;
    const key = `${seriesId}:${kind}:${dedupeKey}`;
    const now = Date.now();
    if (now - (recent.get(key) ?? 0) < DEDUPE_MS) return;
    recent.set(key, now);
    void fetch('/api/activity', {
      method: 'POST',
      keepalive: true,
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesId, kind }),
    }).catch(() => undefined);
  } catch {
    /* La medicion nunca rompe la pagina. */
  }
}
