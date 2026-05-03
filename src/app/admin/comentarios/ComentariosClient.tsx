'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  Checkbox,
  Input,
  Popconfirm,
  Segmented,
  Space,
  Table,
  Tag,
} from 'antd';
import {
  DeleteOutlined,
  ExportOutlined,
  FlagOutlined,
  SearchOutlined,
  StopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { AdminNav } from '../AdminNav';
import { useMessage } from '@/hooks/useMessage';
import '../admin.css';
import './comentarios.css';

type TargetFilter = 'all' | 'series' | 'season' | 'episode';

interface CommentReportRow {
  id: number;
  reason: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null } | null;
}

interface CommentRow {
  id: number;
  content: string;
  reportCount: number;
  reportedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  series: { id: number; title: string } | null;
  season: {
    id: number;
    seasonNumber: number;
    series: { id: number; title: string } | null;
  } | null;
  episode: {
    id: number;
    episodeNumber: number;
    title: string | null;
    season: {
      seasonNumber: number;
      series: { id: number; title: string } | null;
    } | null;
  } | null;
  reports: CommentReportRow[];
}

interface CommentsResponse {
  comments: CommentRow[];
  total: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 50;

export function ComentariosClient() {
  const message = useMessage();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<TargetFilter>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [reportedOnly, setReportedOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (target !== 'all') params.set('target', target);
      if (search) params.set('q', search);
      if (reportedOnly) params.set('reported', 'true');

      const response = await fetch(`/api/admin/comments?${params.toString()}`);
      if (!response.ok) throw new Error('Error al cargar comentarios');
      const data: CommentsResponse = await response.json();
      setComments(data.comments);
      setTotal(data.total);
    } catch (error) {
      console.error(error);
      message.error('Error al cargar comentarios');
    } finally {
      setLoading(false);
    }
  }, [page, target, search, reportedOnly, message]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/comments?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      message.success('Comentario eliminado');
      setComments((prev) => prev.filter((c) => c.id !== id));
      setTotal((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error(error);
      message.error('Error al eliminar comentario');
    }
  };

  const handleDismissReports = async (id: number) => {
    try {
      const response = await fetch(
        `/api/admin/comments/${id}/dismiss-reports`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Error al descartar reportes');
      message.success('Reportes descartados');
      if (reportedOnly) {
        setComments((prev) => prev.filter((c) => c.id !== id));
        setTotal((prev) => Math.max(prev - 1, 0));
      } else {
        setComments((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, reportCount: 0, reportedAt: null, reports: [] }
              : c
          )
        );
      }
    } catch (error) {
      console.error(error);
      message.error('Error al descartar reportes');
    }
  };

  const getTargetSeriesId = (record: CommentRow): number | null => {
    if (record.episode) return record.episode.season?.series?.id ?? null;
    if (record.season) return record.season.series?.id ?? null;
    if (record.series) return record.series.id;
    return null;
  };

  const renderTarget = (record: CommentRow) => {
    if (record.episode) {
      const seriesTitle = record.episode.season?.series?.title ?? 'Serie';
      const seasonNum = record.episode.season?.seasonNumber ?? '?';
      const epNum = record.episode.episodeNumber;
      const epTitle = record.episode.title ? ` — ${record.episode.title}` : '';
      return (
        <span className="comentarios-target">
          <span className="comentarios-target__type">Episodio</span>
          {seriesTitle} · T{seasonNum}E{epNum}
          {epTitle}
        </span>
      );
    }
    if (record.season) {
      const seriesTitle = record.season.series?.title ?? 'Serie';
      return (
        <span className="comentarios-target">
          <span className="comentarios-target__type">Temporada</span>
          {seriesTitle} · T{record.season.seasonNumber}
        </span>
      );
    }
    if (record.series) {
      return (
        <span className="comentarios-target">
          <span className="comentarios-target__type">Serie</span>
          {record.series.title}
        </span>
      );
    }
    return <span className="comentarios-target__empty">—</span>;
  };

