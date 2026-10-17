/* eslint-disable no-console */
import assert from 'node:assert/strict';
import {
  linkedEpisodesToSync,
  pairLinkedChapters,
} from '../src/lib/linked-progress';
import {
  mergeLinkedAportes,
  type WatchingItem,
} from '../src/lib/watching-collection';

/**
 * Prueba de src/lib/linked-progress.ts y mergeLinkedAportes. Logica pura: no
 * toca la base. Los casos imitan los dos aportes vinculados reales: Bad
 * Buddy (#555, capitulos en 4 partes con avances) -> #43, y Marry a CEO
 * (#548, 55 videos sin titulo) -> The Gaze (#415, 1 capitulo).
 *
 * Uso: npx tsx scripts/test-linked-progress.ts
 */

let nextId = 1;
const row = (episodeNumber: number, title: string | null = null) => ({
  id: nextId++,
  seasonNumber: 1,
  episodeNumber,
  title,
});

// Aporte tipo GMMTV: 3 capitulos de 2 partes, avance en el medio, trailer.
const aporte = [
  row(1, 'BAD BUDDY SERIES | EP.1 [1/2]'),
  row(2, 'BAD BUDDY SERIES | EP.1 [2/2]'),
  row(3, 'ตัวอย่าง BAD BUDDY SERIES | EP.2'),
  row(4, 'BAD BUDDY SERIES | EP.2 [1/2]'),
  row(5, 'BAD BUDDY SERIES | EP.2 [2/2]'),
  row(6, 'BAD BUDDY SERIES | EP.3 [1/2]'),
  row(7, 'BAD BUDDY SERIES | EP.3 [2/2]'),
  row(8, '[Official Trailer] BAD BUDDY SERIES'),
];
const curated = [row(1), row(2), row(3), row(4)];
const ids = (rows: { id: number }[]) => rows.map((r) => r.id);

// 1) Empareja por capitulo, no por video: avances y trailer quedan afuera.
const pairs = pairLinkedChapters(aporte, curated);
assert.ok(pairs);
assert.deepEqual(pairs, [
  { aporteIds: ids(aporte.slice(0, 2)), curatedIds: [curated[0].id] },
  { aporteIds: ids(aporte.slice(3, 5)), curatedIds: [curated[1].id] },
  { aporteIds: ids(aporte.slice(5, 7)), curatedIds: [curated[2].id] },
]);

// 2) Vinculo que no calza (55 videos contra 1 capitulo): no se copia nada.
const ceo = Array.from({ length: 55 }, (_, i) => row(i + 1));
assert.equal(pairLinkedChapters(ceo, [row(1, 'The Gaze EP01')]), null);
assert.equal(pairLinkedChapters([], curated), null);

// 3) Una parte de dos no es el capitulo; las dos, si.
const [ep1a, ep1b] = ids(aporte.slice(0, 2));
assert.deepEqual(
  linkedEpisodesToSync(pairs, 'aporte', new Set([ep1a]), new Set([ep1a]), true),
  []
);
assert.deepEqual(
  linkedEpisodesToSync(
    pairs,
    'aporte',
    new Set([ep1b]),
    new Set([ep1a, ep1b]),
    true
  ),
  [curated[0].id]
);

// 4) Desmarcar una parte desmarca el capitulo de la ficha.
assert.deepEqual(
  linkedEpisodesToSync(pairs, 'aporte', new Set([ep1b]), new Set(), false),
  [curated[0].id]
);

// 5) Desde la ficha: el capitulo marca todas sus partes; el 4 no existe en
//    el aporte y no marca nada.
assert.deepEqual(
  linkedEpisodesToSync(
    pairs,
    'curated',
    new Set([curated[1].id, curated[3].id]),
    new Set([curated[1].id, curated[3].id]),
    true
  ),
  ids(aporte.slice(3, 5))
);

// 6) /watching: aporte + ficha -> una tarjeta, la de la ficha, con Ver al
//    aporte en el capitulo que sigue.
const watched = new Set([ep1a, ep1b, curated[0].id]);
const series = (
  id: number,
  origin: string,
  rows: typeof aporte,
  extra: Partial<WatchingItem['series']> = {}
): Pick<WatchingItem, 'series'> => ({
  series: {
    id,
    title: `Serie ${id}`,
    origin,
    catalogScope: 'CATALOG',
    hasWatchableEpisode: origin === 'USER_EMBED',
    seasons: [
      {
        id,
        seasonNumber: 1,
        episodes: rows.map((r) => ({
          ...r,
          viewStatus: watched.has(r.id) ? [{ status: 'VISTA' }] : [],
        })),
      },
    ],
    ...extra,
  },
});
const merged = mergeLinkedAportes([
  series(555, 'USER_EMBED', aporte, { linkedSeriesId: 43 }),
  series(43, 'CURATED', curated),
  series(548, 'USER_EMBED', ceo, { linkedSeriesId: 415 }),
  series(415, 'CURATED', [row(1, 'The Gaze EP01')]),
]);
assert.deepEqual(
  merged.map((item) => item.series.id),
  [43, 548, 415]
);
assert.equal(merged[0].series.hasWatchableEpisode, true);
assert.deepEqual(merged[0].series.watchTarget, {
  id: 555,
  title: 'Serie 555',
  episode: { seasonNumber: 1, episodeNumber: 4 },
});
assert.equal(merged[2].series.watchTarget, undefined);

// 7) Solo el aporte en la lista: queda como esta.
const alone = mergeLinkedAportes([
  series(555, 'USER_EMBED', aporte, { linkedSeriesId: 43 }),
]);
assert.equal(alone[0].series.id, 555);

console.log(JSON.stringify({ result: 'PASS', checks: 7 }));
