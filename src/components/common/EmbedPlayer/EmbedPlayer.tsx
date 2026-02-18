'use client';

import { getEmbedInfo, type Platform } from '@/lib/embed-helpers';
import { LinkOutlined } from '@ant-design/icons';
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
    return (
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
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
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
