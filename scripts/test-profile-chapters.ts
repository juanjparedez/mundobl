import assert from 'node:assert/strict';
import { countWatchedChapters } from '../src/lib/episode-chapters';

const parts = [
  {
    id: 1,
    seasonNumber: 1,
    episodeNumber: 1,
    title: 'EP.1 [1/2]',
    watched: true,
  },
  {
    id: 2,
    seasonNumber: 1,
    episodeNumber: 2,
    title: 'EP.1 [2/2]',
    watched: false,
  },
  {
    id: 3,
    seasonNumber: 1,
    episodeNumber: 3,
    title: 'EP.2 [1/2]',
    watched: true,
  },
  {
    id: 4,
    seasonNumber: 1,
    episodeNumber: 4,
    title: 'EP.2 [2/2]',
    watched: true,
  },
  {
    id: 5,
    seasonNumber: 1,
    episodeNumber: 5,
    title: 'Trailer EP.3',
    watched: true,
  },
];
assert.equal(
  countWatchedChapters(parts),
  1,
  'A partial chapter and a trailer must not inflate the total'
);
assert.equal(
  countWatchedChapters(parts.map((row) => ({ ...row, watched: true }))),
  2
);
assert.equal(
  countWatchedChapters(parts.map((row) => ({ ...row, watched: false }))),
  0
);
assert.equal(countWatchedChapters([]), 0);
assert.equal(
  countWatchedChapters([
    { id: 6, seasonNumber: 1, episodeNumber: 1, watched: true },
    { id: 7, seasonNumber: 2, episodeNumber: 1, watched: true },
    { id: 8, seasonNumber: 2, episodeNumber: 2, watched: false },
  ]),
  2,
  'Untitled catalog chapters retain their season boundaries'
);
console.log(
  'PASS: watched chapter totals respect parts, extras, seasons and incomplete chapters.'
);
