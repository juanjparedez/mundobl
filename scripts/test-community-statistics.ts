import assert from 'node:assert/strict';
import {
  prisma,
  getPublishedReviewStats,
  getActiveCommunityUsersWhere,
} from '../src/lib/database';
import { getPublicStats } from '../src/lib/public-stats';
import { assertLocalTestDatabase } from './assert-local-test-database';

async function main() {
  assertLocalTestDatabase();
  const key = `stats-${Date.now()}`;
  const since = new Date(Date.now() - 7 * 86400000);
  const old = new Date('2020-01-01');
  const ids: number[] = [];
  const users = [
    'review',
    'draft',
    'hidden',
    'embed',
    'empty',
    'admin',
    'old',
    'comment',
    'private',
    'rating',
    'favorite',
    'tracking',
    'banned',
  ];
  const publicBefore = (await getPublicStats()).summary.totalPublishedReviews;
  const adminBefore = await getPublishedReviewStats(since);
  try {
    for (const name of users) {
      await prisma.user.create({
        data: {
          id: `${key}-${name}`,
          email: `${key}-${name}@example.invalid`,
          role: name === 'admin' ? 'ADMIN' : 'VISITOR',
          banned: name === 'banned',
        },
      });
    }
    for (const name of [
      'review',
      'draft',
      'hidden',
      'embed',
      'empty',
      'admin',
      'old',
      'banned',
    ]) {
      const embedded = name === 'embed' || name === 'empty';
      const series = await prisma.series.create({
        data: {
          title: `${key}-${name}`,
          type: 'serie',
          visibility: name === 'hidden' ? 'HIDDEN' : 'VISIBLE',
          origin: embedded ? 'USER_EMBED' : 'CURATED',
          catalogScope: embedded ? 'WATCHABLE_ONLY' : 'PERSONAL',
          ...(name === 'embed'
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
      await prisma.review.create({
        data: {
          userId: `${key}-${name}`,
          seriesId: series.id,
          title: name,
          body: 'Synthetic review',
          status: name === 'draft' ? 'DRAFT' : 'PUBLISHED',
          publishedAt:
            name === 'draft' ? null : name === 'old' ? old : new Date(),
          updatedAt: name === 'old' ? old : new Date(),
        },
      });
    }
    await prisma.comment.createMany({
      data: ['comment', 'private'].map((name) => ({
        userId: `${key}-${name}`,
        seriesId: ids[0],
        content: 'Synthetic comment',
        isPrivate: name === 'private',
      })),
    });
    await prisma.userRating.create({
      data: {
        userId: `${key}-rating`,
        seriesId: ids[0],
        category: 'overall',
        score: 8,
      },
    });
    await prisma.userFavorite.create({
      data: { userId: `${key}-favorite`, seriesId: ids[0] },
    });
    await prisma.viewStatus.create({
      data: { userId: `${key}-tracking`, seriesId: ids[0], status: 'VIENDO' },
    });

    // Public: published accessible reviews, including watchable contributions and old reviews.
    // Banned accounts follow the existing community stats policy (only ADMIN excluded).
    assert.equal(
      (await getPublicStats()).summary.totalPublishedReviews - publicBefore,
      4
    );
    const admin = await getPublishedReviewStats(since);
    assert.equal(admin.total - adminBefore.total, 7);
    assert.equal(admin.recent - adminBefore.recent, 6);
    const active = await prisma.user.findMany({
      where: {
        AND: [getActiveCommunityUsersWhere(since), { id: { startsWith: key } }],
      },
      select: { id: true },
    });
    const activeIds = new Set(active.map((row) => row.id));
    for (const name of [
      'review',
      'comment',
      'rating',
      'favorite',
      'tracking',
    ]) {
      assert.ok(
        activeIds.has(`${key}-${name}`),
        `${name}-only user must be active`
      );
    }
    for (const name of ['draft', 'private', 'old', 'banned']) {
      assert.ok(
        !activeIds.has(`${key}-${name}`),
        `${name} must not count as active`
      );
    }
    await prisma.series.update({
      where: { id: ids[0] },
      data: { visibility: 'HIDDEN' },
    });
    assert.equal(
      (await getPublicStats()).summary.totalPublishedReviews - publicBefore,
      3
    );
    await prisma.review.updateMany({
      where: { userId: `${key}-embed` },
      data: { status: 'DRAFT' },
    });
    assert.equal(
      (await getPublicStats()).summary.totalPublishedReviews - publicBefore,
      2
    );
    console.log(
      'PASS: review counts, visibility, drafts, admin scope, recent window and activity-only users'
    );
  } finally {
    await prisma.series.deleteMany({ where: { id: { in: ids } } });
    await prisma.user.deleteMany({
      where: { id: { in: users.map((name) => `${key}-${name}`) } },
    });
  }
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
