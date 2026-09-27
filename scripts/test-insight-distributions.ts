import assert from 'node:assert/strict';
import {
  insightDistribution,
  filterInsightRows,
  type InsightRow,
} from '../src/lib/insight-distributions';

const base: InsightRow = {
  id: 1,
  title: 'A',
  href: '/series/1',
  chapters: 99,
  minutes: 999,
  completed: false,
  metadata: {
    country: { id: 1, name: 'Thailand', code: 'TH' },
    genres: [
      { id: 1, name: 'Romance' },
      { id: 2, name: 'Drama' },
      { id: 1, name: 'Romance' },
    ],
    type: 'serie',
    format: 'regular',
  },
};
const rows = [
  base,
  {
    ...base,
    id: 2,
    chapters: 1,
    metadata: {
      ...base.metadata!,
      genres: [{ id: 1, name: 'Romance' }],
      format: 'vertical',
    },
  },
  { ...base, id: 3, metadata: undefined },
];
assert.deepEqual(
  insightDistribution(rows, 'genre').map(({ key, count }) => ({ key, count })),
  [
    { key: '1', count: 2 },
    { key: '2', count: 1 },
    { key: 'unknown', count: 1 },
  ]
);
assert.equal(insightDistribution([...rows, base], 'country')[0].count, 2);
assert.deepEqual(
  filterInsightRows(rows, { dimension: 'genre', key: '2' }).map(
    (row) => row.id
  ),
  [1]
);
assert.deepEqual(
  filterInsightRows(rows, { dimension: 'country', key: 'unknown' }).map(
    (row) => row.id
  ),
  [3]
);
assert.deepEqual(
  filterInsightRows(rows, { dimension: 'format', key: 'vertical' }).map(
    (row) => row.id
  ),
  [2]
);
assert.equal(filterInsightRows(rows, null).length, 3);
assert.deepEqual(insightDistribution([], 'type'), []);
console.log(
  'PASS: one vote per work/category, duplicate and multi-genre handling, unknown metadata, category filters and empty period.'
);
