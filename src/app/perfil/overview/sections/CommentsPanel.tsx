'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CommentOutlined, SearchOutlined } from '@ant-design/icons';
import { Input, Select } from 'antd';
import './CommentsPanel.css';

interface ApiComment {
  id: number;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  series?: { id: number; title: string } | null;
  season?: {
    id: number;
    seasonNumber: number;
    series?: { id: number; title: string } | null;
  } | null;
  episode?: {
    id: number;
    episodeNumber: number;
    season?: {
      seasonNumber: number;
      series?: { id: number; title: string } | null;
    } | null;
  } | null;
}

type FilterValue = 'all' | 'public' | 'private';

function getSeriesTitle(c: ApiComment): string {
  return (
    c.series?.title ??
    c.season?.series?.title ??
    c.episode?.season?.series?.title ??
    '—'
  );
}

/** "Mis comentarios" del style-guide: search + filter + lista compacta.
 *  Reusa el endpoint /api/user/comments. Sin data sintetizada. */
export function OverviewCommentsPanel() {
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/user/comments?pageSize=10')
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: {
            comments: ApiComment[];
            total: number;
          } | null
        ) => {
          if (cancelled || !data) return;
          setComments(data.comments ?? []);
          setTotal(data.total ?? 0);
        }
      )
      .catch(() => {
        /* silent */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = comments.filter((c) => {
    if (filter === 'public' && c.isPrivate) return false;
    if (filter === 'private' && !c.isPrivate) return false;
    if (search && !c.content.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <section className="overview-comments">
      <header className="overview-comments__head">
        <h3 className="overview-comments__title">
          <CommentOutlined /> Mis comentarios
        </h3>
        <Link href="/perfil/clasico" className="overview-comments__see-all">
          Ver todos
        </Link>
      </header>

      <div className="overview-comments__filters">
        <Input
          size="small"
          prefix={<SearchOutlined />}
          placeholder="Buscar en comentarios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          size="small"
          value={filter}
          onChange={(v) => setFilter(v as FilterValue)}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'public', label: 'Públicos' },
            { value: 'private', label: 'Privados' },
          ]}
          className="overview-comments__filter-select"
        />
      </div>

      {loading ? (
        <div className="overview-comments__loading">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="overview-comments__empty">
          {comments.length === 0
            ? 'Aún no comentaste en ninguna serie.'
            : 'No hay comentarios que coincidan con el filtro.'}
        </div>
      ) : (
        <ul className="overview-comments__list">
          {filtered.slice(0, 5).map((c) => (
            <li key={c.id} className="overview-comments__item">
              <div className="overview-comments__row">
                <span className="overview-comments__series">
                  {getSeriesTitle(c)}
                </span>
                <span className="overview-comments__date">
                  {formatRelative(c.createdAt)}
                </span>
              </div>
              <p className="overview-comments__text">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      {total > 5 && (
        <Link href="/perfil/clasico" className="overview-comments__more">
          Ver todos los comentarios ({total})
        </Link>
      )}
    </section>
  );
}

function formatRelative(iso: string): string {
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const diffH = Math.floor(diffMs / 3_600_000);
    if (diffH < 1) return 'Hace minutos';
    if (diffH < 24) return `Hace ${diffH} ${diffH === 1 ? 'hora' : 'horas'}`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `Hace ${diffD} ${diffD === 1 ? 'día' : 'días'}`;
    const diffW = Math.floor(diffD / 7);
    return `Hace ${diffW} ${diffW === 1 ? 'semana' : 'semanas'}`;
  } catch {
    return '';
  }
}
