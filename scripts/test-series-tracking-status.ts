import assert from 'node:assert/strict';
import { prisma } from '../src/lib/database';
import { markEpisode, setSeriesTrackingStatus } from '../src/lib/tracking';
import { assertLocalTestDatabase } from './assert-local-test-database';
import { inSequence } from '../src/lib/prisma-client';

async function main() {
  assertLocalTestDatabase();
  const key = `series-status-${Date.now()}`;
  const user = await prisma.user.create({
    data: { id: key, email: `${key}@example.invalid` },
  });
  const series = await prisma.series.create({
    data: { title: key, type: 'serie' },
  });
  const where = { userId: user.id, seriesId: series.id };
  const mark = (status: 'VISTA' | 'SIN_VER' | 'VIENDO') =>
    inSequence((tx) => setSeriesTrackingStatus(tx, user.id, series.id, status));
  try {
    await Promise.all(Array.from({ length: 4 }, () => mark('VISTA')));
    assert.equal(
      await prisma.trackingEvent.count({ where }),
      1,
      'Concurrent first marks are one event'
    );
    const historical = new Date('2020-01-02T12:00:00Z');
    await prisma.viewStatus.updateMany({
      where,
      data: { watchedDate: historical },
    });
    assert.equal(
      (await mark('VISTA')).watchedDate?.toISOString(),
      historical.toISOString()
    );
    await prisma.viewStatus.updateMany({ where, data: { watchedDate: null } });
    const before = await prisma.trackingEvent.count({ where });
    assert.equal(
      (await mark('VISTA')).watchedDate,
      null,
      'Unknown dates stay unknown on retry'
    );
    assert.equal(await prisma.trackingEvent.count({ where }), before);
    await mark('SIN_VER');
    assert.ok(
      (await mark('VISTA')).watchedDate,
      'A new mark after unmark has a new date'
    );
    const watching = await mark('VIENDO');
    assert.deepEqual(
      (await mark('VIENDO')).lastWatchedAt,
      watching.lastWatchedAt
    );
    await prisma.seriesSubscription.deleteMany({ where });
    await mark('VIENDO');
    assert.equal(
      await prisma.seriesSubscription.count({ where }),
      0,
      'Retry does not resubscribe'
    );
    // El marcado de episodio decide en la misma sentencia (updateMany con el
    // estado en el WHERE): una serie cerrada a mano no vuelve a "viendo",
    // aunque el cierre haya entrado justo antes.
    {
      const season = await prisma.season.create({
        data: { seriesId: series.id, seasonNumber: 1 },
      });
      const episode = await prisma.episode.create({
        data: { seasonId: season.id, episodeNumber: 1 },
      });
      await mark('VISTA');
      await setSeriesTrackingStatus(prisma, user.id, series.id, 'ABANDONADA');
      await markEpisode(prisma, user.id, episode.id, 'VISTA');
      const saved = await prisma.viewStatus.findUniqueOrThrow({
        where: { userId_seriesId: where },
      });
      assert.equal(saved.status, 'ABANDONADA');
      assert.ok(saved.lastWatchedAt);
    }
    console.log(
      'PASS: concurrent first series marks, preserved known/unknown dates, unmark/re-mark, stable last activity and subscription control.'
    );
  } finally {
    await prisma.series.delete({ where: { id: series.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}
main().finally(() => prisma.$disconnect());
