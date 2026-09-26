import assert from 'node:assert/strict';
import {
  prisma,
  getWriterById,
  getPublicWriterCredits,
  getWritersIndex,
} from '../src/lib/database';
import { assertLocalTestDatabase } from './assert-local-test-database';

async function main() {
  assertLocalTestDatabase();
  const key = `writer-${Date.now()}`;
  const writer = await prisma.writer.create({
    data: {
      name: key,
      aliases: ['Synthetic alias'],
      imageAttribution: 'Fixture attribution',
      imageLicense: 'Fixture license',
      bioSourceUrl: 'https://example.invalid/bio',
    },
  });
  const ids: number[] = [];
  try {
    for (const kind of ['catalog', 'watchable', 'hidden', 'empty'] as const) {
      const contribution = kind === 'watchable' || kind === 'empty';
      const series = await prisma.series.create({
        data: {
          title: `${key}-${kind}`,
          type: 'serie',
          origin: contribution ? 'USER_EMBED' : 'CURATED',
          catalogScope: contribution ? 'WATCHABLE_ONLY' : 'PERSONAL',
          visibility: kind === 'hidden' ? 'HIDDEN' : 'VISIBLE',
          notesPrivate: true,
          observations: 'Never leak editorial private notes',
          writers: {
            create: {
              writerId: writer.id,
              sourceUrl: 'https://example.invalid/credit',
            },
          },
          ...(kind === 'watchable'
            ? {
                seasons: {
                  create: {
                    seasonNumber: 1,
                    episodes: {
                      create: {
                        episodeNumber: 1,
                        durationSeconds: 1200,
                        embedUrl: 'https://www.youtube.com/embed/fixture',
                      },
                    },
                  },
                },
              }
            : {}),
        },
      });
      ids.push(series.id);
    }
    const catalogCredits = await getPublicWriterCredits(ids[0]);
    assert.deepEqual(catalogCredits, [
      { writer: { id: writer.id, name: key } },
    ]);
    assert.deepEqual(await getPublicWriterCredits(ids[2]), []);
    assert.equal((await getPublicWriterCredits(ids[1])).length, 1);
    const result = await getWriterById(writer.id);
    assert.ok(result);
    assert.equal(result.series.length, 2);
    assert.equal(
      (await getWritersIndex()).find((item) => item.id === writer.id)
        ?.creditCount,
      2
    );
    assert.equal(result.imageAttribution, 'Fixture attribution');
    for (const credit of result.series) {
      assert.equal(credit.sourceUrl, 'https://example.invalid/credit');
      assert.equal('notesPrivate' in credit.series, false);
      assert.equal('observations' in credit.series, false);
      assert.ok(
        credit.href.startsWith(
          credit.series.origin === 'CURATED' ? '/series/' : '/ver/'
        )
      );
    }
    await assert.rejects(
      prisma.seriesWriter.create({
        data: { seriesId: ids[0], writerId: writer.id },
      }),
      { code: 'P2002' }
    );
    await prisma.series.update({
      where: { id: ids[0] },
      data: { visibility: 'HIDDEN' },
    });
    assert.equal((await getWriterById(writer.id))?.series.length, 1);
    const rls = await prisma.$queryRaw<{ relrowsecurity: boolean }[]>`
      SELECT relrowsecurity FROM pg_class WHERE oid IN ('public."Writer"'::regclass, 'public."SeriesWriter"'::regclass)`;
    assert.equal(rls.length, 2);
    assert.ok(rls.every((row) => row.relrowsecurity));
    await prisma.series.deleteMany({ where: { id: { in: ids } } });
    assert.equal(
      await prisma.seriesWriter.count({ where: { writerId: writer.id } }),
      0
    );
    assert.equal(
      (await getWritersIndex()).some((item) => item.id === writer.id),
      false
    );
    assert.ok(
      await getWriterById(writer.id),
      'Removing an individual work retains person identity'
    );
    console.log(
      'PASS: writer provenance, distinct role, public credit scope, routes, unique credits, cascade and RLS enabled.'
    );
  } finally {
    await prisma.series.deleteMany({ where: { id: { in: ids } } });
    await prisma.writer.delete({ where: { id: writer.id } });
  }
}
main().finally(() => prisma.$disconnect());
