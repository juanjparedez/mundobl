'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Empty, Tag } from 'antd';
import {
  ClockCircleOutlined,
  PlusCircleOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { PageTitle } from '@/components/common/PageTitle/PageTitle';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { useLocale } from '@/lib/providers/LocaleProvider';
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

interface ChangelogEntry {
  version: string;
  items: string[];
}

interface NovedadesClientProps {
  newSeries: NewSerie[];
  newSeasons: NewSeason[];
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
  if (days < 7) return `${days} ${t('common.daysAgo')}`;
  const weeks = Math.floor(days / 7);
  return `${weeks} ${t('common.weeksAgo')}`;
}

export function NovedadesClient({
  newSeries,
  newSeasons,
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
    <div className="novedades-page">
      <PageTitle
        title={t('novedades.title')}
        subtitle={t('novedades.subtitle')}
      />

      {!hasContent ? (
        <Empty description={t('novedades.empty')} />
      ) : (
        <>
          {newSeries.length > 0 && (
            <section className="novedades-section">
              <h2 className="novedades-section__title">
                <PlusCircleOutlined />
                {t('novedades.newSeriesTitle')}
              </h2>
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
            <section className="novedades-section">
              <h2 className="novedades-section__title">
                <PlayCircleOutlined />
                {t('novedades.newSeasonsTitle')}
              </h2>
              <ul className="novedades-list">
                {newSeasons.map((season) => (
                  <li key={season.id} className="novedades-list__item">
                    <Link
                      href={`/series/${season.series.id}`}
                      className="novedades-list__link"
                    >
                      <span className="novedades-list__main">
                        <strong>{season.series.title}</strong>
                        <Tag color="blue">
                          {t('novedades.seasonLabel')} {season.seasonNumber}
                        </Tag>
                      </span>
                      <span className="novedades-list__when">
                        <ClockCircleOutlined />{' '}
                        {relativeTime(season.createdAt, t)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {changelog.length > 0 && (
            <section className="novedades-section">
              <h2 className="novedades-section__title">
                <FileTextOutlined />
                {t('novedades.changelogTitle')}
              </h2>
              <div className="novedades-changelog">
                {changelog.slice(0, 6).map((entry) => (
                  <article
                    key={entry.version}
                    className="novedades-changelog__entry"
                  >
                    <header className="novedades-changelog__version">
                      {entry.version}
                    </header>
                    <ul className="novedades-changelog__items">
                      {entry.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
