'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar } from 'antd';
import {
  MessageOutlined,
  PictureOutlined,
  CompassOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PanelCard, Chip } from '@/components/design-system';
import { isDirectServedImageUrl } from '@/lib/image-helpers';
import type { CommunityAuthor, CommunitySeries } from '@/types/community';
import './CommunityCard.css';

export function CommunityCard({
  href,
  title,
  excerpt,
  series,
  author,
  date,
  badge,
  meta,
  readLabel,
  anonymous,
  locale,
}: {
  href: string;
  title: string;
  excerpt: string | null;
  series: CommunitySeries | null;
  author: CommunityAuthor | null;
  date: string | null;
  badge: string;
  meta?: string;
  readLabel: string;
  anonymous: string;
  locale: string;
}) {
  return (
    <PanelCard className="community-card" padding="none">
      <div className="community-card__layout">
        <Link
          href={href}
          className="community-card__poster"
          tabIndex={-1}
          aria-hidden="true"
        >
          {series?.imageUrl ? (
            <Image
              src={series.imageUrl}
              alt=""
              fill
              sizes="96px"
              unoptimized={isDirectServedImageUrl(series.imageUrl)}
            />
          ) : series ? (
            <PictureOutlined />
          ) : (
            <CompassOutlined />
          )}
        </Link>
        <div className="community-card__content">
          <Chip>{badge}</Chip>
          {series && <p className="community-card__series">{series.title}</p>}
          <h3>
            <Link href={href}>{title}</Link>
          </h3>
          {excerpt && <p className="community-card__excerpt">{excerpt}</p>}
          <div className="community-card__byline">
            <Avatar size={24} src={author?.image} icon={<UserOutlined />} />
            {author?.profileId ? (
              <Link href={`/comunidad/perfiles/${author.profileId}`}>
                {author.name}
              </Link>
            ) : (
              <span>{author?.name ?? anonymous}</span>
            )}
            {date && (
              <time dateTime={date}>
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: 'medium',
                  timeZone: 'UTC',
                }).format(new Date(date))}
              </time>
            )}
          </div>
          <div className="community-card__footer">
            <Link href={href}>{readLabel}</Link>
            {meta && (
              <span>
                <MessageOutlined /> {meta}
              </span>
            )}
          </div>
        </div>
      </div>
    </PanelCard>
  );
}
