'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Empty, Input, Tag } from 'antd';
import { LinkOutlined, RobotOutlined, SearchOutlined } from '@ant-design/icons';
import { PageTitle } from '@/components/common/PageTitle/PageTitle';
import './noticias.css';

interface NewsTag {
  tag: { id: number; name: string };
}

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  originalUrl: string;
  sourceName: string;
  sourceLogo: string | null;
  imageUrl: string | null;
  publishedAt: Date | string | null;
  aiGenerated: boolean;
  tags: NewsTag[];
  relatedSeries: { id: number; title: string } | null;
}

interface NoticiasListClientProps {
  initialNews: NewsItem[];
  initialTotal: number;
}

const PAGE_SIZE = 20;

function formatDate(d: Date | string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function NoticiasListClient({
  initialNews,
  initialTotal,
}: NoticiasListClientProps) {
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(async (nextPage: number, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(PAGE_SIZE),
      });
      if (q) params.set('q', q);
      const res = await fetch(`/api/news?${params.toString()}`);
      if (!res.ok) throw new Error('Error');
      const data = (await res.json()) as {
        news: NewsItem[];
        total: number;
      };
      setNews(data.news);
      setTotal(data.total);
      setPage(nextPage);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => {
    setActiveSearch(searchInput);
    fetchPage(1, searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setActiveSearch('');
    fetchPage(1, '');
  };

  const hasMore = page * PAGE_SIZE < total;

  return (
    <div className="noticias-list">
      <PageTitle
        title="Noticias BL/GL"
        subtitle="Las últimas novedades del mundo Boys Love y Girls Love, curadas para la comunidad."
      />

      <div className="noticias-list__toolbar">
        <Input
          placeholder="Buscar noticias…"
          prefix={<SearchOutlined />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          onClear={handleClearSearch}
          className="noticias-list__search"
        />
        <Button onClick={handleSearch} type="primary">
          Buscar
        </Button>
      </div>

      {activeSearch && (
        <p className="noticias-list__search-label">
          Resultados para <strong>&quot;{activeSearch}&quot;</strong> · {total}{' '}
          {total === 1 ? 'noticia' : 'noticias'}
        </p>
      )}

      {news.length === 0 && !loading ? (
        <Empty description="No hay noticias todavía" />
      ) : (
        <div className="noticias-list__grid">
          {news.map((item) => (
            <article key={item.id} className="noticias-card">
              {item.imageUrl && (
                <div className="noticias-card__img-wrap">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 600px) 100vw, 50vw"
                    className="noticias-card__img"
                    unoptimized
                  />
                </div>
              )}
              <div className="noticias-card__body">
                <div className="noticias-card__meta">
                  {item.sourceLogo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.sourceLogo}
                      alt={item.sourceName}
                      className="noticias-card__source-logo"
                    />
                  )}
                  <span className="noticias-card__source">
                    {item.sourceName}
                  </span>
                  {item.publishedAt && (
                    <span className="noticias-card__date">
                      · {formatDate(item.publishedAt)}
                    </span>
                  )}
                  {item.aiGenerated && (
                    <span className="noticias-card__ai-badge">
                      <RobotOutlined /> IA
                    </span>
                  )}
                </div>

                <h2 className="noticias-card__title">{item.title}</h2>

                <p className="noticias-card__summary">
                  {/* Mostrar preview plano (primeras 200 chars) */}
                  {item.summary.replace(/[*_`[\]#>]/g, '').slice(0, 200)}
                  {item.summary.length > 200 ? '…' : ''}
                </p>

                {item.tags.length > 0 && (
                  <div className="noticias-card__tags">
                    {item.tags.map((t) => (
                      <Tag key={t.tag.id}>{t.tag.name}</Tag>
                    ))}
                  </div>
                )}

                {item.relatedSeries && (
                  <Link
                    href={`/series/${item.relatedSeries.id}`}
                    className="noticias-card__series-link"
                  >
                    → {item.relatedSeries.title}
                  </Link>
                )}

                <a
                  href={item.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="noticias-card__source-link"
                >
                  <LinkOutlined /> Ver fuente original
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="noticias-list__load-more">
          <Button
            loading={loading}
            onClick={() => fetchPage(page + 1, activeSearch)}
          >
            Cargar más
          </Button>
        </div>
      )}
    </div>
  );
}
