'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Input, Pagination, Segmented, Spin, Tag } from 'antd';
import { BookOutlined, DownloadOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import './MyDiaryWidget.css';

interface DiaryNote {
  key: string;
  kind: 'series' | 'episode';
  body: string;
  createdAt: string;
  updatedAt: string;
  seriesTitle: string;
  episodeLabel: string | null;
  href: string;
}

interface DiaryResponse {
  notes: DiaryNote[];
  total: number;
  page: number;
  pageSize: number;
}

type KindFilter = 'all' | 'series' | 'episode';

/**
 * "Mi Diario BL": las notas privadas del usuario — que hasta ahora solo
 * existian dentro de cada serie y cada capitulo — leidas de corrido como
 * una linea de tiempo, con buscador y export.
 *
 * Es solo lectura a proposito: cada nota se edita donde vive (la ficha de
 * la serie o del episodio), asi no hay dos lugares que escriban lo mismo.
 */
export function MyDiaryWidget() {
  const { t } = useLocale();
  const message = useMessage();
  const { status } = useSession();

  const [notes, setNotes] = useState<DiaryNote[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [kind, setKind] = useState<KindFilter>('all');
  const [searchDraft, setSearchDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (kind !== 'all') params.set('kind', kind);
      if (searchQuery) params.set('q', searchQuery);

      const res = await fetch(`/api/user/notes?${params.toString()}`);
      if (!res.ok) throw new Error(t('profile.diaryLoadError'));
      const data = (await res.json()) as DiaryResponse;
      setNotes(data.notes);
      setTotal(data.total);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : t('profile.diaryLoadError')
      );
    } finally {
      setLoading(false);
    }
  }, [kind, message, page, pageSize, searchQuery, status, t]);

  useEffect(() => {
    void load();
  }, [load]);

  // Export de la pagina visible, mismo patron que el widget de comentarios.
  const onExport = () => {
    if (notes.length === 0) return;
    const payload = notes.map((note) => ({
      series: note.seriesTitle,
      episode: note.episodeLabel,
      body: note.body,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mundobl-diario-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <Widget
      title={t('profileDashboard.widgetMyDiary')}
      icon={<BookOutlined />}
      noPadding
    >
      <div className="mb-my-diary">
        <div className="mb-my-diary__filters">
          <Input.Search
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onSearch={() => {
              setPage(1);
              setSearchQuery(searchDraft.trim());
            }}
            placeholder={t('profile.diarySearchPlaceholder')}
            allowClear
            size="small"
            className="mb-my-diary__search"
          />

          <Segmented
            size="small"
            value={kind}
            onChange={(value) => {
              setPage(1);
              setKind(value as KindFilter);
            }}
            options={[
              { value: 'all', label: t('profile.diaryFilterAll') },
              { value: 'series', label: t('profile.diaryFilterSeries') },
              { value: 'episode', label: t('profile.diaryFilterEpisodes') },
            ]}
          />

          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={onExport}
            disabled={notes.length === 0}
          >
            {t('profile.diaryExport')}
          </Button>
        </div>

        {loading ? (
          <div className="mb-my-diary__loading">
            <Spin size="small" />
          </div>
        ) : notes.length === 0 ? (
          <div className="mb-my-diary__empty">
            <EmptyState
              title={t('profile.diaryEmpty')}
              variant="soft"
              fullHeight={false}
            />
          </div>
        ) : (
          <>
            <ol className="mb-my-diary__list">
              {notes.map((note) => (
                <li key={note.key} className="mb-my-diary__item">
                  <div className="mb-my-diary__head">
                    <time className="mb-my-diary__date">
                      {formatDate(note.updatedAt)}
                    </time>
                    <Link
                      href={note.href}
                      className="mb-my-diary__series"
                      title={note.seriesTitle}
                    >
                      {note.seriesTitle}
                    </Link>
                    {note.episodeLabel && (
                      <Tag color="geekblue">{note.episodeLabel}</Tag>
                    )}
                    {note.updatedAt !== note.createdAt && (
                      <span className="mb-my-diary__edited">
                        {t('profile.diaryEdited')}
                      </span>
                    )}
                  </div>
                  <p className="mb-my-diary__body">{note.body}</p>
                </li>
              ))}
            </ol>

            <div className="mb-my-diary__pagination">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                size="small"
                showSizeChanger
                pageSizeOptions={['10', '25', '50']}
                onChange={(nextPage, nextSize) => {
                  setPage(nextPage);
                  setPageSize(nextSize);
                }}
              />
            </div>
          </>
        )}
      </div>
    </Widget>
  );
}
