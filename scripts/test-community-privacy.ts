import assert from 'node:assert/strict';
import { prisma, getCommunityReviews } from '../src/lib/database';
import { getContentUrl } from '../src/lib/slug';
import { assertLocalTestDatabase } from './assert-local-test-database';

async function main() {
  assertLocalTestDatabase();
  const key = `community-${Date.now()}`;
  const user = await prisma.user.create({
    data: { id: key, email: `${key}@example.invalid` },
  });
  const ids: number[] = [];
  try {
    async function fixture(
      kind: 'public' | 'draft' | 'hidden' | 'spoiler' | 'embed' | 'empty'
    ) {
      const embedded = kind === 'embed' || kind === 'empty';
      const series = await prisma.series.create({
        data: {
          title: `${key}-${kind}`,
          type: 'serie',
          origin: embedded ? 'USER_EMBED' : 'CURATED',
          catalogScope: embedded ? 'WATCHABLE_ONLY' : 'PERSONAL',
          visibility: kind === 'hidden' ? 'HIDDEN' : 'VISIBLE',
          ...(kind === 'embed'
            ? {
                seasons: {
                  create: {
                    seasonNumber: 1,
                    episodes: {
                      create: {
                        episodeNumber: 1,
                        embedUrl: 'https://www.youtube.com/embed/synthetic',
                        durationSeconds: 1200,
                      },
                    },
                  },
                },
              }
            : {}),
        },
      });
      ids.push(series.id);
      const review = await prisma.review.create({
        data: {
          seriesId: series.id,
          userId: user.id,
          title: `${key}-title-${kind}`,
          body: 'Never expose the body in the discovery payload',
          status: kind === 'draft' ? 'DRAFT' : 'PUBLISHED',
          hasSpoilers: kind === 'spoiler',
          publishedAt: new Date(),
        },
      });
      return { series, review };
    }
    const published = await fixture('public');
    const draft = await fixture('draft');
    const hidden = await fixture('hidden');
    const spoiler = await fixture('spoiler');
    const embedded = await fixture('embed');
    const empty = await fixture('empty');
    const { items: rows } = await getCommunityReviews();
    assert.ok(rows.some((row) => row.id === published.review.id));
    for (const item of [draft, hidden, empty])
      assert.equal(
        rows.some((row) => row.id === item.review.id),
        false
      );
    assert.equal(rows.find((row) => row.id === spoiler.review.id)?.title, null);
    const embeddedRow = rows.find((row) => row.id === embedded.review.id);
    assert.ok(embeddedRow);
    assert.ok(getContentUrl(embeddedRow.series).startsWith('/ver/'));
    const payload = JSON.stringify(rows);
    assert.equal(payload.includes('Never expose the body'), false);
    assert.equal(payload.includes(user.email), false);
    assert.equal(payload.includes(spoiler.review.title), false);
    const filtered = await getCommunityReviews(1, `${key}-PUBLIC`);
    assert.equal(filtered.items.length, 1);
    assert.equal(filtered.items[0].id, published.review.id);
    assert.equal(
      (await getCommunityReviews(1, `${key}-hidden`)).items.length,
      0
    );
    assert.equal(
      (await getCommunityReviews(1, `${key}-absent`)).items.length,
      0
    );
    await assert.rejects(getCommunityReviews(1, 'x'.repeat(101)), RangeError);
    await prisma.review.update({
      where: { id: published.review.id },
      data: { status: 'HIDDEN' },
    });
    assert.equal(
      (await getCommunityReviews()).items.some(
        (row) => row.id === published.review.id
      ),
      false
    );
    await prisma.review.createMany({
      data: Array.from({ length: 31 }, (_, index) => ({
        userId: user.id,
        seriesId: published.series.id,
        language: `fixture-${index}`,
        title: `${key}-page-${index}`,
        body: 'Pagination fixture',
        status: 'PUBLISHED' as const,
        publishedAt: new Date(),
      })),
    });
    const first = await getCommunityReviews(1);
    const second = await getCommunityReviews(2);
    assert.equal(first.items.length, 30);
    assert.equal(first.hasNext, true);
    assert.ok(second.items.length > 0);
    assert.equal(
      first.items.some((row) =>
        second.items.some((other) => other.id === row.id)
      ),
      false
    );
    const paged = [...first.items, ...second.items].filter((row) =>
      row.title?.startsWith(`${key}-page-`)
    );
    assert.equal(
      paged.length,
      31,
      'Every fixture remains reachable across the page boundary'
    );
    await assert.rejects(getCommunityReviews(0), RangeError);
    console.log(
      'PASS: public community excludes drafts, hidden content, missing viewing destinations, spoiler titles and private fields; unpublishing is reflected on the next read.'
    );
  } finally {
    await prisma.series.deleteMany({ where: { id: { in: ids } } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}
main().finally(() => prisma.$disconnect());
