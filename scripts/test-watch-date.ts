import assert from 'node:assert/strict';
import { prisma, correctWatchDate } from '../src/lib/database';
import { parseWatchDateEdit } from '../src/lib/watch-date';
import { assertLocalTestDatabase } from './assert-local-test-database';

async function main() {
  assertLocalTestDatabase();
  const now = new Date('2026-09-26T12:00:00Z');
  const base = { seriesId: 1, watchedDate: '2020-02-29', expectedDate: null };
  assert.ok(parseWatchDateEdit(base, now));
  for (const payload of [
    { ...base, watchedDate: '2021-02-29' },
    { ...base, watchedDate: '2026-09-27' },
    { ...base, episodeId: 2 },
    { ...base, expectedDate: undefined },
    { ...base, watchedDate: undefined },
  ])
    assert.equal(parseWatchDateEdit(payload, now), null);
  assert.ok(parseWatchDateEdit({ ...base, watchedDate: null }, now));
  const key = `date-edit-${Date.now()}`;
  const user = await prisma.user.create({
    data: { id: key, email: `${key}@example.invalid` },
  });
  const series = await prisma.series.create({
    data: { title: key, type: 'serie' },
  });
  const target = { seriesId: series.id };
  const where = { userId: user.id, ...target };
  const historical = new Date('2020-01-01T00:00:00Z');
  try {
    const row = await prisma.viewStatus.create({
      data: { ...where, status: 'VISTA', watchedDate: historical },
    });
    assert.equal(
      await correctWatchDate('another-account', target, null, historical),
      false
    );
    const alternatives = await Promise.all([
      correctWatchDate(
        user.id,
        target,
        new Date('2021-01-01T00:00:00Z'),
        historical
      ),
      correctWatchDate(
        user.id,
        target,
        new Date('2022-01-01T00:00:00Z'),
        historical
      ),
    ]);
    assert.equal(
      alternatives.filter(Boolean).length,
      1,
      'Only one concurrent correction may use the same expected date'
    );
    const updated = await prisma.viewStatus.findUniqueOrThrow({
      where: { id: row.id },
    });
    assert.equal(updated.status, 'VISTA');
    assert.equal(updated.lastWatchedAt, row.lastWatchedAt);
    assert.equal(
      await correctWatchDate(user.id, target, null, updated.watchedDate),
      true
    );
    const events = await prisma.trackingEvent.findMany({ where });
    assert.equal(
      events.filter((event) => event.kind === 'DATE_CHANGED').length,
      2
    );
    const count = events.length;
    assert.equal(await correctWatchDate(user.id, target, null, null), true);
    assert.equal(
      await prisma.trackingEvent.count({ where }),
      count,
      'Identical correction adds no history event'
    );
    await prisma.viewStatus.update({
      where: { id: row.id },
      data: { status: 'SIN_VER' },
    });
    assert.equal(
      await correctWatchDate(user.id, target, historical, null),
      false
    );
    const season = await prisma.season.create({
      data: { seriesId: series.id, seasonNumber: 1 },
    });
    const episode = await prisma.episode.create({
      data: { seasonId: season.id, episodeNumber: 1 },
    });
    await prisma.viewStatus.createMany({
      data: [
        {
          userId: user.id,
          seasonId: season.id,
          status: 'VISTA',
          watchedDate: historical,
        },
        {
          userId: user.id,
          episodeId: episode.id,
          status: 'VISTA',
          watchedDate: historical,
        },
      ],
    });
    const corrected = new Date('2023-01-01T00:00:00Z');
    assert.equal(
      await correctWatchDate(
        user.id,
        { seasonId: season.id },
        corrected,
        historical
      ),
      true
    );
    const seasonEvent = await prisma.trackingEvent.findFirstOrThrow({
      where: { userId: user.id, seasonId: season.id, kind: 'DATE_CHANGED' },
    });
    assert.equal(seasonEvent.watchedDate?.getTime(), corrected.getTime());
    const unchangedEpisode = await prisma.viewStatus.findFirstOrThrow({
      where: { userId: user.id, episodeId: episode.id },
    });
    assert.equal(unchangedEpisode.status, 'VISTA');
    assert.equal(unchangedEpisode.watchedDate?.getTime(), historical.getTime());
    assert.equal(
      (await prisma.viewStatus.findUniqueOrThrow({ where: { id: row.id } }))
        .status,
      'SIN_VER'
    );
    console.log(
      'PASS: strict calendar dates, future/invalid rejection, account isolation, stale/concurrent correction, unknown dates, unchanged progress and private history.'
    );
  } finally {
    await prisma.series.delete({ where: { id: series.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}
main().finally(() => prisma.$disconnect());
