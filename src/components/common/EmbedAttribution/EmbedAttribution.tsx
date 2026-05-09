'use client';

import Link from 'next/link';
import { LinkOutlined, YoutubeOutlined } from '@ant-design/icons';
import './EmbedAttribution.css';

interface EmbedAttributionProps {
  platform: string | null;
  channelName?: string | null;
  channelUrl?: string | null;
  originalUrl?: string | null;
}

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  YouTube: <YoutubeOutlined />,
};

/**
 * Atribucion visible al lado/debajo de cada reproductor embebido.
 * Deja claro de donde viene el contenido: plataforma + canal oficial.
 */
export function EmbedAttribution({
  platform,
  channelName,
  channelUrl,
  originalUrl,
}: EmbedAttributionProps) {
  if (!platform && !channelName) return null;

  return (
    <div className="embed-attribution">
      <span className="embed-attribution__via">Via</span>
      {channelUrl && channelName ? (
        <Link
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="embed-attribution__channel"
        >
          {channelName}
        </Link>
      ) : channelName ? (
        <span className="embed-attribution__channel">{channelName}</span>
      ) : null}
      {platform && (
        <span className="embed-attribution__platform">
          {PLATFORM_ICON[platform] ?? null}
          <span>{platform}</span>
        </span>
      )}
      {originalUrl && (
        <Link
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="embed-attribution__original"
          aria-label="Abrir en la plataforma original"
        >
          <LinkOutlined />
        </Link>
      )}
    </div>
  );
}
