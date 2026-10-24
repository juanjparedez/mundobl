import assert from 'node:assert/strict';
import {
  prisma,
  getOnboardingSeries,
  recordUserActiveDay,
} from '../src/lib/database';
import {
  completeOnboarding,
  OnboardingInputError,
  parseOnboardingPicks,
} from '../src/lib/onboarding';
import { assertLocalTestDatabase } from './assert-local-test-database';

const PREFIX = 'Onboarding test';
const YEAR = new Date().getUTCFullYear();

function parsingCases() {
  assert.deepEqual(parseOnboardingPicks([]), []);
  assert.deepEqual(parseOnboardingPicks([{ seriesId: 1 }]), [
    { seriesId: 1, seasonNumber: null, episodeNumber: null },
  ]);
  assert.deepEqual(
    parseOnboardingPicks([{ seriesId: 1, seasonNumber: 2, episodeNumber: 3 }]),
    [{ seriesId: 1, seasonNumber: 2, episodeNumber: 3 }]
  );
  const bad: unknown[] = [
    'nope',
    [{ seriesId: 'x' }],
    [{ seriesId: 1 }, { seriesId: 1 }],
    [{ seriesId: 1, episodeNumber: 0, seasonNumber: 1 }],
    [{ seriesId: 1, episodeNumber: 2 }],
    [1, 2, 3, 4, 5, 6].map((seriesId) => ({ seriesId })),
  ];
  for (const raw of bad) {
    assert.throws(() => parseOnboardingPicks(raw), OnboardingInputError);
  }
}

async function main() {
  assertLocalTestDatabase();
  parsingCases();

  const make = (
    title: string,
    opts: { airDays?: string | null; year?: number; contentRating?: string }
  ) =>
    prisma.series.create({
      data: {
        title: `${PREFIX} ${title}`,
        type: 'serie',
        origin: 'CURATED',
        catalogScope: 'PERSONAL',
        visibility: 'VISIBLE',
        airDays: opts.airDays === undefined ? 'lunes' : opts.airDays,
        year: opts.year ?? YEAR,
        contentRating: opts.contentRating,
        seasons: {
          create: [1, 2].map((seasonNumber) => ({
            seasonNumber,
            episodes: {
              create: [1, 2, 3, 4].map((episodeNumber) => ({ episodeNumber })),
            },
          })),
        },
      },
    });

  const airing = await make('Airing', {});
  const second = await make('Second', {});
  const adult = await make('Adult', { contentRating: 'ADULT18' });
  const ended = await make('Ended', { airDays: null });
  const user = await prisma.user.create({
    data: { email: `onboarding-${Date.now()}@example.test` },
  });

  try {
    const rows = await getOnboardingSeries();
    const ids = rows.map((row) => row.id);
    assert.ok(ids.includes(airing.id));
    assert.ok(!ids.includes(adult.id), 'no +18 in a modal shown anywhere');
    assert.ok(!ids.includes(ended.id), 'only airing series');
    assert.deepEqual(rows.find((row) => row.id === airing.id)?.latestSeason, {
      seasonNumber: 2,
      episodeCount: 4,
    });

    const result = await completeOnboarding(user.id, [
      { seriesId: airing.id, seasonNumber: 2, episodeNumber: 2 },
      { seriesId: second.id, seasonNumber: null, episodeNumber: null },
      // Ya no elegible: se ignora sin romper el resto.
      { seriesId: ended.id, seasonNumber: null, episodeNumber: null },
    ]);
    assert.equal(result.followed, 2);

    const statuses = await prisma.viewStatus.findMany({
      where: { userId: user.id, seriesId: { not: null } },
      select: { seriesId: true, status: true },
    });
    assert.deepEqual(
      statuses.map((s) => [s.seriesId, s.status]).sort(),
      [
        [airing.id, 'VIENDO'],
        [second.id, 'VIENDO'],
      ].sort()
    );
    // S2E2 marca S1 entera + S2E1-2.
    const watched = await prisma.viewStatus.count({
      where: { userId: user.id, episodeId: { not: null }, status: 'VISTA' },
    });
    assert.equal(watched, 6);
    const subscriptions = await prisma.seriesSubscription.count({
      where: { userId: user.id },
    });
    assert.equal(subscriptions, 2, 'following subscribes to alerts');

    const after = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { onboardingCompletedAt: true },
    });
    assert.ok(after.onboardingCompletedAt);

    await recordUserActiveDay(user.id);
    await recordUserActiveDay(user.id);
    assert.equal(
      await prisma.userActiveDay.count({ where: { userId: user.id } }),
      1,
      'one row per day'
    );
    console.log('onboarding: ok');
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
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
