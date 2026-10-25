import assert from 'node:assert/strict';
import {
  prisma,
  getAchievementCounts,
  recordSeriesShare,
} from '../src/lib/database';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  summarizeAchievements,
  sortAchievementsForDisplay,
  type AchievementStats,
} from '../src/lib/achievements';
import {
  PLATFORM_PATCHES,
  PLATFORM_PATCH_TIERS_TOTAL,
  evaluatePlatformPatches,
} from '../src/lib/platform-patches';
import { MESSAGES } from '../src/i18n/messages';
import { assertLocalTestDatabase } from './assert-local-test-database';

const PREFIX = 'Achievements test';

const EMPTY: AchievementStats = {
  watched: 0,
  totalEpisodes: 0,
  hoursWatched: 0,
  countriesWatched: 0,
  genresWatched: 0,
  longestStreakEver: 0,
  activeDays: 0,
  ratings: 0,
  publishedReviews: 0,
  helpfulVotesReceived: 0,
  featuredReviews: 0,
  favorites: 0,
  comments: 0,
  communityTopics: 0,
  communityReplies: 0,
  publicLists: 0,
  sharedSeries: 0,
  approvedSuggestions: 0,
  approvedGlossaryTerms: 0,
  glossaryQuizBestScore: null,
  completedByPlatform: [],
};

function definitionCases() {
  const keys = ACHIEVEMENTS.map((a) => a.key);
  assert.equal(new Set(keys).size, keys.length, 'unique keys');
  assert.ok(ACHIEVEMENTS.length >= 45, 'many more than the old 18');
  for (const category of ACHIEVEMENT_CATEGORIES) {
    assert.ok(
      ACHIEVEMENTS.some((a) => a.category === category),
      `category ${category} has achievements`
    );
  }
  for (const locale of ['es', 'en'] as const) {
    const messages = MESSAGES[locale]!.achievements as Record<string, string>;
    for (const key of keys) {
      assert.ok(messages[`${key}Name`], `${locale} ${key}Name`);
      assert.ok(messages[`${key}Desc`], `${locale} ${key}Desc`);
    }
  }
  const names = keys.map((key) => MESSAGES.es!.achievements[`${key}Name`]);
  assert.equal(new Set(names).size, names.length, 'no repeated es names');

  const none = summarizeAchievements(EMPTY);
  assert.equal(none.unlocked, 0);
  assert.equal(none.total, ACHIEVEMENTS.length + PLATFORM_PATCH_TIERS_TOTAL);

  const some = summarizeAchievements({
    ...EMPTY,
    watched: 5,
    hoursWatched: 10.9,
    publishedReviews: 1,
    sharedSeries: 1,
    longestStreakEver: 3,
    completedByPlatform: [
      { platform: 'YouTube', count: 5 },
      { platform: 'Viki', count: 1 },
    ],
  });
  const unlocked = some.items.filter((i) => i.unlocked).map((i) => i.key);
  assert.deepEqual(unlocked.sort(), [
    'firstReview',
    'firstShare',
    'firstStep',
    'hooked',
    'hours10',
    'onARoll',
    'streak3',
  ]);
  // 7 logros + YouTube bronce/plata + Viki bronce.
  assert.equal(some.unlocked, 10);
  const ordered = sortAchievementsForDisplay(some.items);
  assert.ok(ordered.slice(0, 7).every((i) => i.unlocked));
  // Primer pendiente: el mas cerca de su meta (starter, 5/10).
  assert.equal(ordered[7].key, 'starter');

  const patches = evaluatePlatformPatches([
    { platform: 'YouTube', count: 15 },
    { platform: 'GagaOOLala', count: 4 },
    { platform: 'Doramasflix', count: 30 },
  ]);
  assert.equal(patches.length, PLATFORM_PATCHES.length);
  const youtube = patches.find((p) => p.key === 'youtube')!;
  assert.equal(youtube.tier, 'gold');
  assert.equal(youtube.nextGoal, null);
  const gaga = patches.find((p) => p.key === 'gagaoolala')!;
  assert.equal(gaga.tier, 'bronze');
  assert.equal(gaga.nextGoal, 5);
  assert.ok(!patches.some((p) => p.platform === 'Doramasflix'));
}

