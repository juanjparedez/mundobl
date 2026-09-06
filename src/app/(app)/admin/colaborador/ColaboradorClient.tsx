'use client';

import { useMemo, useState } from 'react';
import {
  Table,
  Tag,
  Button,
  Popconfirm,
  Avatar,
  Select,
  DatePicker,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CloudUploadOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  StarOutlined,
  CommentOutlined,
  ReadOutlined,
  BellOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminPageHero } from '@/components/admin/AdminPageHero/AdminPageHero';
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar/AdminTableToolbar';
import {
  EmptyState,
  PanelCard,
  SectionHeader,
  StatCard,
} from '@/components/design-system';
import { NotificationsWidget } from '@/app/(app)/perfil/NotificationsWidget/NotificationsWidget';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { CollaboratorStats } from '@/lib/database';
import { ColaboradorNav } from './ColaboradorNav';
import './colaborador.css';

const { RangePicker } = DatePicker;

interface ColaboradorRow {
  id: number;
  title: string;
  year: number | null;
  type: string;
  imageUrl: string | null;
  visibility: string;
  createdAt: string;
  countryName: string | null;
  episodeCount: number;
}

const VISIBILITY_COLORS: Record<string, string> = {
  VISIBLE: 'green',
  HIDDEN: 'default',
  PENDING_REVIEW: 'gold',
  REJECTED: 'red',
};

// Las 4 claves de VISIBILITY_LABELS estaban hardcodeadas en español —
// las paso por t() porque ahora tambien alimentan las opciones del
// filtro nuevo (no tiene sentido traducir el filtro y dejar la columna
// "Estado" de la tabla en español). El resto del panel de colaborador
// sigue sin i18n (deuda preexistente, fuera del alcance de este cambio).
type VisibilityFilter =
  | 'all'
  | 'VISIBLE'
  | 'HIDDEN'
  | 'PENDING_REVIEW'
  | 'REJECTED';

interface Props {
  items: ColaboradorRow[];
  stats: CollaboratorStats;
}

