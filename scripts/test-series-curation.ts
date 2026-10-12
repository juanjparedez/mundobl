import assert from 'node:assert/strict';
import { prisma } from '../src/lib/database';
import { curationSnapshot, mergeCuration } from '../src/lib/series-curation';
import {
  loadSeriesForSave,
  saveSeriesFromForm,
  SeriesEditConflictError,
} from '../src/lib/series-save';

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '');
  assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.port, '55433');
  assert.equal(url.pathname, '/mundobl_replay');
  const series = await prisma.series.create({
    data: {
      title: `Curation ${Date.now()}`,
      type: 'serie',
      catalogScope: 'WATCHABLE_ONLY',
      synopsis: 'Imported',
      review: 'Keep editorial review',
      seasons: {
        create: [
          {
            seasonNumber: 1,
            episodeCount: 1,
            episodes: {
              create: {
                episodeNumber: 1,
                embedUrl: 'https://youtube.com/watch?v=existing',
              },
            },
          },
          { seasonNumber: 2 },
        ],
      },
      watchLinks: {
        create: {
          platform: 'YouTube',
          url: 'https://youtube.com/watch?v=existing',
        },
      },
    },
  });
  try {
    const current = await loadSeriesForSave(prisma, series.id);
    assert.ok(current);
    const episode = await prisma.episode.findFirstOrThrow({
      where: { season: { seriesId: series.id } },
    });
    const body = mergeCuration(
      current,
      {
        title: series.title,
        editVersion: 0,
        synopsis: 'Curated',
        review: '',
        seasons: [
          { id: -123, seasonNumber: 1, episodeCount: 2 },
          { id: -456, seasonNumber: 3, episodeCount: 1 },
        ],
        watchLinks: [{ platform: 'Viki', url: 'https://viki.com/new' }],
      },
      ['synopsis']
    );
    assert.equal(body.review, 'Keep editorial review');
    assert.equal(body.seasons?.length, 3);
    assert.equal(body.seasons?.[0].id, current.seasons[0].id);
    assert.equal(body.seasons?.[2].id, undefined);
    const image = { url: null, thumbUrl: null };
    await assert.rejects(
      saveSeriesFromForm(series.id, body, image, null, async () => {
        throw new Error('append failed');
      }),
      /append failed/
    );
    assert.equal(
      (await prisma.series.findUniqueOrThrow({ where: { id: series.id } }))
        .editVersion,
      0
    );
    assert.equal(
      await prisma.seriesRevision.count({ where: { seriesId: series.id } }),
      0
    );
    await saveSeriesFromForm(series.id, body, image, null);
    const saved = await loadSeriesForSave(prisma, series.id);
    assert.ok(saved);
    assert.equal(saved.synopsis, 'Curated');
    assert.equal(saved.review, 'Keep editorial review');
    assert.equal(saved.catalogScope, 'PERSONAL');
    assert.equal(saved.watchLinks.length, 2);
    assert.equal(saved.seasons.length, 3);
    assert.equal(
      (await prisma.episode.findUniqueOrThrow({ where: { id: episode.id } }))
        .embedUrl,
      episode.embedUrl
    );
    await assert.rejects(
      saveSeriesFromForm(series.id, body, image, null),
      SeriesEditConflictError
    );
    const revision = await prisma.seriesRevision.findFirstOrThrow({
      where: { seriesId: series.id },
    });
    assert.equal(
      (revision.snapshot as { synopsis: string }).synopsis,
      'Imported'
    );
    assert.equal(curationSnapshot(saved).title, series.title);
    console.log(
      'PASS: curated precedence, explicit selection, original seasons/episodes/links retained, foreign IDs ignored, new seasons appended, rollback, revision and stale-write protection.'
    );
  } finally {
    await prisma.series.delete({ where: { id: series.id } });
  }
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
