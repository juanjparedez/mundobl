'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { getEmbedInfo, type Platform } from '@/lib/embed-helpers';
import {
  useYouTubeWatchTime,
  type YouTubeWatchEvent,
} from '@/hooks/useYouTubeWatchTime';
import { useVimeoWatchTime } from '@/hooks/useVimeoWatchTime';
import { LinkOutlined } from '@ant-design/icons';
import { outboundRel, withOutboundUtm } from '@/lib/outbound-links';
import { recordSeriesActivity } from '@/lib/activity-beacon';
import './EmbedPlayer.css';

interface EmbedPlayerProps {
  platform: string;
  url: string;
  videoId: string | null;
  title: string;
  openLabel: string;
  episodeId?: number;
  seriesId?: number;
  autoplay?: boolean;
  official?: boolean;
  onWatchProgress?: (event: YouTubeWatchEvent) => void;
}

// lib.dom.d.ts todavia no tipa ScreenOrientation.lock (Screen Orientation
// API), aunque esta soportada en Chrome/Android hace años. `unlock` si esta
// tipado.
interface LockableScreenOrientation extends ScreenOrientation {
  lock?: (orientation: string) => Promise<void>;
}

// El iframe entra en fullscreen como cualquier otro elemento del documento
// (aunque el contenido sea cross-origin), asi que "fullscreenchange" en
// `document` se dispara igual. Sin este lock, el navegador in-app quedaba
// forzado a portrait (ver orientation en app/manifest.ts) y el video no
// rotaba con el telefono al pantalla completa.
function useFullscreenLandscapeLock() {
  useEffect(() => {
    const handleFullscreenChange = () => {
      const orientation = screen.orientation as LockableScreenOrientation;
      if (document.fullscreenElement) {
        orientation.lock?.('landscape').catch(() => {
          // No soportado (desktop, iOS Safari) o requiere gesto del user:
          // el video sigue funcionando, solo no forzamos la rotacion.
        });
      } else {
        try {
          orientation.unlock();
        } catch {
          // Idem: no soportado en todos los navegadores.
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
}

export function EmbedPlayer({
  platform,
  url,
  videoId,
  title,
  openLabel,
  episodeId,
  seriesId,
  autoplay = false,
  official = true,
  onWatchProgress,
}: EmbedPlayerProps) {
  useFullscreenLandscapeLock();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => ''
  );
  const isTrackedYouTube = platform === 'YouTube' && !!onWatchProgress;
  const isTrackedVimeo = platform === 'Vimeo' && !!onWatchProgress;
  const embed = getEmbedInfo(platform as Platform, url, videoId, {
    jsApi: isTrackedYouTube || isTrackedVimeo,
    origin: isTrackedYouTube ? origin : undefined,
    autoplay,
  });
  useYouTubeWatchTime(
    iframeRef,
    isTrackedYouTube && !!origin,
    onWatchProgress,
    episodeId
  );
  useVimeoWatchTime(iframeRef, isTrackedVimeo, onWatchProgress, episodeId);

  if (embed.type === 'iframe' && embed.url) {
    const isSpotify = platform === 'Spotify';

    return (
      <div className="embed-player-container">
        <div
          className={`embed-player ${isSpotify ? 'embed-player--spotify' : ''}`}
        >
          <iframe
            key={embed.url}
            ref={iframeRef}
            src={embed.url}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="embed-player__iframe"
            loading="lazy"
          />
        </div>

        {(platform === 'Vimeo' || platform === 'Dailymotion') && (
          <div className="embed-player__vimeo-tip">
            <a
              href={withOutboundUtm(url, official, {
                medium: 'embed_player',
                campaign: 'vimeo_tip',
              })}
              target="_blank"
              rel={outboundRel(official)}
              onClick={() => {
                if (seriesId)
                  recordSeriesActivity(seriesId, 'outbound_click', 'vimeo_tip');
              }}
              className="embed-player__vimeo-btn"
            >
              {openLabel} <LinkOutlined />
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <a
      href={withOutboundUtm(url, official, {
        medium: 'embed_player',
        campaign: 'link_card',
      })}
      target="_blank"
      rel={outboundRel(official)}
      onClick={() => {
        if (seriesId)
          recordSeriesActivity(seriesId, 'outbound_click', 'link_card');
      }}
      className="embed-player__link-card"
    >
      <span className="embed-player__link-card-platform">{platform}</span>
      <span className="embed-player__link-card-title">{title}</span>
      <span className="embed-player__link-card-cta">
        {openLabel} <LinkOutlined />
      </span>
    </a>
  );
}
