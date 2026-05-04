'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  Modal,
  Popconfirm,
  Segmented,
  Space,
  Table,
  Tag,
} from 'antd';
import {
  DeleteOutlined,
  ExportOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  StarFilled,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AdminPageHero } from '@/components/admin/AdminPageHero/AdminPageHero';
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar/AdminTableToolbar';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { AdminNav } from '../AdminNav';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { LOCALE_LABELS } from '@/i18n/config';
import '../admin.css';

type StatusFilter = 'all' | 'PUBLISHED' | 'DRAFT' | 'HIDDEN';
type Status = 'PUBLISHED' | 'DRAFT' | 'HIDDEN';
type Verdict = 'RECOMMENDED' | 'MIXED' | 'SKIP';

interface ReviewRow {
  id: number;
  title: string;
  body: string;
  verdict: Verdict | null;
  language: string;
  status: Status;
  hasSpoilers: boolean;
  isFeatured: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  series: { id: number; title: string } | null;
}

interface ReviewsResponse {
  reviews: ReviewRow[];
  total: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 50;

export function ResenasClient() {
  const message = useMessage();
  const { locale, t } = useLocale();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState<ReviewRow | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (status !== 'all') params.set('status', status);
      if (search) params.set('q', search);

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      if (!res.ok) throw new Error('Error');
      const data: ReviewsResponse = await res.json();
      setReviews(data.reviews);
      setTotal(data.total);
    } catch (error) {
      console.error(error);
      message.error(t('adminReviews.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, status, search, message, t]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleStatusChange = async (id: number, newStatus: Status) => {
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Error');
      message.success(t('adminReviews.statusUpdated'));
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (error) {
      console.error(error);
      message.error(t('adminReviews.statusError'));
    }
  };

  const handleToggleFeatured = async (id: number, isFeatured: boolean) => {
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured }),
      });
      if (!res.ok) throw new Error('Error');
      message.success(
        isFeatured
          ? t('adminReviews.featuredOn')
          : t('adminReviews.featuredOff')
      );
      // Refrescar lista entera porque destacar puede des-destacar otra reseña.
      await fetchReviews();
    } catch (error) {
      console.error(error);
      message.error(t('adminReviews.featuredError'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error');
      message.success(t('adminReviews.deleteSuccess'));
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setTotal((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error(error);
      message.error(t('adminReviews.deleteError'));
    }
  };

  const renderStatus = (s: Status) => {
    const map: Record<Status, { color: string; key: string }> = {
      PUBLISHED: { color: 'green', key: 'adminReviews.statusPublished' },
      DRAFT: { color: 'default', key: 'adminReviews.statusDraft' },
      HIDDEN: { color: 'warning', key: 'adminReviews.statusHidden' },
    };
    const { color, key } = map[s];
    return <Tag color={color}>{t(key as Parameters<typeof t>[0])}</Tag>;
  };

  const columns: ColumnsType<ReviewRow> = [
    {
      title: t('adminReviews.columnUser'),
      key: 'user',
      width: 200,
      render: (_, record) =>
        record.user ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Avatar
              src={record.user.image}
              icon={!record.user.image ? <UserOutlined /> : undefined}
              size={28}
            />
            <div>
              <div>{record.user.name ?? t('adminReviews.unnamedUser')}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {record.user.email}
              </div>
            </div>
          </div>
        ) : (
          <span>{t('adminReviews.deletedUser')}</span>
        ),
    },
    {
      title: t('adminReviews.columnTitle'),
      key: 'title',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {record.body.slice(0, 100)}
            {record.body.length > 100 ? '…' : ''}
          </div>
        </div>
      ),
    },
    {
      title: t('adminReviews.columnSeries'),
      key: 'series',
      width: 200,
      render: (_, record) => record.series?.title ?? '—',
    },
    {
      title: t('adminReviews.columnLanguage'),
      key: 'language',
      width: 120,
      render: (_, record) => (
        <Tag>{LOCALE_LABELS[record.language as never] ?? record.language}</Tag>
      ),
    },
    {
      title: t('adminReviews.columnStatus'),
      key: 'status',
      width: 150,
      render: (_, record) => (
        <>
          {record.isFeatured && (
            <Tag color="gold" icon={<StarFilled />}>
              {t('adminReviews.featuredTag')}
            </Tag>
          )}
          {renderStatus(record.status)}
          {record.hasSpoilers && (
            <Tag color="volcano">{t('adminReviews.spoilerTag')}</Tag>
          )}
        </>
      ),
    },
    {
      title: t('adminReviews.columnDate'),
      key: 'updatedAt',
      width: 120,
      render: (_, record) =>
        new Date(record.updatedAt).toLocaleDateString(locale),
    },
    {
      title: t('adminReviews.columnActions'),
      key: 'actions',
      width: 320,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button size="small" onClick={() => setPreviewing(record)}>
            {t('adminReviews.actionPreview')}
          </Button>
          {record.series && (
            <Button
              size="small"
              icon={<ExportOutlined />}
              href={`/series/${record.series.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('adminReviews.actionView')}
            </Button>
          )}
          {record.status !== 'PUBLISHED' && (
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleStatusChange(record.id, 'PUBLISHED')}
            >
              {t('adminReviews.actionPublish')}
            </Button>
          )}
          {record.status === 'PUBLISHED' && (
            <Button
              size="small"
              icon={record.isFeatured ? <StarFilled /> : <StarOutlined />}
              onClick={() =>
                handleToggleFeatured(record.id, !record.isFeatured)
              }
            >
              {record.isFeatured
                ? t('adminReviews.actionUnfeature')
                : t('adminReviews.actionFeature')}
            </Button>
          )}
          {record.status !== 'HIDDEN' && (
            <Button
              size="small"
              icon={<EyeInvisibleOutlined />}
              onClick={() => handleStatusChange(record.id, 'HIDDEN')}
            >
              {t('adminReviews.actionHide')}
            </Button>
          )}
          <Popconfirm
            title={t('adminReviews.deleteTitle')}
            description={t('adminReviews.deleteDescription')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('adminReviews.deleteConfirm')}
            cancelText={t('adminReviews.cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              {t('adminReviews.actionDelete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="admin-page-wrapper">
        <AdminNav />
        <div className="comentarios-page">
          <AdminPageHero
            title={t('adminReviews.title')}
            subtitle={t('adminReviews.subtitle')}
            stats={[
              { label: t('adminReviews.statsTotal'), value: total },
              { label: t('adminReviews.statsPage'), value: reviews.length },
            ]}
          />

          <AdminTableToolbar
            filters={
              <Segmented<StatusFilter>
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                options={[
                  { label: t('adminReviews.filterAll'), value: 'all' },
                  {
                    label: t('adminReviews.statusPublished'),
                    value: 'PUBLISHED',
                  },
                  { label: t('adminReviews.statusDraft'), value: 'DRAFT' },
                  { label: t('adminReviews.statusHidden'), value: 'HIDDEN' },
                ]}
              />
            }
            searchPlaceholder={t('adminReviews.searchPlaceholder')}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearchSubmit={() => {
              setSearch(searchInput.trim());
              setPage(1);
            }}
            onSearchClear={() => {
              setSearchInput('');
              setSearch('');
              setPage(1);
            }}
          />

          <Table
            columns={columns}
            dataSource={reviews}
            rowKey="id"
            loading={loading}
            size="small"
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total,
              showSizeChanger: false,
              onChange: (newPage) => setPage(newPage),
            }}
          />

          <Modal
            title={previewing?.title}
            open={Boolean(previewing)}
            onCancel={() => setPreviewing(null)}
            footer={null}
            width={720}
          >
            {previewing && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  {renderStatus(previewing.status)}
                  <Tag>
                    {LOCALE_LABELS[previewing.language as never] ??
                      previewing.language}
                  </Tag>
                  {previewing.hasSpoilers && (
                    <Tag color="volcano">{t('adminReviews.spoilerTag')}</Tag>
                  )}
                </div>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    margin: 0,
                  }}
                >
                  {previewing.body}
                </pre>
              </div>
            )}
          </Modal>
        </div>
      </div>
    </AppLayout>
  );
}
