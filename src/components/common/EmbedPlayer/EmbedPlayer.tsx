'use client';

import { getEmbedInfo, type Platform } from '@/lib/embed-helpers';
import { LinkOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import './EmbedPlayer.css';

interface EmbedPlayerProps {
  platform: string;
  url: string;
  videoId: string | null;
  title: string;
}

export function EmbedPlayer({
  platform,
  url,
  videoId,
  title,
}: EmbedPlayerProps) {
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
              <VideoCameraOutlined /> ¿El video tiene bloqueo de privacidad o es de <strong>Vimeo On Demand</strong>?
            </span>
            <a
              href={url || (videoId ? `https://vimeo.com/${videoId}` : 'https://vimeo.com')}
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