  const columns: ColumnsType<CommentRow> = [
    {
      title: 'Usuario',
      key: 'user',
      width: 220,
      render: (_, record) =>
        record.user ? (
          <div className="comentarios-user">
            <Avatar
              src={record.user.image}
              icon={!record.user.image ? <UserOutlined /> : undefined}
              size={32}
            />
            <div>
              <div className="comentarios-user__name">
                {record.user.name ?? 'Sin nombre'}
              </div>
              <div className="comentarios-user__email">{record.user.email}</div>
            </div>
          </div>
        ) : (
          <span className="comentarios-target__empty">Usuario eliminado</span>
        ),
    },
    {
      title: 'Comentario',
      key: 'content',
      render: (_, record) => (
        <div className="comentarios-content">
          {record.reportCount > 0 && (
            <Tag
              color="red"
              icon={<FlagOutlined />}
              className="comentarios-report-tag"
            >
              {record.reportCount} reporte{record.reportCount === 1 ? '' : 's'}
            </Tag>
          )}
          {record.content}
        </div>
      ),
    },
    {
      title: 'Sobre',
      key: 'target',
      width: 280,
      render: (_, record) => renderTarget(record),
    },
    {
      title: 'Fecha',
      key: 'createdAt',
      width: 130,
      render: (_, record) =>
        new Date(record.createdAt).toLocaleDateString('es-ES'),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 260,
      render: (_, record) => {
        const seriesId = getTargetSeriesId(record);
        return (
          <Space size="small" wrap>
            {seriesId && (
              <Button
                size="small"
                icon={<ExportOutlined />}
                href={`/catalogo/${seriesId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver
              </Button>
            )}
            {record.reportCount > 0 && (
              <Popconfirm
                title="Descartar reportes?"
                description="Se eliminan los reportes y el contador vuelve a cero"
                onConfirm={() => handleDismissReports(record.id)}
                okText="Descartar"
                cancelText="Cancelar"
              >
                <Button size="small" icon={<StopOutlined />}>
                  Ignorar
                </Button>
              </Popconfirm>
            )}
            <Popconfirm
              title="Eliminar comentario?"
              description="Esta acción no se puede deshacer"
              onConfirm={() => handleDelete(record.id)}
              okText="Eliminar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                Eliminar
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <AppLayout>
      <div className="admin-page-wrapper">
        <AdminNav />
        <div className="comentarios-page">
          <h2 className="comentarios-section-title">Comentarios públicos</h2>

          <div className="comentarios-filters">
            <Segmented<TargetFilter>
              value={target}
              onChange={(value) => {
                setTarget(value);
                setPage(1);
              }}
              options={[
                { label: 'Todos', value: 'all' },
                { label: 'Series', value: 'series' },
                { label: 'Temporadas', value: 'season' },
                { label: 'Episodios', value: 'episode' },
              ]}
            />
            <Input
              placeholder="Buscar contenido..."
              prefix={<SearchOutlined />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onPressEnter={() => {
                setSearch(searchInput.trim());
                setPage(1);
              }}
              allowClear
              onClear={() => {
                setSearchInput('');
                setSearch('');
                setPage(1);
              }}
              className="comentarios-search"
            />
            <Checkbox
              checked={reportedOnly}
              onChange={(e) => {
                setReportedOnly(e.target.checked);
                setPage(1);
              }}
            >
              Solo reportados
            </Checkbox>
          </div>

          <Table
            columns={columns}
            dataSource={comments}
            rowKey="id"
            loading={loading}
            size="small"
            expandable={{
              rowExpandable: (record) => record.reports.length > 0,
              expandedRowRender: (record) => (
                <ul className="comentarios-reports">
                  {record.reports.map((report) => (
                    <li key={report.id} className="comentarios-reports__item">
                      <div className="comentarios-reports__head">
                        <span className="comentarios-reports__user">
                          {report.user?.name ?? 'Usuario eliminado'}
                          {report.user?.email && (
                            <span className="comentarios-reports__email">
                              {' '}
                              · {report.user.email}
                            </span>
                          )}
                        </span>
                        <span className="comentarios-reports__date">
                          {new Date(report.createdAt).toLocaleString('es-ES')}
                        </span>
                      </div>
                      <div className="comentarios-reports__reason">
                        {report.reason ?? (
                          <span className="comentarios-target__empty">
                            Sin razón
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ),
            }}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total,
              showSizeChanger: false,
              onChange: (newPage) => setPage(newPage),
            }}
          />
        </div>
      </div>
    </AppLayout>
  );
}
