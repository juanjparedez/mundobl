import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import {
  packCatalog,
  unpackCatalog,
} from '../src/app/(app)/catalogo/catalogTransport';
import type { SerieData } from '../src/app/(app)/catalogo/catalogTypes';
import { createCatalogSynopsisReader } from '../src/lib/catalog-synopsis';

async function main() {
  const series: SerieData[] = Array.from({ length: 700 }, (_, index) => ({
    id: String(index + 1),
    titulo: `Serie ${index}`,
    pais: 'Tailandia',
    paisCode: 'TH',
    tipo: 'serie',
    temporadas: 1,
    episodios: 12,
    anio: 2026,
    rating: index % 10,
    synopsis:
      `Sinopsis de la serie ${index}. ` +
      'Dos protagonistas se encuentran y construyen su historia. '.repeat(12),
    tags: Array.from({ length: 12 }, (_, id) => ({
      id,
      name: `Etiqueta compartida ${id}`,
    })),
    actors: [`Actor ${index % 30}`],
    genres: ['Romance'],
    platforms: ['YouTube'],
    watchableHere: true,
  }));
  const packed = packCatalog(series);
  assert.equal(packed.tags.length, 12);
  assert.deepEqual(
    unpackCatalog(packed),
    series.map(({ synopsis: _synopsis, ...row }) => row)
  );
  const before = JSON.stringify(series),
    after = JSON.stringify(packed);
  assert(Buffer.byteLength(after) < Buffer.byteLength(before) * 0.5);
  console.log('Synthetic 700-title fixture (not production billing):', {
    beforeBytes: Buffer.byteLength(before),
    afterBytes: Buffer.byteLength(after),
    beforeGzip: gzipSync(before).length,
    afterGzip: gzipSync(after).length,
  });
  let calls = 0,
    now = 0,
    fail = false;
  const reader = createCatalogSynopsisReader(
    async () => {
      calls++;
      await Promise.resolve();
      return fail
        ? new Response(null, { status: 503 })
        : Response.json({ synopsis: 'Texto completo' });
    },
    () => now
  );
  assert.deepEqual(
    await Promise.all([reader('1'), reader('1'), reader('1')]),
    Array(3).fill('Texto completo')
  );
  assert.equal(calls, 1);
  now = 59_999;
  await reader('1');
  assert.equal(calls, 1);
  now = 60_000;
  fail = true;
  await assert.rejects(reader('1'));
  assert.equal(calls, 2);
  fail = false;
  await reader('1');
  assert.equal(calls, 3);
  const empty = createCatalogSynopsisReader(async () =>
    Response.json({ synopsis: null })
  );
  assert.equal(await empty('2'), null);
  const invalid = createCatalogSynopsisReader(async () =>
    Response.json({ synopsis: { secret: 'invalid' } })
  );
  await assert.rejects(invalid('2'));
  console.log(
    'PASS: all filter data preserved, public preview deduplication, expiry, retry, null and invalid responses.'
  );
}
void main();
