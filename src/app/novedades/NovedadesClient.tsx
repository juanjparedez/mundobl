'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Empty } from 'antd';
import {
  ClockCircleOutlined,
  PlusCircleOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { PageTitle } from '@/components/common/PageTitle/PageTitle';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { WatchableCarousel } from '@/components/common/WatchableCarousel/WatchableCarousel';
import type { WatchableCarouselItem } from '@/components/common/WatchableCarousel/WatchableCarousel';
import { MediaCard } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import type { TranslationKey } from '@/i18n/messages';
import { LAST_SEEN_NOVEDADES_KEY } from './storage-keys';
import './novedades.css';

interface NewSerie {
  id: number;
  title: string;
  imageUrl: string | null;
  imagePosition: string;
  year: number | null;
  type: string;
  createdAt: Date | string;
  country: { name: string; code: string | null } | null;
}

interface NewSeason {
  id: number;
  seasonNumber: number;
  createdAt: Date | string;
  series: {
    id: number;
    title: string;
    imageUrl: string | null;
    type: string;
  };
}

interface ChangelogItemEntry {
  body: string;
  category: string | null;
}

interface ChangelogEntry {
  version: string;
  items: ChangelogItemEntry[];
}

interface NovedadesClientProps {
  newSeries: NewSerie[];
  newSeasons: NewSeason[];
  /** Series watchable (con embedUrl) para el carousel "Series completas
   *  para ver" — anuncia la feature en novedades (item 17). */
  watchableSeries?: WatchableCarouselItem[];
}

function relativeTime(
  value: Date | string,
  t: (k: TranslationKey) => string
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const ms = Date.now() - date.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 1) return t('common.today');
  if (days === 1) return t('common.yesterday');
  if (days < 7)
    return interpolateMessage(t('common.daysAgo'), { n: String(days) });
  const weeks = Math.floor(days / 7);
  return interpolateMessage(t('common.weeksAgo'), { n: String(weeks) });
}

