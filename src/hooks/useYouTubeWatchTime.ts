'use client';

import { useEffect, useRef, type RefObject } from 'react';
import {
  loadYouTubeIframeApi,
  YOUTUBE_PLAYER_STATE,
  type YouTubePlayer,
} from '@/lib/youtube-iframe-api';

export interface WatchSample {
  position: number;
  sampledAt: number;
  playbackRate: number;
  playing: boolean;
}

export interface WatchAccumulator {
  watchedSeconds: number;
  lastSample: WatchSample | null;
}

export function accumulateWatchTime(
  accumulator: WatchAccumulator,
  sample: WatchSample
): WatchAccumulator {
  const previous = accumulator.lastSample;
  if (!previous || !previous.playing || !sample.playing) {
    return { ...accumulator, lastSample: sample };
  }

  const elapsed = Math.max(0, (sample.sampledAt - previous.sampledAt) / 1000);
  const positionDelta = sample.position - previous.position;
  const maxNaturalAdvance = elapsed * Math.max(previous.playbackRate, 0.25) + 1;
  const watchedDelta =
    positionDelta >= 0 && positionDelta <= maxNaturalAdvance
      ? positionDelta
      : 0;

  return {
    watchedSeconds: accumulator.watchedSeconds + watchedDelta,
    lastSample: sample,
  };
}

export type YouTubeWatchEvent = 'watched' | 'ended';

export function useYouTubeWatchTime(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  enabled: boolean,
  onProgress?: (event: YouTubeWatchEvent) => void
): void {
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!enabled || !iframe || !onProgressRef.current) return;

    let cancelled = false;
    let player: YouTubePlayer | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let accumulator: WatchAccumulator = {
      watchedSeconds: 0,
      lastSample: null,
    };
    let reportedWatched = false;
    let reportedEnded = false;

    const sample = () => {
      if (!player) return;
      const duration = player.getDuration();
      accumulator = accumulateWatchTime(accumulator, {
        position: player.getCurrentTime(),
        sampledAt: Date.now(),
        playbackRate: player.getPlaybackRate(),
        playing: player.getPlayerState() === YOUTUBE_PLAYER_STATE.PLAYING,
      });
      if (
        !reportedWatched &&
        duration > 0 &&
        accumulator.watchedSeconds / duration >= 0.8
      ) {
        reportedWatched = true;
        onProgressRef.current?.('watched');
      }
    };

    void loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled) return;
        player = new YT.Player(iframe, {
          events: {
            onReady: () => {
              intervalId = setInterval(sample, 2000);
            },
            onStateChange: ({ data }) => {
              sample();
              if (data === YOUTUBE_PLAYER_STATE.ENDED && !reportedEnded) {
                reportedEnded = true;
                if (!reportedWatched) {
                  reportedWatched = true;
                  onProgressRef.current?.('watched');
                }
                onProgressRef.current?.('ended');
              }
            },
          },
        });
      })
      .catch(() => {
        // Si la API esta bloqueada, el iframe sigue reproduciendo y queda el
        // marcado manual como fallback.
      });

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      player?.destroy();
    };
  }, [enabled, iframeRef]);
}
