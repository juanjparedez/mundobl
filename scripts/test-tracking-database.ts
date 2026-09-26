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

    // Fail the final section in SQL and prove prior status/series-note writes roll back.
    // Identifiers and predicate use only this script's numeric run id, in the guarded disposable DB.
    if (process.env.MUNDOBL_TEST_RUNTIME !== 'prisma-dev') {
      const triggerName = `test_restore_failure_${runId}`;
      await prisma.$executeRawUnsafe(
        `CREATE FUNCTION "${triggerName}"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."userId" = '${rollback}' THEN RAISE EXCEPTION 'intentional test failure'; END IF; RETURN NEW; END $$`
      );
      try {
        await prisma.$executeRawUnsafe(
          `CREATE TRIGGER "${triggerName}" BEFORE INSERT ON "EpisodeNote" FOR EACH ROW EXECUTE FUNCTION "${triggerName}"()`
        );
        await assert.rejects(
          restoreTrackingBackup(rollback, payload, false),
          /intentional test failure/
        );
        assert.equal(
          await prisma.viewStatus.count({ where: { userId: rollback } }),
          0
        );
        assert.equal(
          await prisma.seriesNote.count({ where: { userId: rollback } }),
          0
        );
        assert.equal(
          await prisma.episodeNote.count({ where: { userId: rollback } }),
          0
        );
      } finally {
        await prisma.$executeRawUnsafe(
          `DROP TRIGGER IF EXISTS "${triggerName}" ON "EpisodeNote"`
        );
        await prisma.$executeRawUnsafe(`DROP FUNCTION "${triggerName}"()`);
      }
    } else {
      console.log(
        'SKIP: deliberate SQL-error rollback requires native PostgreSQL; PGlite socket cannot reliably recover its protocol after this exception.'
      );
    }

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
      `PASS: SQL-backed preview, account ownership, date preservation, retry, existing-data priority, metadata matching, ambiguous names, read-only resolution. Runtime: ${process.env.MUNDOBL_TEST_RUNTIME === 'prisma-dev' ? 'PGlite (rollback skipped)' : 'native PostgreSQL (rollback verified)'}. No production data.`
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
