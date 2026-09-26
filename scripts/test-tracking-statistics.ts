import assert from 'node:assert/strict';
import { completedInCurrentYear } from '../src/lib/tracking-statistics';
const dates = [
  null,
  '2025-12-31T23:59:59.999Z',
  '2026-01-01T00:00:00.000Z',
  '2026-05-15T12:00:00.000Z',
  '2026-12-31T12:00:00.000Z',
  '2027-01-01T00:00:00.000Z',
];
assert.deepEqual(
  completedInCurrentYear(
    dates.map((value) => ({ watchedDate: value ? new Date(value) : null })),
    new Date('2026-06-01T00:00:00.000Z')
  ),
  { activityYear: 2026, completedThisYear: 2 }
);
assert.deepEqual(
  completedInCurrentYear([], new Date('2026-01-01T00:00:00.000Z')),
  { activityYear: 2026, completedThisYear: 0 }
);
console.log(
  'PASS: annual completions use recorded UTC dates, exclude unknown/future dates and respect year boundaries.'
);
