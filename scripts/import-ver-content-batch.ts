/** Local-only rehearsal. No production switch, notifications or external writes. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parse } from 'dotenv';
import { verBatchArg, verContentBatch } from './data/ver-content-batch';
import { verifyYouTubeVideosOfficial } from '../src/lib/channel-fetcher';
import {
  probeViaApi,
  probeViaWatchPage,
  type PlaybackProbe,
} from '../src/lib/playability';
import {
  expectedPlaybackOf,
  expectedWatchPage,
  importWatchContentBatch,
  watchBatchVideoUrl,
} from '../src/lib/watch-content-batch';

// One page at a time, spaced: a burst of ~160 pages got HTTP 429 (2026-10-25).
const PAGE_DELAY_MS = 2000;
import { parseEpisodeSource } from '../src/lib/episode-platforms';
import { verifyExternalEpisode } from '../src/lib/external-episode-source';

async function main() {
  // Check BEFORE importing database.ts. Never fall back to .env's remote DB.
  const url = new URL(process.env.DATABASE_URL ?? '');
  if (
    url.hostname !== '127.0.0.1' ||
    url.port !== '55433' ||
    !['/mundobl_ver_expansion', '/mundobl_replay'].includes(url.pathname)
  ) {
    throw new Error('Only the local expansion/replay database is allowed.');
  }
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--apply' && !arg.startsWith('--batch=')))
    throw new Error('Unknown argument');
  const batch = verContentBatch(verBatchArg(args));
  if (!process.env.YOUTUBE_API_KEY) {
    process.env.YOUTUBE_API_KEY = parse(readFileSync('.env')).YOUTUBE_API_KEY;
  }
  if (!process.env.VIMEO_ACCESS_TOKEN) {
    process.env.VIMEO_ACCESS_TOKEN = parse(
      readFileSync('.env')
    ).VIMEO_ACCESS_TOKEN;
  }
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('YOUTUBE_API_KEY is required');
  const ids = batch.series
    .filter((s) => !s.platform || s.platform === 'YouTube')
    .flatMap((s) => s.episodes.map((e) => e.videoId));
  const channels = await verifyYouTubeVideosOfficial(ids);
  const probes = new Map<string, PlaybackProbe>();
  for (let i = 0; i < ids.length; i += 50) {
    for (const probe of await probeViaApi(ids.slice(i, i + 50), key)) {
      probes.set(probe.videoId, probe);
    }
  }
  // videos.list can say public + embeddable even for members-only videos.
  // Require the anonymous watch page too; UNKNOWN is not proof of access.
  // This local tool runs in AR. API checks above cover all core markets.
  const watchPages: PlaybackProbe[] = [];
  for (const id of ids) {
    if (watchPages.length) {
      await new Promise((resolve) => setTimeout(resolve, PAGE_DELAY_MS));
    }
    watchPages.push(await probeViaWatchPage(id, 'AR'));
    // Stop on an outage/rate limit; repeating requests cannot verify access.
    if (watchPages.some((probe) => probe.status === 'UNKNOWN')) break;
  }
  for (const series of batch.series.filter(
    (s) => s.platform && s.platform !== 'YouTube'
  )) {
    for (const episode of series.episodes) {
      const source = parseEpisodeSource(
        watchBatchVideoUrl(series, episode.videoId)
      );
      if (!source) throw new Error(`Invalid source: ${series.title}`);
      const info = await verifyExternalEpisode(source);
      channels.set(episode.videoId, {
        videoId: episode.videoId,
        channelId: info.ownerId,
        channelTitle: info.channelName,
        channelUrl: info.channelUrl,
        official: true,
      });
      probes.set(episode.videoId, info.probe);
      watchPages.push(info.probe); // Includes the separate unauthenticated oEmbed check.
      series.imageUrl ??= info.thumbnailUrl;
    }
  }
  mkdirSync('test-results/ver-expansion', { recursive: true });
  const checkedAt = new Date();
  const verification = JSON.stringify(
    { checkedAt, api: [...probes.values()], watchPages },
    null,
    2
  );
  writeFileSync(
    `test-results/ver-expansion/playback-${checkedAt.toISOString().replace(/[:.]/g, '-')}.json`,
    verification
  );
  writeFileSync(
    'test-results/ver-expansion/playback-verification.json',
    verification
  );
  // Age-restricted/non-embeddable/geo-blocked only when the manifest says so.
  const expected = expectedPlaybackOf(batch);
  const unavailable = watchPages.filter(
    (probe) =>
      probe.status !==
      expectedWatchPage(
        expected.get(probe.videoId) ?? 'OK',
        probes.get(probe.videoId) ?? probe
      )
  );
  if (unavailable.length) {
    throw new Error(
      `Anonymous playback could not be verified (${unavailable.length} failed; ${watchPages.length} checked): ${unavailable
        .slice(0, 3)
        .map((p) => `${p.videoId} (${p.detail ?? p.status})`)
        .join(
          '; '
        )}. See test-results/ver-expansion/playback-verification.json.`
    );
  }
  const { prisma } = await import('../src/lib/database');
  const apply = args.includes('--apply');
  try {
    const results = await prisma.$transaction(
      (tx) =>
        importWatchContentBatch(
          tx,
          batch,
          channels,
          probes,
          new Map(watchPages.map((probe) => [probe.videoId, probe])),
          apply
        ),
      { timeout: 60000, isolationLevel: 'Serializable' }
    );
    mkdirSync('test-results/ver-expansion', { recursive: true });
    writeFileSync(
      `test-results/ver-expansion/${apply ? 'applied' : 'preview'}.json`,
      JSON.stringify({ checkedAt: new Date(), apply, results }, null, 2)
    );
    console.table(results);
    console.log(apply ? 'Applied only to local DB.' : 'Dry-run: no writes.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Import failed');
  process.exitCode = 1;
});
