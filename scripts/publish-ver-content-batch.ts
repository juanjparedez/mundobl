/** Explicit production release for this curated batch. Dry-run by default. */
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import {
  VER_BATCHES,
  verBatchArg,
  verContentBatch,
} from './data/ver-content-batch';
import {
  expectedPlaybackOf,
  expectedWatchPage,
  importWatchContentBatch,
  watchBatchVideoUrl,
} from '../src/lib/watch-content-batch';
import { verifyYouTubeVideosOfficial } from '../src/lib/channel-fetcher';
import { probeViaApi, type PlaybackProbe } from '../src/lib/playability';
import { parseEpisodeSource } from '../src/lib/episode-platforms';
import { verifyExternalEpisode } from '../src/lib/external-episode-source';

const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const MAX_EVIDENCE_AGE_MS = 60 * 60_000;

async function main() {
  // Never load a database implicitly from .env or accept another project.
  const url = new URL(process.env.DATABASE_URL ?? '');
  if (
    url.hostname !== 'aws-1-sa-east-1.pooler.supabase.com' ||
    url.pathname !== '/postgres' ||
    url.username !== 'postgres.vhwvzvteunwomnrlweoa'
  ) {
    throw new Error(
      'This release only targets the configured MundoBL production database.'
    );
  }
  const args = process.argv.slice(2);
  if (
    args.some(
      (arg) =>
        arg !== '--apply' &&
        !arg.startsWith('--batch=') &&
        !arg.startsWith('--evidence=') &&
        !arg.startsWith('--plan=')
    )
  )
    throw new Error('Unknown argument');
  const batchName = verBatchArg(args);
  const evidencePath = args
    .find((arg) => arg.startsWith('--evidence='))
    ?.slice(11);
  const planPath = args.find((arg) => arg.startsWith('--plan='))?.slice(7);
  const apply = args.includes('--apply');
  if (!evidencePath || (apply && !planPath))
    throw new Error(
      'Provide --evidence=; --apply also requires the reviewed --plan=.'
    );
  const evidenceText = readFileSync(evidencePath, 'utf8');
  const evidence: {
    checkedAt: string;
    watchPages: PlaybackProbe[];
    api: PlaybackProbe[];
  } = JSON.parse(evidenceText);
  const age = Date.now() - Date.parse(evidence.checkedAt);
  if (!Number.isFinite(age) || age < 0 || age > MAX_EVIDENCE_AGE_MS)
    throw new Error(
      'Fresh successful verification from the last hour is required.'
    );
  const batch = verContentBatch(batchName);
  const expected = VER_BATCHES[batchName].videos;
  const expectedPlayback = expectedPlaybackOf(batch);
  const manifestHash = sha(JSON.stringify(batch));
  const allIds = batch.series.flatMap((series) =>
    series.episodes.map((ep) => ep.videoId)
  );
  if (
    allIds.length !== expected ||
    new Set(allIds).size !== expected ||
    evidence.watchPages.length !== expected ||
    evidence.api.length !== expected ||
    new Set(evidence.watchPages.map((p) => p.videoId)).size !== expected ||
    new Set(evidence.api.map((p) => p.videoId)).size !== expected ||
    allIds.some((id) => {
      // OK unless the manifest declares age-restricted/non-embeddable/geo.
      const expected = expectedPlayback.get(id) ?? 'OK';
      const api = evidence.api.find((p) => p.videoId === id);
      return (
        !api ||
        api.status !== expected ||
        evidence.watchPages.find((p) => p.videoId === id)?.status !==
          expectedWatchPage(expected, api)
      );
    })
  ) {
    throw new Error('Evidence must cover every selected video successfully.');
  }
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('YOUTUBE_API_KEY required');
  const youtubeIds = batch.series
    .filter((s) => !s.platform || s.platform === 'YouTube')
    .flatMap((s) => s.episodes.map((e) => e.videoId));
  const channels = await verifyYouTubeVideosOfficial(youtubeIds);
  const probes = new Map<string, PlaybackProbe>();
  for (let offset = 0; offset < youtubeIds.length; offset += 50) {
    for (const probe of await probeViaApi(
      youtubeIds.slice(offset, offset + 50),
      key
    ))
      probes.set(probe.videoId, probe);
  }
  for (const series of batch.series.filter(
    (s) => s.platform && s.platform !== 'YouTube'
  )) {
    for (const episode of series.episodes) {
      const source = parseEpisodeSource(
        watchBatchVideoUrl(series, episode.videoId)
      );
      if (!source) throw new Error('Invalid source');
      const info = await verifyExternalEpisode(source);
      channels.set(episode.videoId, {
        videoId: episode.videoId,
        channelId: info.ownerId,
        channelTitle: info.channelName,
        channelUrl: info.channelUrl,
        official: true,
      });
      probes.set(episode.videoId, info.probe);
      series.imageUrl = info.thumbnailUrl;
    }
  }
  const { prisma } = await import('../src/lib/database');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const output = `backups/ver-release-${stamp}`;
  mkdirSync(output, { recursive: true });
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        if (!apply) await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
        const snapshot = await tx.series.findMany({
          where: {
            OR: batch.series.map((s) =>
              s.targetSeriesId
                ? { id: s.targetSeriesId }
                : { title: { equals: s.title, mode: 'insensitive' as const } }
            ),
          },
          include: {
            seasons: {
              orderBy: { id: 'asc' },
              include: { episodes: { orderBy: { id: 'asc' } } },
            },
          },
          orderBy: { id: 'asc' },
        });
        const snapshotHash = sha(JSON.stringify(snapshot));
        const target = `${url.hostname}/${url.username}${url.pathname}`;
        if (apply) {
          const plan: {
            target: string;
            manifestHash: string;
            snapshotHash: string;
            evidenceHash: string;
          } = JSON.parse(readFileSync(planPath!, 'utf8'));
          if (
            plan.target !== target ||
            plan.manifestHash !== manifestHash ||
            plan.snapshotHash !== snapshotHash ||
            plan.evidenceHash !== sha(evidenceText)
          )
            throw new Error(
              'The reviewed plan, evidence or production records changed; prepare a new dry-run.'
            );
        }
        const before = {
          series: await tx.series.count(),
          episodes: await tx.episode.count(),
        };
        // Scoped restore evidence, plus SeriesRevision inside the transactional importer.
        // No user/account tables are exported, modified or sent to CI artifacts.
        writeFileSync(
          `${output}/before.json`,
          JSON.stringify({ before, snapshot }, null, 2),
          { flag: 'wx' }
        );
        const results = await importWatchContentBatch(
          tx,
          batch,
          channels,
          probes,
          new Map(evidence.watchPages.map((p) => [p.videoId, p])),
          apply
        );
        return {
          target,
          manifestHash,
          snapshotHash,
          evidenceHash: sha(evidenceText),
          evidenceCheckedAt: evidence.checkedAt,
          apply,
          before,
          results,
        };
      },
      { timeout: 120_000, maxWait: 20_000, isolationLevel: 'Serializable' }
    );
    writeFileSync(
      `${output}/${apply ? 'applied' : 'plan'}.json`,
      JSON.stringify(result, null, 2),
      { flag: 'wx' }
    );
    console.table(result.results);
    console.log(
      `${apply ? 'Applied to production' : 'Read-only production plan'}: ${output}/${apply ? 'applied' : 'plan'}.json`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Release failed');
  process.exitCode = 1;
});
