'use client';

import { useEffect } from 'react';
import { getEmbedInfo, type Platform } from '@/lib/embed-helpers';
import { LinkOutlined, VideoCameraOutlined } from '@ant-design/icons';
import './EmbedPlayer.css';

interface EmbedPlayerProps {
  platform: string;
  url: string;
  videoId: string | null;
  title: string;
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
}: EmbedPlayerProps) {
  useFullscreenLandscapeLock();
  const embed = getEmbedInfo(platform as Platform, url, videoId);

  if (embed.type === 'iframe' && embed.url) {
    const isSpotify = platform === 'Spotify';
    const isVimeo = platform === 'Vimeo';

    return (
      <div className="embed-player-container">
        <div
          className={`embed-player ${isSpotify ? 'embed-player--spotify' : ''}`}
        >
          <iframe
            src={embed.url}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="embed-player__iframe"
            loading="lazy"
          />
        </div>

        {isVimeo && (
          <div className="embed-player__vimeo-tip">
            <span className="embed-player__vimeo-tip-text">
              <VideoCameraOutlined /> ¿El video tiene bloqueo de privacidad o es
              de <strong>Vimeo On Demand</strong>?
            </span>
            <a
              href={
                url ||
                (videoId ? `https://vimeo.com/${videoId}` : 'https://vimeo.com')
              }
              target="_blank"
              rel="noopener noreferrer"
              className="embed-player__vimeo-btn"
            >
              Abrir en Vimeo Oficial <LinkOutlined />
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="embed-player__link-card"
    >
      <span className="embed-player__link-card-platform">{platform}</span>
      <span className="embed-player__link-card-title">{title}</span>
      <span className="embed-player__link-card-cta">
        Ver en {platform} <LinkOutlined />
      </span>
    </a>
  );
}
