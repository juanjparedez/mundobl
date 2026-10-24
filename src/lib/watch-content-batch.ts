import type { Prisma } from '@/generated/prisma';
import type { VideoChannelInfo } from './channel-fetcher';
import { isOfficialChannelId } from './official-channels';
import { MIN_EPISODE_SECONDS, type PlaybackProbe } from './playability';
import { parseEpisodeSource, type EpisodePlatform } from './episode-platforms';
import { findOfficialVideoPublisher } from './official-video-publishers';

export interface WatchBatchEpisode {
  chapter: number;
  part: number;
  parts: number;
  videoId: string;
  publishedAt: string;
  sourceTitle: string;
}

export interface WatchBatchSeries {
  platform?: EpisodePlatform;
  type?: 'serie' | 'pelicula' | 'corto' | 'especial';
  imageUrl?: string | null;
  title: string;
  targetSeriesId: number | null;
  expectedTitle: string | null;
  countryCode: string;
  year: number;
  channelId: string;
  playlistUrl: string;
  episodes: WatchBatchEpisode[];
}

export function watchBatchVideoUrl(
  entry: WatchBatchSeries,
  videoId: string
): string {
  switch (entry.platform ?? 'YouTube') {
    case 'YouTube':
      return `https://www.youtube.com/watch?v=${videoId}`;
    case 'Vimeo':
      return `https://vimeo.com/${videoId}`;
    case 'Dailymotion':
      return `https://www.dailymotion.com/video/${videoId}`;
  }
}

export interface WatchContentBatch {
  id: string;
  verifiedAt: string;
  series: WatchBatchSeries[];
}

/** This curated manifest selects exact videos, never every item in a playlist. */
export function validateWatchContentBatch(
  batch: WatchContentBatch,
  channels: Map<string, VideoChannelInfo>,
  probes: Map<string, PlaybackProbe>,
  watchPages: Map<string, PlaybackProbe>
) {
  const used = new Set<string>();
  if (!batch.id || batch.series.length === 0) throw new Error('Empty batch');
  for (const series of batch.series) {
    const platform = series.platform ?? 'YouTube';
    if (
      !series.title.trim() ||
      (platform === 'YouTube' && !isOfficialChannelId(series.channelId))
    ) {
      throw new Error(`Unverified series/channel: ${series.title}`);
    }
    const chapters = new Map<number, WatchBatchEpisode[]>();
    for (const ep of series.episodes) {
      if (
        ![ep.chapter, ep.part, ep.parts].every(
          (n) => Number.isInteger(n) && n > 0
        ) ||
        !Number.isFinite(Date.parse(ep.publishedAt)) ||
        parseEpisodeSource(watchBatchVideoUrl(series, ep.videoId))?.videoId !==
          ep.videoId ||
        used.has(ep.videoId)
      ) {
        throw new Error(`Invalid/duplicate episode: ${ep.videoId}`);
      }
      used.add(ep.videoId);
      const info = channels.get(ep.videoId);
      const probe = probes.get(ep.videoId);
      if (
        !info?.official ||
        info.channelId !== series.channelId ||
        (platform !== 'YouTube' &&
          !findOfficialVideoPublisher(platform, info.channelId, ep.videoId)) ||
        probe?.status !== 'OK' ||
        watchPages.get(ep.videoId)?.status !== 'OK' ||
        probe.durationSeconds === null ||
        probe.durationSeconds < MIN_EPISODE_SECONDS
      ) {
        throw new Error(`Video is not verified and playable: ${ep.videoId}`);
      }
      chapters.set(ep.chapter, [...(chapters.get(ep.chapter) ?? []), ep]);
    }
    const numbers = [...chapters.keys()].sort((a, b) => a - b);
    if (!numbers.length || numbers.some((n, i) => n !== i + 1)) {
      throw new Error(`Missing chapters: ${series.title}`);
    }
    for (const parts of chapters.values()) {
      const ordered = [...parts].sort((a, b) => a.part - b.part);
      if (
        ordered.some(
          (ep, i) => ep.part !== i + 1 || ep.parts !== ordered.length
        )
      ) {
        throw new Error(`Missing/duplicate parts: ${series.title}`);
      }
    }
  }
}

/**
 * Call inside one transaction. Dry-run only reads. Existing chapter IDs and
 * editorial metadata are preserved; a conflicting embed aborts the whole batch.
 * Split videos are accepted only for new seasons: mapping them onto tracked
 * chapter rows needs an explicit migration, never a silent renumbering.
 */
