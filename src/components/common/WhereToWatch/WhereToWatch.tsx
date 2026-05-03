'use client';

import { Tag, Tooltip } from 'antd';
import { PlayCircleOutlined, LinkOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './WhereToWatch.css';

export interface WatchLinkItem {
  id: number;
  platform: string;
  url: string;
  official: boolean;
}

interface WhereToWatchProps {
  links: WatchLinkItem[];
  variant?: 'hero' | 'inline';
}

const PLATFORM_COLORS: Record<string, string> = {
  YouTube: '#ff0033',
  Netflix: '#e50914',
  Viki: '#1abc9c',
  iQIYI: '#00be06',
  WeTV: '#ff7a00',
  Disney: '#1f3a93',
  'Disney+': '#1f3a93',
  HBO: '#741fff',
  'HBO Max': '#741fff',
  Prime: '#00a8e1',
  'Prime Video': '#00a8e1',
  AppleTV: '#000000',
  'Apple TV+': '#000000',
  Crunchyroll: '#f47521',
  Bilibili: '#00a1d6',
  GagaOOLala: '#e91e63',
  Vimeo: '#1ab7ea',
};

function getPlatformColor(platform: string): string {
  return PLATFORM_COLORS[platform] ?? 'var(--primary-color)';
}

export function WhereToWatch({ links, variant = 'hero' }: WhereToWatchProps) {
  const { t } = useLocale();
  if (!links || links.length === 0) return null;

  const sorted = [...links].sort((a, b) => {
    if (a.official !== b.official) return a.official ? -1 : 1;
    return a.platform.localeCompare(b.platform);
  });

  return (
    <section className={`where-to-watch where-to-watch--${variant}`}>
      <h3 className="where-to-watch__title">
        <PlayCircleOutlined className="where-to-watch__title-icon" />
        {t('seriesInfo.whereToWatch')}
      </h3>
      <ul className="where-to-watch__list">
        {sorted.map((link) => (
          <li key={link.id} className="where-to-watch__item">
            <Tooltip
              title={link.official ? '' : t('seriesInfo.unofficial')}
              placement="top"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className={`where-to-watch__link${link.official ? '' : ' where-to-watch__link--unofficial'}`}
                style={{
                  ['--platform-color' as string]: getPlatformColor(
                    link.platform
                  ),
                }}
              >
                <span className="where-to-watch__platform">
                  {link.platform}
                </span>
                {!link.official && (
                  <Tag color="default" className="where-to-watch__tag">
                    {t('seriesInfo.unofficial')}
                  </Tag>
                )}
                <LinkOutlined className="where-to-watch__chevron" aria-hidden />
              </a>
            </Tooltip>
          </li>
        ))}
      </ul>
    </section>
  );
}
