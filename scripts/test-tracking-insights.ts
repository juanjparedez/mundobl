import assert from 'node:assert/strict';
import {
  aggregateInsights,
  insightsRange,
  type InsightEpisode,
} from '../src/lib/tracking-insights';

const now = new Date('2026-09-27T18:00:00Z');
const episode = (
  id: number,
  chapter: number,
  date: string | null,
  watched = true
): InsightEpisode => ({
  id,
  episodeNumber: id,
  seasonNumber: 1,
  title: `EP.${chapter} [${id % 2 ? 1 : 2}/2]`,
  watched,
  watchedDate: date ? new Date(date) : null,
  duration: 10,
  durationSeconds: 120,
});
const episodes = [
  episode(1, 1, '2026-09-20'),
  episode(2, 1, '2026-09-21'),
  episode(3, 2, '2026-09-22'),
  episode(4, 2, null, false),
  episode(5, 3, null),
  episode(6, 3, '2026-09-23'),
  episode(7, 4, '2026-09-14'),
  episode(8, 4, '2026-09-20'),
  episode(9, 5, '2026-09-28'),
  episode(10, 5, '2026-09-24'),
];
const item = {
  id: 1,
  title: 'Test',
  href: '/series/1',
  completedDate: new Date('2026-09-21'),
  episodes,
};
const result = aggregateInsights([item], 7, now);
assert.deepEqual(result.current, {
  chapters: 1,
  series: 1,
  minutes: 8,
  unknownDurations: 0,
});
assert.deepEqual(result.previous, {
  chapters: 1,
  series: 0,
  minutes: 6,
  unknownDurations: 0,
});
assert.equal(result.rows[0].chapters, 1);
assert.equal(result.start, '2026-09-21T00:00:00.000Z');
assert.equal(result.previousStart, '2026-09-14T00:00:00.000Z');
assert.equal(
  +insightsRange(365, now).start - +insightsRange(365, now).previousStart,
  365 * 86400000
);
const missing = aggregateInsights(
  [
    {
      ...item,
      completedDate: null,
      episodes: [
        {
          ...episode(1, 1, '2026-09-27'),
          duration: null,
          durationSeconds: null,
        },
        episode(2, 1, null, false),
      ],
    },
  ],
  7,
  now
);
assert.equal(missing.current.unknownDurations, 1);
assert.equal(missing.current.chapters, 0);
assert.equal(missing.rows.length, 1);
assert.equal(aggregateInsights([], 7, now).rows.length, 0);
console.log(
  'PASS: chapter parts, cross-period completion, UTC boundaries, missing/future dates, duration precedence and partial activity.'
);