export function NovedadesClient({
  newSeries,
  newSeasons,
  watchableSeries = [],
}: NovedadesClientProps) {
  const { t } = useLocale();
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);

  useEffect(() => {
    fetch('/api/changelog')
      .then((res) => res.json())
      .then((data) => setChangelog(data.entries || []))
      .catch(() => {});
  }, []);

  // Marca la página como "vista" para que el badge del sidebar desaparezca.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LAST_SEEN_NOVEDADES_KEY, String(Date.now()));
  }, []);

  const hasContent =
    newSeries.length > 0 || newSeasons.length > 0 || changelog.length > 0;

  return (
    <div className="novedades-page app-page">
      <PageTitle
        title={t('novedades.title')}
        subtitle={t('novedades.subtitle')}
      />

      {/* Carousel de series watchable: anuncia la feature "Ver series
       *  completas" arriba de las novedades para que se vea inmediato
       *  (item 17 fine_tunning_1). Solo renderea si hay items. */}
      {watchableSeries.length > 0 && (
        <WatchableCarousel
          items={watchableSeries}
          title={t('novedades.watchableTitle')}
        />
      )}

      {!hasContent ? (
        <Empty description={t('novedades.empty')} />
      ) : (
        <>
          {newSeries.length > 0 && (
            <section className="app-panel">
              <header className="app-panel__header">
                <h2 className="app-panel__title app-panel__title--upper">
                  <PlusCircleOutlined />
                  {t('novedades.newSeriesTitle')}
                </h2>
              </header>
              <ul className="novedades-grid">
                {newSeries.map((s) => (
                  <li key={s.id} className="novedades-card">
                    <Link
                      href={`/series/${s.id}`}
                      className="novedades-card__link"
                    >
                      <div className="novedades-card__cover">
                        {s.imageUrl ? (
                          <Image
                            src={s.imageUrl}
                            alt=""
                            fill
                            sizes="(max-width: 480px) 50vw, (max-width: 1024px) 33vw, 200px"
                            quality={55}
                            unoptimized={isSupabaseImageUrl(s.imageUrl)}
                            style={{
                              objectFit: 'cover',
                              objectPosition: s.imagePosition || 'center',
                            }}
                          />
                        ) : (
                          <div className="novedades-card__cover-placeholder">
                            <PlayCircleOutlined />
                          </div>
                        )}
                      </div>
                      <div className="novedades-card__body">
                        <span className="novedades-card__title">{s.title}</span>
                        <div className="novedades-card__meta">
                          {s.country && (
                            <span>
                              <CountryFlag code={s.country.code} size="small" />{' '}
                              {s.country.name}
                            </span>
                          )}
                          {s.year && <span>{s.year}</span>}
                        </div>
                        <span className="novedades-card__when">
                          <ClockCircleOutlined /> {relativeTime(s.createdAt, t)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {newSeasons.length > 0 && (
            <section className="app-panel">
              <header className="app-panel__header">
                <h2 className="app-panel__title app-panel__title--upper">
                  <PlayCircleOutlined />
                  {t('novedades.newSeasonsTitle')}
                </h2>
              </header>
              <div className="novedades-seasons-grid">
                {newSeasons.map((season) => (
                  <MediaCard
                    key={season.id}
                    href={`/series/${season.series.id}`}
                    imageUrl={season.series.imageUrl}
                    imageAlt={season.series.title}
                    unoptimizedImage={
                      season.series.imageUrl
                        ? isSupabaseImageUrl(season.series.imageUrl)
                        : false
                    }
                    title={season.series.title}
                    overlayTags={
                      <span className="app-pill app-pill--info">
                        {t('novedades.seasonLabel')} {season.seasonNumber}
                      </span>
                    }
                    subtitle={
                      <span className="novedades-seasons-when">
                        <ClockCircleOutlined />{' '}
                        {relativeTime(season.createdAt, t)}
                      </span>
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {changelog.length > 0 && (
            <section className="app-panel">
              <header className="app-panel__header">
                <h2 className="app-panel__title app-panel__title--upper">
                  <FileTextOutlined />
                  {t('novedades.changelogTitle')}
                </h2>
              </header>
              <div className="novedades-changelog">
                {changelog.slice(0, 6).map((entry) => {
                  // Agrupar items por categoria preservando el orden de
                  // primer aparicion. Items sin categoria van al grupo "_".
                  const grouped = new Map<string, ChangelogItemEntry[]>();
                  for (const item of entry.items) {
                    const cat = item.category ?? '_';
                    if (!grouped.has(cat)) grouped.set(cat, []);
                    grouped.get(cat)!.push(item);
                  }
                  return (
                    <article
                      key={entry.version}
                      className="novedades-changelog__entry"
                    >
                      <header className="novedades-changelog__version">
                        {entry.version}
                      </header>
                      {Array.from(grouped.entries()).map(([cat, items]) => (
                        <div key={cat} className="novedades-changelog__group">
                          {cat !== '_' && (
                            <h4 className="novedades-changelog__category">
                              {cat}
                            </h4>
                          )}
                          <ul className="novedades-changelog__items">
                            {items.map((item, i) => (
                              <li key={i}>
                                <div className="novedades-changelog__body">
                                  <ReactMarkdown
                                    components={{
                                      // Forzar links external safe
                                      a: ({ href, children }) => (
                                        <a
                                          href={href}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          {children}
                                        </a>
                                      ),
                                      // Headers internos del body se
                                      // bajan a h5 para no chocar con la
                                      // jerarquia del entry (h3/h4).
                                      h1: ({ children }) => <h5>{children}</h5>,
                                      h2: ({ children }) => <h5>{children}</h5>,
                                      h3: ({ children }) => <h5>{children}</h5>,
                                    }}
                                  >
                                    {item.body}
                                  </ReactMarkdown>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
