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
import { isOfficialChannelId } from '../src/lib/official-channels';
import {
  VER_BATCHES,
  verBatchArg,
  verContentBatch,
  type VerBatchName,
} from './data/ver-content-batch';

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '');
  assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.port, '55433');
  assert.ok(
    ['/mundobl_replay', '/mundobl_ver_expansion'].includes(url.pathname)
  );
  // Releases pick one batch explicitly and verify exactly its declared videos.
  assert.throws(() => verBatchArg([]), /--batch=/);
  assert.throws(() => verBatchArg(['--batch=2020-01-01']), /--batch=/);
  for (const name of Object.keys(VER_BATCHES) as VerBatchName[]) {
    assert.equal(verBatchArg([`--batch=${name}`]), name);
    const { series } = verContentBatch(name);
    const videos = series.flatMap((s) => s.episodes.map((e) => e.videoId));
    assert.equal(videos.length, VER_BATCHES[name].videos);
    assert.equal(new Set(videos).size, videos.length);
    for (const s of series.filter(
      (s) => (s.platform ?? 'YouTube') === 'YouTube'
    ))
      assert.ok(isOfficialChannelId(s.channelId), s.title);
  }
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
                // Chapter 2 is not published yet (a series still airing).
                episodes: {
                  create: [{ episodeNumber: 1 }, { episodeNumber: 2 }],
                },
              },
            },
          },
          include: { seasons: { include: { episodes: true } } },
        });
        const episodeId = existing.seasons[0].episodes.find(
          (e) => e.episodeNumber === 1
        )!.id;
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
        // The unpublished chapter stays a chapter, not an extra.
        const airing = groupIntoChapters(
          (
            await tx.episode.findMany({
              where: { season: { seriesId: existing.id } },
            })
          ).map((e) => ({ ...e, seasonNumber: 1 }))
        );
        assert.equal(airing.chapters.length, 2);
        assert.equal(airing.extras.length, 0);
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
        // Partes sobre capitulos cargados a mano: la fila de cada capitulo
        // queda como parte 1 y lo visto se copia a la otra parte.
        const manual = await tx.series.create({
          data: {
            title: `${title} manual`,
            type: 'serie',
            countryId: country.id,
            seasons: {
              create: {
                seasonNumber: 1,
                episodes: {
                  create: [1, 2, 3].map((episodeNumber) => ({ episodeNumber })),
                },
              },
            },
          },
          include: { seasons: { include: { episodes: true } } },
        });
        const [row1, row2, row3] = [...manual.seasons[0].episodes].sort(
          (a, b) => a.episodeNumber - b.episodeNumber
        );
        await tx.viewStatus.create({
          data: { episodeId: row2.id, status: 'VISTA' },
        });
        const partIds = [
          'testpart001',
          'testpart002',
          'testpart003',
          'testpart004',
        ];
        const ageId = partIds[3];
        const partChannels = new Map(
          partIds.map((videoId) => [
            videoId,
            { ...channels.get(ids[0])!, videoId },
          ])
        );
        const partProbes = new Map<string, PlaybackProbe>(
          partIds.map((videoId) => [
            videoId,
            {
              ...probes.get(ids[0])!,
              videoId,
              status: videoId === ageId ? 'AGE_RESTRICTED' : 'OK',
            },
          ])
        );
        const remapBatch: WatchContentBatch = {
          id: 'test-watch-batch-remap',
          verifiedAt: '2026-10-25',
          series: [
            {
              ...entry,
              title: manual.title,
              targetSeriesId: manual.id,
              expectedTitle: manual.title,
              episodes: partIds.map((videoId, i) => ({
                ...entry.episodes[0],
                videoId,
                chapter: Math.floor(i / 2) + 1,
                part: (i % 2) + 1,
                parts: 2,
                ...(videoId === ageId
                  ? { playback: 'AGE_RESTRICTED' as const }
                  : {}),
              })),
            },
          ],
        };
        // Age-restricted only when declared, and never members-only.
        const undeclared = structuredClone(remapBatch);
        delete undeclared.series[0].episodes[3].playback;
        assert.throws(
          () =>
            validateWatchContentBatch(
              undeclared,
              partChannels,
              partProbes,
              partProbes
            ),
          /playable/
        );
        const members = new Map(partProbes);
        members.set(ageId, { ...partProbes.get(ageId)!, status: 'REMOVED' });
        assert.throws(
          () =>
            validateWatchContentBatch(
              remapBatch,
              partChannels,
              partProbes,
              members
            ),
          /playable/
        );
        await importWatchContentBatch(
          tx,
          remapBatch,
          partChannels,
          partProbes,
          partProbes,
          true
        );
        const remapped = await tx.episode.findMany({
          where: { seasonId: manual.seasons[0].id },
          orderBy: { episodeNumber: 'asc' },
        });
        assert.deepEqual(
          remapped.map((e) => e.episodeNumber),
          [1, 2, 3, 4, 5]
        );
        assert.deepEqual(
          [remapped[0].id, remapped[2].id, remapped[4].id],
          [row1.id, row2.id, row3.id]
        );
        assert.equal(remapped[4].embedVideoId, null);
        assert.equal(remapped[3].playback, 'AGE_RESTRICTED');
        const remapChapters = groupIntoChapters(
          remapped.map((e) => ({ ...e, seasonNumber: 1 }))
        );
        assert.deepEqual(
          remapChapters.chapters.map((c) => c.episodes.length),
          [2, 2, 1]
        );
        assert.equal(remapChapters.extras.length, 0);
        assert.equal(
          await tx.viewStatus.count({
            where: { episodeId: { in: [row2.id, remapped[3].id] } },
          }),
          2
        );
        assert.equal(
          await tx.viewStatus.count({ where: { episodeId: remapped[1].id } }),
          0
        );
        const remapAgain = await importWatchContentBatch(
          tx,
          remapBatch,
          partChannels,
          partProbes,
          partProbes,
          true
        );
        assert.equal(remapAgain[0].addedVideos, 0);
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
    'Watch batch: manifests/--batch, declared age-restricted, parts onto manual chapters, dry-run, exact identity, chapters/parts, tracking IDs, revision, idempotency, blocked/short/foreign rejection and rollback OK.'
  );
}
main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
