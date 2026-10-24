import assert from 'node:assert/strict';
import { prisma } from '../src/lib/database';
import {
  importWatchContentBatch,
  validateWatchContentBatch,
  type WatchContentBatch,
} from '../src/lib/watch-content-batch';
import type { VideoChannelInfo } from '../src/lib/channel-fetcher';
import type { PlaybackProbe } from '../src/lib/playability';
import { groupIntoChapters } from '../src/lib/episode-chapters';

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '');
  assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.port, '55433');
  assert.ok(
    ['/mundobl_replay', '/mundobl_ver_expansion'].includes(url.pathname)
  );
  const ids = ['testvideo01', 'testvideo02', 'testvideo03'];
  const channelId = 'UCMtOvsAU8M6Qu1-KwnURUfQ';
  const channels = new Map<string, VideoChannelInfo>(
    ids.map((videoId) => [
      videoId,
      {
        videoId,
        channelId,
        channelTitle: 'GND STUDIO',
        channelUrl: `https://www.youtube.com/channel/${channelId}`,
        official: true,
      },
    ])
  );
  const probes = new Map<string, PlaybackProbe>(
    ids.map((videoId) => [
      videoId,
      {
        videoId,
        status: 'OK',
        blockedMarkets: [],
        detail: null,
        durationSeconds: 600,
      },
    ])
  );
  const before = await prisma.series.count();
  const rollback = new Error('Rollback fixtures');
  try {
    await prisma.$transaction(
      async (tx) => {
        const title = `Watch batch test ${Date.now()}`;
        const country =
          (await tx.country.findFirst({ where: { code: 'kr' } })) ??
          (await tx.country.create({
            data: { code: 'kr', name: 'Test Korea' },
          }));
        const existing = await tx.series.create({
          data: {
            title,
            type: 'serie',
            countryId: country.id,
            review: 'Keep this review',
            seasons: {
              create: {
                seasonNumber: 1,
                episodes: { create: { episodeNumber: 1 } },
              },
            },
          },
          include: { seasons: { include: { episodes: true } } },
        });
        const episodeId = existing.seasons[0].episodes[0].id;
        const watched = await tx.viewStatus.create({
          data: { episodeId, status: 'VISTA' },
        });
        const entry = {
          title,
          targetSeriesId: existing.id,
          expectedTitle: title,
          countryCode: 'kr',
          year: 2024,
          channelId,
          playlistUrl: 'https://www.youtube.com/playlist?list=test',
          episodes: [
            {
              chapter: 1,
              part: 1,
              parts: 1,
              videoId: ids[0],
              publishedAt: '2024-01-01T00:00:00Z',
              sourceTitle: 'EP1',
            },
          ],
        };
        const batch: WatchContentBatch = {
          id: 'test-watch-batch',
          verifiedAt: '2026-10-24',
          series: [
            entry,
            {
              ...entry,
              title: `${title} split`,
              targetSeriesId: null,
              expectedTitle: null,
              episodes: ids.slice(1).map((videoId, i) => ({
                ...entry.episodes[0],
                videoId,
                part: i + 1,
                parts: 2,
              })),
            },
          ],
        };
        const dry = await importWatchContentBatch(
          tx,
          batch,
          channels,
          probes,
          probes
        );
        assert.deepEqual(
          dry.map((s) => s.addedVideos),
          [1, 2]
        );
        assert.equal(
          (await tx.episode.findUniqueOrThrow({ where: { id: episodeId } }))
            .embedUrl,
          null
        );
        assert.equal(await tx.series.count(), before + 1);
        const applied = await importWatchContentBatch(
          tx,
          batch,
          channels,
          probes,
          probes,
          true
        );
        const updated = await tx.series.findUniqueOrThrow({
          where: { id: existing.id },
        });
        assert.equal(updated.review, 'Keep this review');
        assert.equal(updated.editVersion, existing.editVersion + 1);
        assert.equal(
          (await tx.viewStatus.findUniqueOrThrow({ where: { id: watched.id } }))
            .episodeId,
          episodeId
        );
        assert.equal(
          (await tx.episode.findUniqueOrThrow({ where: { id: episodeId } }))
            .embedVideoId,
          ids[0]
        );
        assert.equal(
          await tx.seriesRevision.count({ where: { seriesId: existing.id } }),
          1
        );
        const split = await tx.episode.findMany({
          where: { season: { seriesId: applied[1].seriesId! } },
        });
        const chapters = groupIntoChapters(
          split.map((e) => ({ ...e, seasonNumber: 1 }))
        );
        assert.equal(chapters.chapters.length, 1);
        assert.equal(chapters.chapters[0].episodes.length, 2);
        assert.equal(chapters.extras.length, 0);
        const again = await importWatchContentBatch(
          tx,
          batch,
          channels,
          probes,
          probes,
          true
        );
        assert.deepEqual(
          again.map((s) => s.addedVideos),
          [0, 0]
        );
        assert.equal(
          await tx.seriesRevision.count({ where: { seriesId: existing.id } }),
          1
        );
        const rejected = structuredClone(batch);
        rejected.series[1].episodes.pop();
        assert.throws(
          () => validateWatchContentBatch(rejected, channels, probes, probes),
          /parts/
        );
        assert.throws(
          () => validateWatchContentBatch(batch, new Map(), probes, probes),
          /verified/
        );
        const blocked = new Map(probes);
        blocked.set(ids[0], {
          ...probes.get(ids[0])!,
          status: 'GEO_BLOCKED',
          blockedMarkets: ['AR'],
        });
        assert.throws(
          () => validateWatchContentBatch(batch, channels, blocked, probes),
          /playable/
        );
        const trailer = new Map(probes);
        trailer.set(ids[0], { ...probes.get(ids[0])!, durationSeconds: 90 });
        assert.throws(
          () => validateWatchContentBatch(batch, channels, trailer, probes),
          /playable/
        );
        const membersOnly = new Map(probes);
        membersOnly.set(ids[0], {
          ...probes.get(ids[0])!,
          status: 'REMOVED',
          detail: 'Only available to channel members',
        });
        // API says OK, anonymous watch page disagrees: never import it.
        assert.throws(
          () => validateWatchContentBatch(batch, channels, probes, membersOnly),
          /playable/
        );
        assert.throws(
          () => validateWatchContentBatch(batch, channels, probes, new Map()),
          /playable/
        );
        await tx.episode.update({
          where: { id: episodeId },
          data: {
            embedVideoId: 'different01',
            embedUrl: 'https://www.youtube.com/watch?v=different01',
          },
        });
        await assert.rejects(
          () =>
            importWatchContentBatch(tx, batch, channels, probes, probes, true),
          /Conflicting/
        );
        throw rollback;
      },
      { timeout: 60000 }
    );
  } catch (error) {
    if (error !== rollback) throw error;
  }
  assert.equal(await prisma.series.count(), before);
  console.log(
    'Watch batch: dry-run, exact identity, chapters/parts, tracking IDs, revision, idempotency, blocked/short/foreign rejection and rollback OK.'
  );
}
main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