export async function importWatchContentBatch(
  tx: Prisma.TransactionClient,
  batch: WatchContentBatch,
  channels: Map<string, VideoChannelInfo>,
  probes: Map<string, PlaybackProbe>,
  watchPages: Map<string, PlaybackProbe>,
  apply = false
) {
  validateWatchContentBatch(batch, channels, probes, watchPages);
  const results: Array<{
    title: string;
    seriesId: number | null;
    newSeries: boolean;
    chapters: number;
    addedVideos: number;
    skippedVideos: number;
  }> = [];
  for (const entry of batch.series) {
    const platform = entry.platform ?? 'YouTube';
    const matches = await tx.series.findMany({
      where: entry.targetSeriesId
        ? { id: entry.targetSeriesId }
        : { title: { equals: entry.title, mode: 'insensitive' } },
      include: { seasons: { include: { episodes: true } } },
    });
    const existing = matches[0];
    if (
      matches.length > 1 ||
      (entry.targetSeriesId &&
        (!existing || existing.title !== entry.expectedTitle)) ||
      (existing &&
        !entry.targetSeriesId &&
        (existing.catalogScope !== 'WATCHABLE_ONLY' ||
          existing.year !== entry.year ||
          entry.episodes.some(
            (ep) =>
              !existing.seasons.some((s) =>
                s.episodes.some(
                  (e) =>
                    e.embedPlatform === platform &&
                    e.embedVideoId === ep.videoId
                )
              )
          ))) ||
      (existing &&
        (existing.origin !== 'CURATED' || existing.visibility !== 'VISIBLE'))
    ) {
      throw new Error(`Ambiguous or changed target: ${entry.title}`);
    }
    const season = existing?.seasons.find((s) => s.seasonNumber === 1);
    const ordered = [...entry.episodes].sort(
      (a, b) => a.chapter - b.chapter || a.part - b.part
    );
    const split = ordered.some((e) => e.parts > 1);
    const targets = ordered.map((ep, i) => ({
      ep,
      number: split ? i + 1 : ep.chapter,
      title: `${entry.title} EP.${ep.chapter}${ep.parts > 1 ? ` [${ep.part}/${ep.parts}]` : ''}`,
    }));
    const videos = await tx.episode.findMany({
      where: {
        OR: [
          {
            embedPlatform: platform,
            embedVideoId: { in: ordered.map((e) => e.videoId) },
          },
          {
            embedUrl: {
              in: ordered.map((e) => watchBatchVideoUrl(entry, e.videoId)),
            },
          },
        ],
      },
      select: { id: true, seasonId: true },
    });
    if (videos.some((v) => v.seasonId !== season?.id)) {
      throw new Error(
        `Video already belongs to another series: ${entry.title}`
      );
    }
    const pending = targets.filter(({ ep, number, title }) => {
      const row = season?.episodes.find((e) => e.episodeNumber === number);
      if (row?.embedUrl || row?.embedVideoId) {
        if (
          row.embedVideoId === ep.videoId &&
          row.embedPlatform === platform &&
          row.embedUrl === watchBatchVideoUrl(entry, ep.videoId) &&
          (!split || row.title === title)
        ) {
          return false;
        }
        throw new Error(`Conflicting episode: ${entry.title} / ${number}`);
      }
      if (split && season?.episodes.length) {
        throw new Error(`Cannot renumber existing chapters: ${entry.title}`);
      }
      return true;
    });
    const result = {
      title: entry.title,
      seriesId: existing?.id ?? null,
      newSeries: !existing,
      chapters: new Set(ordered.map((e) => e.chapter)).size,
      addedVideos: pending.length,
      skippedVideos: targets.length - pending.length,
    };
    results.push(result);
    if (!apply || !pending.length) continue;

    const country = await tx.country.findFirst({
      where: { code: { equals: entry.countryCode, mode: 'insensitive' } },
      select: { id: true },
    });
    if (!country) throw new Error(`Missing country: ${entry.countryCode}`);
    const seriesId = existing
      ? existing.id
      : (
          await tx.series.create({
            data: {
              title: entry.title,
              year: entry.year,
              type: entry.type ?? 'serie',
              countryId: country.id,
              catalogScope: 'WATCHABLE_ONLY',
              imageUrl:
                entry.imageUrl ??
                (platform === 'YouTube'
                  ? `https://i.ytimg.com/vi/${ordered[0].videoId}/hqdefault.jpg`
                  : null),
            },
          })
        ).id;
    result.seriesId = seriesId;
    if (existing) {
      await tx.seriesRevision.create({
        data: {
          seriesId,
          editVersion: existing.editVersion,
          source: batch.id,
          snapshot: JSON.parse(
            JSON.stringify(existing)
          ) as Prisma.InputJsonValue,
        },
      });
      // A stale editor must not overwrite episodes added by this batch.
      await tx.series.update({
        where: { id: seriesId, editVersion: existing.editVersion },
        data: { editVersion: { increment: 1 } },
      });
    }
    const seasonId =
      season?.id ??
      (
        await tx.season.create({
          data: { seriesId, seasonNumber: 1, year: entry.year },
        })
      ).id;
    for (const { ep, number, title } of pending) {
      const row = season?.episodes.find((e) => e.episodeNumber === number);
      const info = channels.get(ep.videoId)!;
      const probe = probes.get(ep.videoId)!;
      const data = {
        title: row?.title ?? title,
        embedUrl: watchBatchVideoUrl(entry, ep.videoId),
        embedPlatform: platform,
        embedVideoId: ep.videoId,
        embedChannelName: info.channelTitle,
        embedChannelUrl: info.channelUrl,
        airDate: row?.airDate ?? new Date(ep.publishedAt),
        durationSeconds: probe.durationSeconds,
        playback: probe.status,
        playbackCheckedAt: new Date(),
        playbackBlockedMarkets: probe.blockedMarkets,
        youtubeViewCount:
          platform === 'YouTube' ? (probe.viewCount ?? null) : null,
        youtubeLikeCount:
          platform === 'YouTube' ? (probe.likeCount ?? null) : null,
      };
      if (row) {
        await tx.episode.update({ where: { id: row.id }, data });
      } else {
        await tx.episode.create({
          data: { seasonId, episodeNumber: number, ...data },
        });
      }
    }
    await tx.season.update({
      where: { id: seasonId },
      data: {
        episodeCount: await tx.episode.count({ where: { seasonId } }),
      },
    });
  }
  return results;
}
