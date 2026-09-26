import 'dotenv/config';
import assert from 'node:assert/strict';
import {
  prisma,
  getTrackingHistory,
  clearTrackingHistory,
  restoreTrackingBackup,
} from '../src/lib/database';
import { markEpisode } from '../src/lib/tracking';
import { assertLocalTestDatabase } from './assert-local-test-database';

async function main() {
  assertLocalTestDatabase();
  assert.notEqual(
    process.env.MUNDOBL_TEST_RUNTIME,
    'prisma-dev',
    'History trigger/concurrency tests require native PostgreSQL'
  );
  const key = `history-test-${Date.now()}`;
  const userId = key;
  const otherId = `${key}-other`;
  const emptyId = `${key}-empty`;
  await prisma.user.createMany({
    data: [userId, otherId, emptyId].map((id) => ({
      id,
      email: `${id}@example.test`,
    })),
  });
  const series = await prisma.series.create({
    data: {
      title: key,
      type: 'serie',
      origin: 'USER_EMBED',
      catalogScope: 'WATCHABLE_ONLY',
      seasons: {
        create: { seasonNumber: 1, episodes: { create: { episodeNumber: 1 } } },
      },
    },
    include: { seasons: { include: { episodes: true } } },
  });
  const episodeId = series.seasons[0].episodes[0].id;
  const where = { userId, episodeId };
  try {
    await prisma.$transaction((tx) =>
      markEpisode(tx, userId, episodeId, 'VISTA')
    );
    let events = await prisma.trackingEvent.findMany({ where });
    assert.equal(events.length, 1);
    assert.equal(events[0].kind, 'RECORDED');
    const originalDate = events[0].watchedDate;
    await Promise.all(
      Array.from({ length: 4 }, () =>
        prisma.$transaction((tx) => markEpisode(tx, userId, episodeId, 'VISTA'))
      )
    );
    assert.equal(
      await prisma.trackingEvent.count({ where }),
      1,
      'Repeated/concurrent identical marks produce no extra event'
    );
    assert.deepEqual(
      (await prisma.trackingEvent.findFirstOrThrow({ where })).watchedDate,
      originalDate
    );
    await prisma.$transaction((tx) =>
      markEpisode(tx, userId, episodeId, 'SIN_VER')
    );
    events = await prisma.trackingEvent.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
    });
    assert.equal(events[0].kind, 'STATUS_CHANGED');
    assert.equal(events[0].previousStatus, 'VISTA');
    assert.equal(events[0].status, 'SIN_VER');
    assert.deepEqual(events[0].previousWatchedDate, originalDate);
    const beforeRollback = await prisma.trackingEvent.count({ where });
    await assert.rejects(
      prisma.$transaction(async (tx) => {
        await markEpisode(tx, userId, episodeId, 'VISTA');
        throw new Error('intentional history rollback');
      }),
      /intentional history rollback/
    );
    assert.equal(await prisma.trackingEvent.count({ where }), beforeRollback);
    assert.equal(
      (
        await prisma.viewStatus.findUniqueOrThrow({
          where: { userId_episodeId: where },
        })
      ).status,
      'SIN_VER'
    );
    await prisma.$transaction((tx) =>
      markEpisode(tx, userId, episodeId, 'VISTA')
    );
    for (let index = 0; index < 23; index++) {
      await prisma.viewStatus.update({
        where: { userId_episodeId: where },
        data: { watchedDate: new Date(Date.UTC(2020, 0, index + 1)) },
      });
    }
    await prisma.viewStatus.update({
      where: { userId_episodeId: where },
      data: { watchedDate: null },
    });
    const first = await getTrackingHistory(userId, key);
    assert.equal(first.items.length, 20);
    assert.equal(first.items[0].kind, 'DATE_CHANGED');
    assert.equal(first.items[0].watchedDate, null);
    assert.ok(first.items.every((item) => item.href.startsWith('/ver/')));
    await prisma.series.update({
      where: { id: series.id },
      data: { origin: 'CURATED', catalogScope: 'WATCHABLE_ONLY' },
    });
    assert.ok(
      (await getTrackingHistory(userId, key)).items.every((item) =>
        item.href.startsWith('/ver/')
      )
    );
    await prisma.series.update({
      where: { id: series.id },
      data: { catalogScope: 'PERSONAL' },
    });
    assert.ok(
      (await getTrackingHistory(userId, key)).items.every((item) =>
        item.href.startsWith('/series/')
      )
    );
    await prisma.series.update({
      where: { id: series.id },
      data: { origin: 'USER_EMBED', catalogScope: 'WATCHABLE_ONLY' },
    });
    assert.ok(first.nextCursor);
    const second = await getTrackingHistory(userId, key, {
      id: first.nextCursor.id,
      recordedAt: new Date(first.nextCursor.recordedAt),
    });
    const allIds = [...first.items, ...second.items].map((item) => item.id);
    assert.equal(new Set(allIds).size, allIds.length);
    assert.equal(
      allIds.length,
      await prisma.trackingEvent.count({ where: { userId } })
    );
    assert.equal((await getTrackingHistory(otherId, '')).items.length, 0);
    assert.equal(
      (await getTrackingHistory(userId, 'not-a-real-series')).items.length,
      0
    );
    assert.equal('userId' in first.items[0], false);

    const backup = JSON.parse(
      JSON.stringify({
        viewStatuses: await prisma.viewStatus.findMany({ where: { userId } }),
        trackingEvents: await prisma.trackingEvent.findMany({
          where: { userId },
        }),
      })
    ) as Record<string, unknown>;
    const preview = await restoreTrackingBackup(otherId, backup, true);
    assert.equal(preview.imported.trackingEvents, allIds.length);
    assert.equal(
      await prisma.trackingEvent.count({ where: { userId: otherId } }),
      0
    );
    await restoreTrackingBackup(otherId, backup, false);
    assert.equal(
      await prisma.trackingEvent.count({ where: { userId: otherId } }),
      allIds.length,
      'Replay must not create extra trigger events'
    );
    const repeated = await restoreTrackingBackup(otherId, backup, false);
    assert.equal(repeated.imported.trackingEvents, 0);
    assert.equal(repeated.skipped.trackingEvents, allIds.length);
    await restoreTrackingBackup(
      emptyId,
      { ...backup, trackingEvents: [] },
      false
    );
    assert.equal(
      await prisma.trackingEvent.count({ where: { userId: emptyId } }),
      0
    );
    await prisma.$transaction((tx) =>
      markEpisode(tx, emptyId, episodeId, 'SIN_VER')
    );
    assert.equal(
      await prisma.trackingEvent.count({ where: { userId: emptyId } }),
      1,
      'Restore suppression must end with its transaction'
    );
    const progressBeforeClear = await prisma.viewStatus.findMany({
      where: { userId },
    });
    await clearTrackingHistory(userId);
    assert.equal((await getTrackingHistory(userId, '')).items.length, 0);
    assert.deepEqual(
      await prisma.viewStatus.findMany({ where: { userId } }),
      progressBeforeClear
    );
    assert.equal(
      await prisma.trackingEvent.count({ where: { userId: otherId } }),
      allIds.length
    );
    const rls = await prisma.$queryRaw<
      { relrowsecurity: boolean }[]
    >`SELECT relrowsecurity FROM pg_class WHERE oid = 'public."TrackingEvent"'::regclass`;
    assert.equal(rls[0].relrowsecurity, true);
    console.log(
      'PASS native PostgreSQL: tracking trigger, concurrent retries, unmark, corrected/unknown dates, rollback, private paginated history, viewing links, export/restore replay, scoped clear and RLS enabled.'
    );
  } finally {
    await prisma.series.delete({ where: { id: series.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [userId, otherId, emptyId] } },
    });
  }
}

main().finally(() => prisma.$disconnect());
