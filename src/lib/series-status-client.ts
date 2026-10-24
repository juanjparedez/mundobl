'use client';

import type { WatchStatusValue } from '@/constants/series';
import { recordSeriesActivity } from '@/lib/activity-beacon';
import {
  LOCAL_INTENTS,
  setLocalSeriesIntent,
  type LocalIntent,
} from '@/lib/local-progress';

export type TrackingStorage = 'account' | 'local';

function asLocalIntent(status: WatchStatusValue): LocalIntent | null {
  return LOCAL_INTENTS.find((intent) => intent === status) ?? null;
}

/**
 * Guarda el estado de una serie donde corresponda: en la cuenta, o en este
 * navegador. Sin cuenta, VIENDO y SIN_VER no se guardan: salen de los
 * capitulos marcados (ver local-progress.ts). Lanza si la cuenta falla.
 */
export async function saveSeriesStatus(
  seriesId: number,
  status: WatchStatusValue,
  storage: TrackingStorage
): Promise<void> {
  if (storage === 'local') {
    setLocalSeriesIntent(seriesId, asLocalIntent(status));
  } else {
    const response = await fetch(`/api/series/${seriesId}/view-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('view-status');
  }
  if (status === 'QUIERO_VER') recordSeriesActivity(seriesId, 'want');
  if (status === 'VISTA') recordSeriesActivity(seriesId, 'finish');
}
