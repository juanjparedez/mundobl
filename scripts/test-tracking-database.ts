import 'dotenv/config';
import assert from 'node:assert/strict';
import {
  prisma,
  restoreTrackingBackup,
  getContributionMetadata,
  searchContributionMetadata,
} from '../src/lib/database';
import { assertLocalTestDatabase } from './assert-local-test-database';

async function main() {
  assertLocalTestDatabase();
  const runId = Date.now();
  const owner = `tracking-db-${runId}`;
  const other = `${owner}-other`;
  const rollback = `${owner}-rollback`;
  const tagName = `Tracking Fixture ${runId}`;
  const date = '2020-02-03T12:34:56.000Z';
  await prisma.user.createMany({
    data: [owner, other, rollback].map((id) => ({
      id,
      email: `${id}@example.test`,
    })),
  });
  const series = await prisma.series.create({
    data: {
      title: owner,
      type: 'serie',
      seasons: {
        create: { seasonNumber: 1, episodes: { create: { episodeNumber: 1 } } },
      },
    },
    include: { seasons: { include: { episodes: true } } },
  });
  const seasonId = series.seasons[0].id;
  const episodeId = series.seasons[0].episodes[0].id;
  const tag = await prisma.tag.create({
    data: { name: tagName, category: 'trope' },
  });
  try {
    const payload = {
      viewStatuses: [
        {
          userId: other,
          seriesId: series.id,
          status: 'RETOMAR',
          watchedDate: null,
          lastWatchedAt: date,
        },
        { seasonId, status: 'VIENDO', watchedDate: null },
        { episodeId, status: 'VISTA', watchedDate: date },
      ],
      seriesNotes: [
        {
          userId: other,
          seriesId: series.id,
          body: 'Private series note',
          createdAt: date,
          updatedAt: date,
        },
      ],
      episodeNotes: [
        {
          userId: other,
          episodeId,
          body: 'Private episode note',
          createdAt: date,
          updatedAt: date,
        },
      ],
    };
    const preview = await restoreTrackingBackup(owner, payload, true);
    assert.deepEqual(preview.imported, {
      viewStatuses: 3,
      seriesNotes: 1,
      episodeNotes: 1,
    });
    assert.equal(
      await prisma.viewStatus.count({ where: { userId: owner } }),
      0
    );
    assert.equal(
      await prisma.episodeNote.count({ where: { userId: owner } }),
      0
    );
    const applied = await restoreTrackingBackup(owner, payload, false);
    assert.deepEqual(applied.imported, preview.imported);
    const episode = await prisma.viewStatus.findUniqueOrThrow({
      where: { userId_episodeId: { userId: owner, episodeId } },
    });
    assert.equal(episode.watchedDate?.toISOString(), date);
    const note = await prisma.episodeNote.findUniqueOrThrow({
      where: { userId_episodeId: { userId: owner, episodeId } },
    });
    assert.equal(note.updatedAt.toISOString(), date);
    assert.equal(note.body, 'Private episode note');
    assert.equal(
      await prisma.viewStatus.count({ where: { userId: other } }),
      0
    );
    assert.equal(
      await prisma.episodeNote.count({ where: { userId: other } }),
      0
    );
    const repeated = await restoreTrackingBackup(owner, payload, false);
    assert.deepEqual(repeated.imported, {
      viewStatuses: 0,
      seriesNotes: 0,
      episodeNotes: 0,
    });
    assert.deepEqual(repeated.skipped, {
      viewStatuses: 3,
      seriesNotes: 1,
      episodeNotes: 1,
    });
    const changedPayload = {
      ...payload,
      episodeNotes: [{ episodeId, body: 'Must not overwrite' }],
    };
    await restoreTrackingBackup(owner, changedPayload, false);
    assert.equal(
      (
        await prisma.episodeNote.findUniqueOrThrow({
          where: { userId_episodeId: { userId: owner, episodeId } },
        })
      ).body,
      'Private episode note'
    );
    await restoreTrackingBackup(other, payload, false);
    assert.equal(
      await prisma.viewStatus.count({ where: { userId: other } }),
      3
    );

    // D1 has no transactions: a restore that fails halfway keeps what it
    // already wrote. Prove that a retry converges to the full restore and
    // that the history lease is released after the failure.
    const triggerName = `test_restore_failure_${runId}`;
    await prisma.$executeRawUnsafe(
      `CREATE TRIGGER "${triggerName}" BEFORE INSERT ON "EpisodeNote" WHEN NEW."userId" = '${rollback}' BEGIN SELECT RAISE(ABORT, 'intentional test failure'); END`
    );
    try {
      await assert.rejects(
        restoreTrackingBackup(rollback, payload, false),
        /intentional test failure/
      );
    } finally {
      await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS "${triggerName}"`);
    }
    assert.equal(
      await prisma.lease.count({
        where: { key: `tracking-restore:${rollback}` },
      }),
      0
    );
    const retried = await restoreTrackingBackup(rollback, payload, false);
    assert.equal(retried.imported.episodeNotes, 1);
    assert.equal(
      await prisma.viewStatus.count({ where: { userId: rollback } }),
      3
    );
    assert.equal(
      await prisma.seriesNote.count({ where: { userId: rollback } }),
      1
    );
    assert.equal(
      await prisma.episodeNote.count({ where: { userId: rollback } }),
      1
    );

    const existing = await getContributionMetadata({
      tagNames: [tagName.toLowerCase(), ` ${tagName} `],
    });
    assert.ok(existing.ok);
    assert.deepEqual(existing.data.tagIds, [tag.id]);
    const count = await prisma.tag.count();
    const unresolved = await getContributionMetadata({
      tagNames: [`Missing ${runId}`],
    });
    assert.equal(unresolved.ok, false);
    assert.equal(await prisma.tag.count(), count);
    assert.deepEqual(await searchContributionMetadata('tags', tagName), [
      tagName,
    ]);
    const ambiguous = await prisma.tag.create({
      data: { name: tagName.toLowerCase(), category: 'trope' },
    });
    try {
      assert.equal(
        (await getContributionMetadata({ tagNames: [tagName] })).ok,
        false
      );
    } finally {
      await prisma.tag.delete({ where: { id: ambiguous.id } });
    }
    console.log(
      'PASS: SQL-backed preview, account ownership, date preservation, retry after a partial failure, existing-data priority, metadata matching, ambiguous names, read-only resolution. No production data.'
    );
  } finally {
    await prisma.series.deleteMany({ where: { id: series.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [owner, other, rollback] } },
    });
    await prisma.tag.deleteMany({ where: { id: tag.id } });
  }
}

main().finally(() => prisma.$disconnect());
