'use client';

import { useEffect, useRef, type RefObject } from 'react';
import {
  accumulateWatchTime,
  type WatchAccumulator,
  type YouTubeWatchEvent,
} from '@/hooks/useYouTubeWatchTime';
import {
  clearEpisodePlaybackPosition,
  getEpisodePlaybackPosition,
  setEpisodePlaybackPosition,
} from '@/lib/local-progress';

const VIMEO_ORIGIN = 'https://player.vimeo.com';
const WATCHED_FRACTION = 0.8;

interface VimeoMessage {
  event?: string;
  data?: { seconds?: number; duration?: number };
}

function parseMessage(data: unknown): VimeoMessage | null {
  try {
    const value = typeof data === 'string' ? JSON.parse(data) : data;
    return value && typeof value === 'object' ? (value as VimeoMessage) : null;
  } catch {
    return null;
  }
}

/**
 * El equivalente de useYouTubeWatchTime para Vimeo, por el protocolo
 * postMessage del reproductor (el mismo que usa player.js, sin cargar el
 * script). Cuenta tiempo reproducido real: saltar al final no marca nada.
 * Avisa 'watched' al 80 % y 'ended' al terminar. Si el reproductor no
 * responde, no pasa nada: queda el marcado manual.
 */
export function useVimeoWatchTime(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  enabled: boolean,
  onProgress?: (event: YouTubeWatchEvent) => void,
  episodeId?: number
): void {
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!enabled || !iframe || !onProgressRef.current) return;

    let accumulator: WatchAccumulator = { watchedSeconds: 0, lastSample: null };
    let reportedWatched = false;
    let reportedEnded = false;
    let restored = false;

    const post = (method: string, value?: unknown) => {
      iframe.contentWindow?.postMessage(
        JSON.stringify(value === undefined ? { method } : { method, value }),
        VIMEO_ORIGIN
      );
    };
    const subscribe = () => {
      for (const name of ['timeupdate', 'play', 'pause', 'ended']) {
        post('addEventListener', name);
      }
    };

    const reportWatched = () => {
      if (reportedWatched) return;
      reportedWatched = true;
      if (episodeId !== undefined) clearEpisodePlaybackPosition(episodeId);
      onProgressRef.current?.('watched');
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== VIMEO_ORIGIN) return;
      if (event.source !== iframe.contentWindow) return;
      const message = parseMessage(event.data);
      if (!message?.event) return;

      if (message.event === 'ready') {
        subscribe();
        return;
      }
      // Una pausa (o volver a darle play) corta la cuenta: el tiempo parado
      // entre dos muestras no es tiempo visto.
      if (message.event === 'play' || message.event === 'pause') {
        accumulator = { ...accumulator, lastSample: null };
        return;
      }
      if (message.event === 'ended') {
        if (reportedEnded) return;
        reportedEnded = true;
        if (episodeId !== undefined) clearEpisodePlaybackPosition(episodeId);
        reportWatched();
        onProgressRef.current?.('ended');
        return;
      }
      if (message.event !== 'timeupdate') return;

      const position = Number(message.data?.seconds ?? 0);
      const duration = Number(message.data?.duration ?? 0);
      // Retomar donde quedo, como en YouTube, la primera vez que hay duracion.
      if (!restored && episodeId !== undefined && duration > 0) {
        restored = true;
        const saved = getEpisodePlaybackPosition(episodeId);
        if (saved > 10 && saved < duration - 15 && position < saved) {
          post('setCurrentTime', saved);
        }
      }
      accumulator = accumulateWatchTime(accumulator, {
        position,
        sampledAt: Date.now(),
        playbackRate: 1,
        playing: true,
      });
      if (
        episodeId !== undefined &&
        !reportedWatched &&
        duration > 0 &&
        position > 10 &&
        position < duration - 15
      ) {
        setEpisodePlaybackPosition(episodeId, position);
      }
      if (
        duration > 0 &&
        accumulator.watchedSeconds / duration >= WATCHED_FRACTION
      ) {
        reportWatched();
      }
    };

    window.addEventListener('message', onMessage);
    // El reproductor puede haber mandado 'ready' antes de que escuchemos:
    // suscribirse tambien al cargar es inofensivo (se ignora si se repite).
    iframe.addEventListener('load', subscribe);
    subscribe();
    return () => {
      window.removeEventListener('message', onMessage);
      iframe.removeEventListener('load', subscribe);
    };
  }, [enabled, iframeRef, episodeId]);
}
