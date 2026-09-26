'use client';

import Link from 'next/link';
import { ReadOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './SeriesNews.css';

export interface SeriesNewsItem {
  id: number;
  title: string;
  sourceName: string;
  publishedAt: string | null;
}

/** Las ultimas noticias publicadas de la serie, en su ficha. */
export function SeriesNews({ items }: { items: SeriesNewsItem[] }) {
  const { t, locale } = useLocale();
  if (items.length === 0) return null;

  // En UTC: el servidor y el navegador tienen que escribir la misma fecha.
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });

  return (
    <section className="series-news" aria-label={t('seriesInfo.newsTitle')}>
      <h3 className="series-news__title">
        <ReadOutlined aria-hidden /> {t('seriesInfo.newsTitle')}
      </h3>
      <ul className="series-news__list">
        {items.map((item) => (
          <li key={item.id} className="series-news__item">
            <Link href={`/noticias/${item.id}`} className="series-news__link">
              {item.title}
            </Link>
            <span className="series-news__meta">
              {item.sourceName}
              {item.publishedAt && ` · ${formatDate(item.publishedAt)}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