export function ColaboradorClient({ items: initial, stats }: Props) {
  const router = useRouter();
  const message = useMessage();
  const { t } = useLocale();
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    null,
    null,
  ]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const visibilityLabels: Record<string, string> = {
    VISIBLE: t('adminColaborador.statusVisible'),
    HIDDEN: t('adminColaborador.statusHidden'),
    PENDING_REVIEW: t('adminColaborador.statusPending'),
    REJECTED: t('adminColaborador.statusRejected'),
  };

  const countries = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.countryName && set.add(i.countryName));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const [from, to] = dateRange;
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(`${to}T23:59:59.999`) : null;
    return items.filter((i) => {
      if (q && !i.title.toLowerCase().includes(q)) return false;
      if (visibilityFilter !== 'all' && i.visibility !== visibilityFilter)
        return false;
      if (countryFilter !== 'all' && i.countryName !== countryFilter)
        return false;
      const createdAt = new Date(i.createdAt);
      if (fromDate && createdAt < fromDate) return false;
      if (toDate && createdAt > toDate) return false;
      return true;
    });
  }, [items, search, visibilityFilter, countryFilter, dateRange]);

  const totalEpisodes = useMemo(
    () => items.reduce((acc, i) => acc + i.episodeCount, 0),
    [items]
  );

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/user-series/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      message.success('Serie borrada');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Error al borrar');
    } finally {
      setDeletingId(null);
    }
  }

  const columns: ColumnsType<ColaboradorRow> = [
    {
      title: '',
      dataIndex: 'imageUrl',
      width: 56,
      render: (url: string | null, row) => (
        <Avatar shape="square" size={40} src={url || undefined}>
          {!url && row.title.charAt(0)}
        </Avatar>
      ),
    },
    {
      title: 'Titulo',
      dataIndex: 'title',
      render: (title: string, row) => (
        <Link href={`/admin/colaborador/${row.id}`}>{title}</Link>
      ),
    },
    {
      title: 'Pais',
      dataIndex: 'countryName',
      width: 140,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Año',
      dataIndex: 'year',
      width: 90,
      render: (v: number | null) => v ?? '—',
    },
    {
      title: 'Episodios',
      dataIndex: 'episodeCount',
      width: 110,
    },
    {
      title: 'Estado',
      dataIndex: 'visibility',
      width: 170,
      render: (v: string) => (
        <Tag color={VISIBILITY_COLORS[v] ?? 'default'}>
          {visibilityLabels[v] ?? v}
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      width: 160,
      render: (_, row) => (
        <div className="colaborador-row-actions">
          <Link href={`/ver/${row.id}`} target="_blank">
            <Button size="small" icon={<PlayCircleOutlined />} />
          </Link>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/colaborador/${row.id}`)}
          />
          <Popconfirm
            title={`¿Borrar "${row.title}"?`}
            description="Se borran tambien sus temporadas y episodios. No se puede deshacer."
            onConfirm={() => handleDelete(row.id)}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deletingId === row.id}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="colaborador-page">
      <ColaboradorNav />
      <AdminPageHero
        title="Mi panel de colaborador"
        subtitle="Tu propio contenido, disponible en /ver."
        stats={[
          { label: 'Series', value: items.length },
          { label: 'Episodios', value: totalEpisodes },
        ]}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<CloudUploadOutlined />}
          title="Todavia no cargaste ninguna serie"
          description='Usá "Importar desde YouTube" para traer una playlist completa con todos sus episodios.'
          action={
            <Link href="/admin/colaborador/importar">
              <Button type="primary" icon={<CloudUploadOutlined />}>
                Importar desde YouTube
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <PanelCard
            header={
              <SectionHeader
                title={t('adminColaborador.statsSectionTitle')}
                icon={<BarChartOutlined />}
                size="sm"
              />
            }
          >
            <div className="colaborador-stats-grid">
              <StatCard
                label={t('adminColaborador.statsWatching')}
                value={stats.totalWatching}
                icon={<EyeOutlined />}
              />
              <StatCard
                label={t('adminColaborador.statsWatched')}
                value={stats.totalWatched}
                icon={<CheckCircleOutlined />}
              />
              <StatCard
                label={t('adminColaborador.statsFavorites')}
                value={stats.totalFavorites}
                icon={<StarOutlined />}
              />
              <StatCard
                label={t('adminColaborador.statsComments')}
                value={stats.totalComments}
                icon={<CommentOutlined />}
              />
              <StatCard
                label={t('adminColaborador.statsReviews')}
                value={stats.totalReviews}
                icon={<ReadOutlined />}
              />
              <StatCard
                label={t('adminColaborador.statsSubscriptions')}
                value={stats.totalSubscriptions}
                icon={<BellOutlined />}
              />
            </div>
          </PanelCard>

          <PanelCard
            header={
              <SectionHeader
                title={t('adminColaborador.notificationsSectionTitle')}
                icon={<BellOutlined />}
                size="sm"
              />
            }
          >
            <NotificationsWidget />
          </PanelCard>

          <AdminTableToolbar
            filters={
              <>
                <Select<VisibilityFilter>
                  value={visibilityFilter}
                  onChange={setVisibilityFilter}
                  style={{ minWidth: 200 }}
                  options={[
                    {
                      value: 'all',
                      label: t('adminColaborador.filterAllStatuses'),
                    },
                    { value: 'VISIBLE', label: visibilityLabels.VISIBLE },
                    { value: 'HIDDEN', label: visibilityLabels.HIDDEN },
                    {
                      value: 'PENDING_REVIEW',
                      label: visibilityLabels.PENDING_REVIEW,
                    },
                    { value: 'REJECTED', label: visibilityLabels.REJECTED },
                  ]}
                />
                {countries.length > 0 && (
                  <Select
                    value={countryFilter}
                    onChange={setCountryFilter}
                    style={{ minWidth: 180 }}
                    options={[
                      {
                        value: 'all',
                        label: t('adminColaborador.filterAllCountries'),
                      },
                      ...countries.map((c) => ({ value: c, label: c })),
                    ]}
                  />
                )}
                <RangePicker
                  onChange={(_, dateStrings) =>
                    setDateRange([
                      dateStrings[0] || null,
                      dateStrings[1] || null,
                    ])
                  }
                  allowClear
                />
              </>
            }
            searchPlaceholder="Buscar por titulo..."
            searchValue={search}
            onSearchChange={setSearch}
            onSearchSubmit={() => {}}
            onSearchClear={() => setSearch('')}
            rightActions={
              <Link href="/admin/colaborador/importar">
                <Button type="primary" icon={<CloudUploadOutlined />}>
                  Importar desde YouTube
                </Button>
              </Link>
            }
          />
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 20 }}
            scroll={{ x: 'max-content' }}
          />
        </>
      )}
    </div>
  );
}