async function main() {
  assertLocalTestDatabase();
  definitionCases();

  const series = (
    title: string,
    links: { platform: string; official?: boolean }[]
  ) =>
    prisma.series.create({
      data: {
        title: `${PREFIX} ${title}`,
        type: 'serie',
        origin: 'CURATED',
        catalogScope: 'PERSONAL',
        visibility: 'VISIBLE',
        watchLinks: {
          create: links.map((l) => ({
            platform: l.platform,
            url: `https://example.test/${title}/${l.platform}`,
            official: l.official ?? true,
          })),
        },
        seasons: {
          create: {
            seasonNumber: 1,
            episodes: {
              create: [1, 2, 3, 4, 5].map((episodeNumber) => ({
                episodeNumber,
              })),
            },
          },
        },
      },
      include: { seasons: { include: { episodes: true } } },
    });

  const a = await series('A', [{ platform: 'YouTube' }, { platform: 'Viki' }]);
  const b = await series('B', [
    { platform: 'YouTube' },
    { platform: 'Doramasflix' },
    { platform: 'GagaOOLala', official: false },
  ]);
  const c = await series('C', [{ platform: 'Netflix' }]);
  const user = await prisma.user.create({
    data: { email: `achievements-${Date.now()}@example.test` },
  });
  const other = await prisma.user.create({
    data: { email: `achievements-other-${Date.now()}@example.test` },
  });

  try {
    const userId = user.id;
    await prisma.viewStatus.createMany({
      data: [
        { userId, seriesId: a.id, status: 'VISTA' },
        { userId, seriesId: b.id, status: 'VISTA' },
        { userId, seriesId: c.id, status: 'VIENDO' },
      ],
    });
    // Racha: 3 dias seguidos, un hueco y 1 dia suelto.
    const day = (offset: number) =>
      new Date(Date.UTC(2026, 0, 10 + offset, 12));
    const episodes = a.seasons[0].episodes;
    await prisma.viewStatus.createMany({
      data: [0, 1, 2, 6].map((offset, index) => ({
        userId,
        episodeId: episodes[index].id,
        status: 'VISTA' as const,
        watchedDate: day(offset),
      })),
    });

    await prisma.review.create({
      data: {
        userId,
        seriesId: a.id,
        title: 'Pub',
        body: 'Publicada',
        status: 'PUBLISHED',
        helpfulCount: 4,
        isFeatured: true,
      },
    });
    await prisma.review.create({
      data: {
        userId,
        seriesId: b.id,
        title: 'Draft',
        body: 'Borrador',
        status: 'DRAFT',
        helpfulCount: 7,
      },
    });

    const topic = await prisma.communityTopic.create({
      data: {
        userId,
        seriesId: a.id,
        kind: 'DISCUSSION',
        title: 'Tema',
        body: 'Cuerpo',
      },
    });
    await prisma.communityTopic.create({
      data: {
        userId,
        seriesId: a.id,
        kind: 'DISCUSSION',
        title: 'Oculto',
        body: 'Cuerpo',
        moderationHidden: true,
      },
    });
    await prisma.communityReply.createMany({
      data: [
        { userId, topicId: topic.id, body: 'Uno' },
        { userId, topicId: topic.id, body: 'Dos' },
        { userId, topicId: topic.id, body: 'Oculta', moderationHidden: true },
      ],
    });

    await prisma.recommendationList.create({
      data: {
        userId,
        title: 'Publica',
        visibility: 'PUBLIC',
        items: { create: { seriesId: a.id, position: 1 } },
      },
    });
    await prisma.recommendationList.create({
      data: { userId, title: 'Publica vacia', visibility: 'PUBLIC' },
    });
    await prisma.recommendationList.create({
      data: {
        userId,
        title: 'Privada',
        items: { create: { seriesId: b.id, position: 1 } },
      },
    });

    await prisma.seriesSuggestion.createMany({
      data: [
        {
          userId,
          seriesId: a.id,
          type: 'OTRO',
          content: 'x',
          status: 'APPROVED',
        },
        { userId, seriesId: b.id, type: 'OTRO', content: 'y' },
      ],
    });
    await prisma.userActiveDay.createMany({
      data: [day(0), day(1)].map((d) => ({ userId, day: d })),
    });

    assert.equal(await recordSeriesShare(userId, a.id, 'copy'), true);
    assert.equal(await recordSeriesShare(userId, a.id, 'whatsapp'), true);
    assert.equal(await recordSeriesShare(userId, b.id, 'native'), true);
    assert.equal(await recordSeriesShare(userId, 2_000_000_000, 'copy'), false);
    await recordSeriesShare(other.id, c.id, 'copy');

    const counts = await getAchievementCounts(userId);
    assert.deepEqual(
      [...counts.completedByPlatform].sort((x, y) =>
        x.platform.localeCompare(y.platform)
      ),
      [
        // Doramasflix queda afuera (no es parche) y Gaga no es oficial en B;
        // C esta en VIENDO, asi que Netflix no suma.
        { platform: 'Viki', count: 1 },
        { platform: 'YouTube', count: 2 },
      ]
    );
    assert.deepEqual(
      { ...counts, completedByPlatform: undefined },
      {
        activeDays: 2,
        longestStreakEver: 3,
        publishedReviews: 1,
        helpfulVotesReceived: 4,
        featuredReviews: 1,
        communityTopics: 1,
        communityReplies: 2,
        publicLists: 1,
        sharedSeries: 2,
        approvedSuggestions: 1,
        completedByPlatform: undefined,
      }
    );
    const share = await prisma.seriesShare.findUniqueOrThrow({
      where: { userId_seriesId: { userId, seriesId: a.id } },
    });
    assert.equal(share.channel, 'copy', 'first share wins, repeats ignored');
    console.log('achievements: ok');
  } finally {
    await prisma.user.deleteMany({
      where: { id: { in: [user.id, other.id] } },
    });
    await prisma.series.deleteMany({
      where: { title: { startsWith: PREFIX } },
    });
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
