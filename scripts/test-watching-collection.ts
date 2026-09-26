import assert from 'node:assert/strict';
import {
  readWatchingPreferences,
  selectWatchingItems,
  watchingDetailsUrl,
  watchingProgress,
  type WatchingItem,
} from '../src/lib/watching-collection';

const item: WatchingItem = {
  id: 1,
  status: 'VIENDO',
  lastWatchedAt: null,
  series: {
    id: 1,
    title: 'Title',
    originalTitle: 'Original',
    origin: 'CURATED',
    catalogScope: 'PERSONAL',
    hasWatchableEpisode: false,
    seasons: [
      {
        id: 10,
        seasonNumber: 1,
        episodes: [
          {
            id: 1,
            episodeNumber: 1,
            title: 'EP.1 [1/2]',
            viewStatus: [{ status: 'VISTA' }],
          },
          { id: 2, episodeNumber: 2, title: 'EP.1 [2/2]', viewStatus: [] },
          {
            id: 3,
            episodeNumber: 3,
            title: 'EP.2 [1/1]',
            viewStatus: [{ status: 'VISTA' }],
          },
        ],
      },
    ],
  },
};
const progress = watchingProgress(item);
assert.equal(progress.total, 2);
assert.equal(progress.watched, 1);
assert.equal(progress.next, null); // Resume follows the furthest watched chapter, even with earlier gaps.
const partial = watchingProgress({
  ...item,
  series: {
    ...item.series,
    seasons: [
      {
        ...item.series.seasons[0],
        episodes: item.series.seasons[0].episodes.slice(0, 2),
      },
    ],
  },
});
assert.deepEqual(partial.next?.episodeIds, [2]); // Never overwrite the already-watched first part.
assert.equal(partial.next?.episodeNumber, 1); // Playback starts at the first part.
assert.match(watchingDetailsUrl(item), /^\/series\//);
const contribution = {
  ...item,
  id: 2,
  status: 'RETOMAR',
  series: {
    ...item.series,
    id: 2,
    title: 'GL contribution',
    origin: 'USER_EMBED',
    catalogScope: 'WATCHABLE_ONLY',
  },
};
assert.match(watchingDetailsUrl(contribution), /^\/ver\//);
const unknown = {
  ...item,
  id: 3,
  series: { ...item.series, id: 3, title: 'Unknown total', seasons: [] },
};
const preferences = readWatchingPreferences({
  view: 'invalid',
  sort: 'remaining',
  pinned: [2, 2, -1, '3', null],
});
assert.deepEqual(preferences, { view: 'list', sort: 'remaining', pinned: [2] });
assert.deepEqual(readWatchingPreferences(null), {
  view: 'list',
  sort: 'recent',
  pinned: [],
});
assert.deepEqual(
  selectWatchingItems([item, contribution], '', 'RETOMAR', preferences),
  [contribution]
);
assert.deepEqual(selectWatchingItems([item], 'ORIGINAL', 'all', preferences), [
  item,
]);
const sorted = selectWatchingItems(
  [unknown, item, contribution],
  '',
  'all',
  preferences
);
assert.deepEqual(
  sorted.map((row) => row.id),
  [2, 1, 3]
);
assert.equal(item.series.seasons[0].episodes[1].viewStatus?.length, 0);
console.log(
  'PASS: chapter grouping, partial progress, catalog/viewing links, filtering, pinning and preference validation.'
);
