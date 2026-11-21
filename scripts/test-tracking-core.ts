/* eslint-disable no-console */
import assert from 'node:assert/strict';
import type { WatchStatus } from '@prisma/client';
import {
  TRACKING_STATUSES,
  datesForStatus,
  isTrackingStatus,
  planProgress,
  statusAfterWatch,
} from '../src/lib/tracking-core';
import { fromCoreStatus, toCoreStatus } from '../src/lib/tracking-status';

/**
 * Prueba de src/lib/tracking-core (status y progress-plan) y del mapeo con
 * el enum de la base. Logica pura: no toca la base.
 *
 * Uso: npx tsx scripts/test-tracking-core.ts
 */

// --- Mapeo ida y vuelta: los seis estados, sin perder ninguno.
const DB_STATUSES: WatchStatus[] = [
  'SIN_VER',
  'QUIERO_VER',
  'VIENDO',
  'VISTA',
  'RETOMAR',
  'ABANDONADA',
];
for (const status of DB_STATUSES) {
  assert.equal(fromCoreStatus(toCoreStatus(status)), status);
}
assert.equal(new Set(DB_STATUSES.map(toCoreStatus)).size, 6);
assert.deepEqual([...TRACKING_STATUSES].sort(), [
  'completed',
  'dropped',
  'none',
  'paused',
  'planned',
  'watching',
]);
assert.ok(isTrackingStatus('paused'));
assert.ok(!isTrackingStatus('VIENDO'));

// --- Marcar un capitulo: la tabla que antes vivia escrita a mano en
// tracking.ts (updateSeriesAfterWatch) y en local-progress.ts.
const AFTER_WATCH: Record<WatchStatus | 'NONE', WatchStatus> = {
  NONE: 'VIENDO',
  SIN_VER: 'VIENDO',
  QUIERO_VER: 'VIENDO',
  VIENDO: 'VIENDO',
  RETOMAR: 'VIENDO',
  VISTA: 'VISTA',
  ABANDONADA: 'ABANDONADA',
};
for (const [before, after] of Object.entries(AFTER_WATCH)) {
  const current =
    before === 'NONE' ? null : toCoreStatus(before as WatchStatus);
  assert.equal(
    fromCoreStatus(statusAfterWatch(current)),
    after,
    `${before} -> ${after}`
  );
}

// --- Fechas al elegir un estado a mano.
const now = new Date('2026-11-15T12:00:00.000Z');
assert.deepEqual(datesForStatus('completed', now), { completedAt: now });
assert.deepEqual(datesForStatus('none', now), { completedAt: null });
assert.deepEqual(datesForStatus('watching', now), { lastWatchedAt: now });
for (const status of ['planned', 'paused', 'dropped'] as const) {
  assert.deepEqual(datesForStatus(status, now), {});
}

// --- "Voy por el episodio N".
const ordered = [
  { id: 'a', seasonNumber: 1, episodeNumber: 1 },
  { id: 'b', seasonNumber: 1, episodeNumber: 2 },
  { id: 'c', seasonNumber: 2, episodeNumber: 1 },
  { id: 'd', seasonNumber: 2, episodeNumber: 2 },
];
assert.deepEqual(planProgress(ordered, { episodeId: 'c' }), {
  kind: 'mark',
  episodeIds: ['a', 'b', 'c'],
});
assert.deepEqual(planProgress(ordered, { seasonNumber: 2, episodeNumber: 1 }), {
  kind: 'mark',
  episodeIds: ['a', 'b', 'c'],
});
assert.deepEqual(
  planProgress(ordered, { episodeId: 'b' }, { direction: 'unmark' }),
  { kind: 'unmark', episodeIds: ['c', 'd'] }
);
assert.deepEqual(
  planProgress(
    ordered,
    { episodeId: 'a' },
    { direction: 'unmark', inclusive: true }
  ),
  { kind: 'unmark', episodeIds: ['a', 'b', 'c', 'd'] }
);
assert.deepEqual(
  planProgress(ordered, { episodeId: 'd' }, { direction: 'unmark' }),
  { kind: 'unmark', episodeIds: [] }
);
assert.equal(planProgress(ordered, { episodeId: 'z' }), null);
assert.equal(
  planProgress(ordered, { seasonNumber: 3, episodeNumber: 1 }),
  null
);

console.log('OK tracking-core: estados, mapeo, fechas y plan de progreso');
