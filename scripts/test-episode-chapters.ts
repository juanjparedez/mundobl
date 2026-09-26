/* eslint-disable no-console */
import assert from 'node:assert/strict';
import {
  countChapters,
  groupIntoChapters,
  toTrackedChapters,
} from '../src/lib/episode-chapters';

/**
 * Prueba de src/lib/episode-chapters.ts. Logica pura: no toca la base.
 * Los titulos imitan los de las playlists reales de GMMTV y Strongberry.
 *
 * Uso: npx tsx scripts/test-episode-chapters.ts
 */

let nextId = 1;
const row = (
  episodeNumber: number,
  title: string | null,
  seasonNumber = 1
) => ({
  id: nextId++,
  seasonNumber,
  episodeNumber,
  title,
});

// 1) Partes de GMMTV: 4 por capitulo, con el avance ("ตัวอย่าง") en el medio
//    y un detras de camara sin numero al final.
const gmmtv = [
  row(1, '[Eng Sub] Baker Boys | EP.1 [1/4]'),
  row(2, '[Eng Sub] Baker Boys | EP.1 [2/4]'),
  row(3, '[Eng Sub] Baker Boys | EP.1 [4/4]'),
  row(4, '[Eng Sub] Baker Boys | EP.1 [3/4]'),
  row(5, 'ตัวอย่าง Baker Boys | EP.2'),
  row(6, '[Eng Sub] Baker Boys | EP.2 [1/4]'),
  row(7, '[Eng Sub] Baker Boys | EP.2 [2/4]'),
  row(8, 'เบื้องหลัง เบเกอร์บอยส์'),
];
const g = groupIntoChapters(gmmtv);
assert.equal(g.byTitle, true);
assert.deepEqual(
  g.chapters.map((c) => [c.number, c.episodes.length]),
  [
    [1, 4],
    [2, 2],
  ]
);
assert.deepEqual(
  g.chapters[0].episodes.map((e) => e.episodeNumber),
  [1, 2, 4, 3],
  'las partes van por su numero, no por fila'
);
assert.equal(g.extras.length, 2, 'avance y detras de camara son extras');

// 2) Strongberry: un video por capitulo, casi todos con EP.N.
const strongberry = [
  row(1, '돌아온 이유가 궁금해! | EP.0 Choco Milk Shake [DRAMA]'),
  row(2, '이상한 남자들이 찾아왔다 | EP.1 Choco Milk Shake [DRAMA]'),
  row(3, '우리 집에 왜 왔니? | EP.2 Choco Milk Shake [DRAMA]'),
  row(4, 'Choco Milk Shake Teaser'),
];
const s = groupIntoChapters(strongberry);
assert.deepEqual(
  s.chapters.map((c) => c.number),
  [0, 1, 2]
);
assert.equal(s.extras.length, 1);

// 3) Ficha cargada a mano, sin titulos: cada fila es un capitulo.
const manual = [row(1, null), row(2, null), row(3, null)];
const m = groupIntoChapters(manual);
assert.equal(m.byTitle, false);
assert.equal(m.chapters.length, 3);
assert.equal(m.extras.length, 0);

// 4) Ficha con titulos reales y uno solo con numero: no manda la numeracion,
//    y "The Interview" no se vuelve extra.
const titled = [
  row(1, 'The First Day'),
  row(2, 'The Interview'),
  row(3, 'EP.3 Goodbye'),
];
const t = groupIntoChapters(titled);
assert.equal(t.byTitle, false);
assert.equal(t.chapters.length, 3);

// 5) Dos temporadas con la misma numeracion no se mezclan.
const seasons = [
  row(1, 'Show | EP.1 [1/2]', 1),
  row(2, 'Show | EP.1 [2/2]', 1),
  row(1, 'Show | EP.1 [1/2]', 2),
  row(2, 'Show | EP.1 [2/2]', 2),
];
assert.deepEqual(
  groupIntoChapters(seasons).chapters.map((c) => [c.seasonNumber, c.number]),
  [
    [1, 1],
    [2, 1],
  ]
);

// 6) toTrackedChapters: ids de todas las partes y sin el titulo de YouTube.
const tracked = toTrackedChapters(gmmtv);
assert.equal(tracked[0].episodeIds.length, 4);
assert.equal(tracked[0].title, null);
assert.equal(toTrackedChapters(titled)[1].title, 'The Interview');

// 7) countChapters: cuenta capitulos si hay episodios, si no el numero de
//    la temporada.
assert.equal(
  countChapters([
    { seasonNumber: 1, episodeCount: 64, episodes: gmmtv },
    { seasonNumber: 2, episodeCount: 10 },
  ]),
  12
);

console.log(
  JSON.stringify({
    result: 'PASS',
    checks: [
      'partes de GMMTV agrupadas y ordenadas; avance y extras aparte',
      'un video por capitulo con EP.N',
      'ficha sin titulos: una fila por capitulo',
      'titulos reales con un solo numero: no se reagrupan ni se pierden',
      'dos temporadas no se mezclan',
      'toTrackedChapters: ids de las partes, titulo solo en fichas a mano',
      'countChapters: capitulos cargados o, si no hay, el numero de la temporada',
    ],
  })
);
