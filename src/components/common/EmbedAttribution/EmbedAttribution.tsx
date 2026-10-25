'use client';

import Link from 'next/link';
import { LinkOutlined, YoutubeOutlined } from '@ant-design/icons';
import './EmbedAttribution.css';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { outboundRel, withOutboundUtm } from '@/lib/outbound-links';
import { recordSeriesActivity } from '@/lib/activity-beacon';

interface EmbedAttributionProps {
  seriesId?: number;
  platform: string | null;
  channelName?: string | null;
  channelUrl?: string | null;
  originalUrl?: string | null;
  channelActionLabel?: string;
  official?: boolean;
}

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  YouTube: <YoutubeOutlined />,
};

/**
 * Atribucion visible al lado/debajo de cada reproductor embebido.
 * Deja claro de donde viene el contenido: plataforma + canal oficial.
 */
export function EmbedAttribution({
  seriesId,
  platform,
  channelName,
  channelUrl,
  originalUrl,
  channelActionLabel,
  official = true,
}: EmbedAttributionProps) {
  const { t } = useLocale();
  if (!platform && !channelName) return null;

  const handleOutboundClick = (key: string) => {
    if (seriesId) recordSeriesActivity(seriesId, 'outbound_click', key);
  };

  return (
    <div className="embed-attribution">
      <span className="embed-attribution__via">
        {t('embedAttribution.via')}
      </span>
      {channelUrl && channelName ? (
        <Link
          href={withOutboundUtm(channelUrl, official, {
            medium: 'embed_player',
            campaign: 'channel_subscribe',
          })}
          target="_blank"
          rel={outboundRel(official)}
          onClick={() => handleOutboundClick('channel')}
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
      {channelActionLabel && channelUrl && channelName && (
        <Link
          href={withOutboundUtm(channelUrl, official, {
            medium: 'embed_player',
            campaign: 'channel_subscribe',
          })}
          target="_blank"
          rel={outboundRel(official)}
          onClick={() => handleOutboundClick('subscribe')}
          className="embed-attribution__subscribe"
        >
          {PLATFORM_ICON[platform ?? ''] ?? <LinkOutlined />}
          {channelActionLabel}
        </Link>
      )}
      {originalUrl && (
        <Link
          href={withOutboundUtm(originalUrl, official, {
            medium: 'embed_player',
            campaign: 'watch_episode',
          })}
          target="_blank"
          rel={outboundRel(official)}
          onClick={() => handleOutboundClick('original')}
          className="embed-attribution__original"
          aria-label={t('embedAttribution.openInOriginalPlatform')}
        >
          <LinkOutlined />
        </Link>
      )}
    </div>
  );
}
