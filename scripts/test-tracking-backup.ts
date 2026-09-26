import assert from 'node:assert/strict';
import {
  planTrackingBackup,
  trackingBackupKey,
} from '../src/lib/tracking-backup';

const references = {
  seriesId: new Set([1, 2]),
  seasonId: new Set([10]),
  episodeId: new Set([100, 101]),
};
const empty = () => ({
  viewStatuses: new Set<string>(),
  seriesNotes: new Set<string>(),
  episodeNotes: new Set<string>(),
});
const date = '2025-01-02T12:30:00.000Z';
const backup = {
  viewStatuses: [
    {
      seriesId: 1,
      seasonId: null,
      episodeId: null,
      status: 'VIENDO',
      watchedDate: null,
      lastWatchedAt: date,
      userId: 'other',
    },
    {
      seriesId: null,
      seasonId: 10,
      episodeId: null,
      status: 'RETOMAR',
      watchedDate: null,
    },
    {
      seriesId: null,
      seasonId: null,
      episodeId: 100,
      status: 'VISTA',
      watchedDate: date,
    },
  ],
  seriesNotes: [
    {
      seriesId: 1,
      body: 'Mi nota privada',
      createdAt: date,
      updatedAt: date,
      userId: 'other',
      id: 999,
    },
  ],
  episodeNotes: [
    {
      episodeId: 100,
      body: 'Mi reacción',
      createdAt: date,
      updatedAt: date,
      isPrivate: false,
    },
  ],
};
const plan = planTrackingBackup(backup, 'owner', references, empty());
assert.equal(plan.viewStatuses.length, 3);
assert.equal(plan.seriesNotes.length, 1);
assert.equal(plan.episodeNotes.length, 1);
assert.deepEqual(plan.errors, []);
assert.equal(plan.viewStatuses[0].lastWatchedAt?.toISOString(), date);
assert.equal(plan.viewStatuses[2].watchedDate?.toISOString(), date);
assert.equal(plan.viewStatuses[1].lastWatchedAt, null);
for (const row of [
  ...plan.viewStatuses,
  ...plan.seriesNotes,
  ...plan.episodeNotes,
]) {
  assert.equal(row.userId, 'owner');
  assert.equal('id' in row, false);
  assert.equal('isPrivate' in row, false);
}
assert.equal(plan.seriesNotes[0].createdAt?.toISOString(), date);

// Simulate the database after a successful import: every record is preserved, none overwritten.
const existing = {
  viewStatuses: new Set(plan.viewStatuses.map(trackingBackupKey)),
  seriesNotes: new Set(plan.seriesNotes.map(trackingBackupKey)),
  episodeNotes: new Set(plan.episodeNotes.map(trackingBackupKey)),
};
const repeated = planTrackingBackup(backup, 'owner', references, existing);
assert.equal(
  repeated.viewStatuses.length +
    repeated.seriesNotes.length +
    repeated.episodeNotes.length,
  0
);
assert.deepEqual(repeated.skipped, {
  viewStatuses: 3,
  seriesNotes: 1,
  episodeNotes: 1,
});

const malformed = planTrackingBackup(
  {
    viewStatuses: [
      null,
      { seriesId: 1, episodeId: 100, status: 'VISTA' },
      { seriesId: -1, status: 'VISTA' },
      { seriesId: '1', status: 'VISTA' },
      { seriesId: 2, status: 'ADMIN' },
      { seriesId: 2, status: 'VISTA', watchedDate: '2025-02-30' },
      { seriesId: 2, status: 'VISTA', lastWatchedAt: 'yesterday' },
      { episodeId: 999, status: 'VISTA' },
      { episodeId: 101, status: 'VISTA', watchedDate: '2024-02-29' },
      { episodeId: 101, status: 'SIN_VER' },
    ],
    seriesNotes: [
      { seriesId: 2, body: ' ' },
      { seriesId: 2, body: 'a'.repeat(5001) },
      { seriesId: 2, body: 'valid', createdAt: date, updatedAt: '2024-01-01' },
    ],
    episodeNotes: [
      { seriesId: 1, body: 'wrong target' },
      { episodeId: 999, body: 'private body never included in errors' },
    ],
  },
  'owner',
  references,
  empty()
);
assert.equal(malformed.viewStatuses.length, 1);
assert.equal(
  malformed.viewStatuses[0].watchedDate?.toISOString(),
  '2024-02-29T00:00:00.000Z'
);
assert.equal(malformed.seriesNotes.length + malformed.episodeNotes.length, 0);
assert.equal(malformed.missingRefs.length, 2);
assert.equal(malformed.errors.length, 11);
assert.equal(JSON.stringify(malformed.errors).includes('private body'), false);
assert.deepEqual(malformed.skipped, {
  viewStatuses: 9,
  seriesNotes: 3,
  episodeNotes: 2,
});

// Old backups need no new fields; invalid sections cannot crash the parser.
assert.deepEqual(
  planTrackingBackup({}, 'owner', references, empty()).errors,
  []
);
assert.equal(
  planTrackingBackup({ episodeNotes: {} }, 'owner', references, empty()).errors
    .length,
  1
);
assert.equal(
  planTrackingBackup(
    { seriesNotes: [backup.seriesNotes[0], backup.seriesNotes[0]] },
    'owner',
    references,
    empty()
  ).seriesNotes.length,
  1
);
console.log(
  'Tracking backup: round-trip planning, ownership, dates, duplicates and invalid references passed.'
);
