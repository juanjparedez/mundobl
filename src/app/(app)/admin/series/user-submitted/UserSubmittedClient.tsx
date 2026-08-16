'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Empty,
  Modal,
  Select,
  Table,
  Tag,
  Tooltip,
  Segmented,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';

interface UserSubmittedRow {
  id: number;
  title: string;
  originalTitle: string | null;
  year: number | null;
  type: string;
  imageUrl: string | null;
  visibility: string;
  catalogScope: string;
  createdAt: string;
  countryName: string | null;
  countryCode: string | null;
  submittedBy: { id: string; displayName: string } | null;
  embedCount: number;
  platforms: string[];
}

interface Props {
  items: UserSubmittedRow[];
}

interface CuratedOption {
  value: number;
  label: string;
}

export function UserSubmittedClient({ items: initial }: Props) {
  const router = useRouter();
  const message = useMessage();
  const [items, setItems] = useState(initial);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [linkTarget, setLinkTarget] = useState<UserSubmittedRow | null>(null);
  const [linkOptions, setLinkOptions] = useState<CuratedOption[]>([]);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkSelectedId, setLinkSelectedId] = useState<number | null>(null);
  const [linkSearch, setLinkSearch] = useState('');

  async function refresh() {
    router.refresh();
  }

  async function setVisibilityStatus(row: UserSubmittedRow, next: string) {
    try {
      const res = await fetch(`/api/admin/user-series/${row.id}/visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        message.error(data.error || 'No se pudo cambiar la visibilidad.');
        return;
      }
      setItems((prev) =>
        prev.map((i) => (i.id === row.id ? { ...i, visibility: next } : i))
      );
      if (next === 'VISIBLE') {
        message.success('Aporte aprobado y publicado en /ver.');
      } else if (next === 'REJECTED') {
        message.success('Aporte marcado como rechazado.');
      } else if (next === 'HIDDEN') {
        message.success('Aporte ocultado de /ver.');
      } else {
        message.success('Visibilidad actualizada.');
      }
    } catch (err) {
      console.error(err);
      message.error('Error al cambiar la visibilidad.');
    }
  }

  function confirmDelete(row: UserSubmittedRow) {
    Modal.confirm({
      title: `¿Borrar el aporte "${row.title}"?`,
      content:
        'Esta accion borra la serie USER_EMBED completa (episodios, tags, generos asociados). Es irreversible.',
      okText: 'Borrar',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const res = await fetch(`/api/admin/user-series/${row.id}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (!res.ok) {
            message.error(data.error || 'No se pudo borrar.');
            return;
          }
          setItems((prev) => prev.filter((i) => i.id !== row.id));
          message.success('Aporte borrado.');
        } catch (err) {
          console.error(err);
          message.error('Error al borrar.');
        }
      },
    });
  }

  function cleanSearchQuery(input: string): string {
    return input
      .replace(/\[.*?\]/g, ' ')
      .replace(/\(.*?\)/g, ' ')
      .replace(
        /\b(?:the series|series|thai bl|bl series|full episodes|episodes|sub|eng|spanish)\b/gi,
        ' '
      )
      .replace(/[^a-zA-Z0-9\u0E00-\u0E7F\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async function openLinkModal(row: UserSubmittedRow) {
    setLinkTarget(row);
    setLinkSelectedId(null);
    setLinkOptions([]);
    const cleaned = cleanSearchQuery(row.title) || row.title;
    setLinkSearch(cleaned);
    await loadCuratedOptions(cleaned);
  }

  async function loadCuratedOptions(query: string) {
    const cleaned = cleanSearchQuery(query) || query.trim();
    if (!cleaned) {
      setLinkOptions([]);
      return;
    }
    setLinkLoading(true);
    try {
      const params = new URLSearchParams({ q: cleaned });
      const res = await fetch(`/api/series/search?${params.toString()}`);
      if (!res.ok) {
        setLinkOptions([]);
        return;
      }
      const data = (await res.json()) as Array<{
        id: number;
        title: string;
        year: number | null;
      }>;
      setLinkOptions(
        data.map((s) => ({
          value: s.id,
          label: s.year ? `${s.title} (${s.year})` : s.title,
        }))
      );
    } catch (err) {
      console.error(err);
      setLinkOptions([]);
    } finally {
      setLinkLoading(false);
    }
  }

  async function confirmLink() {
    if (!linkTarget || !linkSelectedId) return;
    try {
      const res = await fetch(`/api/admin/user-series/${linkTarget.id}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCuratedSeriesId: linkSelectedId }),
      });
      const data = await res.json();
      if (!res.ok) {
        message.error(data.error || 'No se pudo linkear.');
        return;
      }
      message.success(
        `Linkeado: ${data.movedEpisodeCount} episodios movidos${data.skippedEpisodeCount ? `, ${data.skippedEpisodeCount} omitidos.` : '.'}`
      );
      setItems((prev) => prev.filter((i) => i.id !== linkTarget.id));
      setLinkTarget(null);
      await refresh();
    } catch (err) {
      console.error(err);
      message.error('Error al linkear.');
    }
  }

  const columns: ColumnsType<UserSubmittedRow> = [
    {
      title: 'Serie',
      key: 'series',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {row.imageUrl && (
            <img
              src={row.imageUrl}
              alt=""
              width={48}
              height={67}
              style={{
                objectFit: 'cover',
                borderRadius: 4,
                background: 'var(--bg-elevated)',
              }}
              loading="lazy"
            />
          )}
          <div>
            <div style={{ fontWeight: 600 }}>
              <Link href={`/ver/${row.id}`} prefetch={false}>
                {row.title}
              </Link>
            </div>
            {row.originalTitle && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {row.originalTitle}
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {row.year ?? '—'} · {row.type}
              {row.countryName && row.countryCode && (
                <>
                  {' · '}
                  <CountryFlag code={row.countryCode} /> {row.countryName}
                </>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Aportado por',
      key: 'submittedBy',
      render: (_, row) =>
        row.submittedBy ? (
          <span>@{row.submittedBy.displayName}</span>
        ) : (
          <em>(usuario eliminado)</em>
        ),
    },
    {
      title: 'Plataforma',
      key: 'platforms',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {row.platforms.map((p) => (
            <Tag key={p}>{p}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Embeds',
      dataIndex: 'embedCount',
      key: 'embedCount',
      width: 90,
    },
    {
      title: 'Visibilidad',
      key: 'visibility',
      render: (_, row) => {
        if (row.visibility === 'PENDING_REVIEW') {
          return <Tag color="orange">⏳ Pendiente</Tag>;
        }
        if (row.visibility === 'VISIBLE') {
          return <Tag color="green">✓ Visible</Tag>;
        }
        if (row.visibility === 'REJECTED') {
          return <Tag color="red">✗ Rechazada</Tag>;
        }
        return <Tag color="default">Oculta</Tag>;
      },
    },
    {
      title: 'Fecha',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 220,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {row.visibility === 'PENDING_REVIEW' && (
            <>
              <Tooltip title="Aprobar y publicar en /ver">
                <Button
                  size="small"
                  type="primary"
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  onClick={() => setVisibilityStatus(row, 'VISIBLE')}
                >
                  Aprobar
                </Button>
              </Tooltip>
              <Tooltip title="Rechazar aporte">
                <Button
                  size="small"
                  danger
                  onClick={() => setVisibilityStatus(row, 'REJECTED')}
                >
                  Rechazar
                </Button>
              </Tooltip>
            </>
          )}
          {row.visibility !== 'PENDING_REVIEW' && (
            <Tooltip
              title={
                row.visibility === 'VISIBLE'
                  ? 'Ocultar de /ver'
                  : 'Hacer visible en /ver'
              }
            >
              <Button
                size="small"
                icon={
                  row.visibility === 'VISIBLE' ? (
                    <EyeInvisibleOutlined />
                  ) : (
                    <EyeOutlined />
                  )
                }
                onClick={() =>
                  setVisibilityStatus(
                    row,
                    row.visibility === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE'
                  )
                }
              />
            </Tooltip>
          )}
          <Tooltip title="Linkear con una serie del catalogo">
            <Button
              size="small"
              icon={<LinkOutlined />}
              onClick={() => openLinkModal(row)}
            />
          </Tooltip>
          <Tooltip title="Borrar aporte">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => confirmDelete(row)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const pendingCount = items.filter(
    (i) => i.visibility === 'PENDING_REVIEW'
  ).length;
  const visibleCount = items.filter((i) => i.visibility === 'VISIBLE').length;
  const hiddenCount = items.filter(
    (i) => i.visibility === 'HIDDEN' || i.visibility === 'REJECTED'
  ).length;

  const filteredItems = items.filter((i) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return i.visibility === 'PENDING_REVIEW';
    if (statusFilter === 'visible') return i.visibility === 'VISIBLE';
    if (statusFilter === 'hidden')
      return i.visibility === 'HIDDEN' || i.visibility === 'REJECTED';
    return true;
  });

  return (
    <div
      style={{ padding: 'var(--spacing-md)', maxWidth: 1400, margin: '0 auto' }}
    >
      <h1>Aportes de usuarios</h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Series embebidas agregadas por usuarios registrados desde /ver/agregar.
        Podés aprobar aportes pendientes, ocultarlas, borrarlas o linkearlas con
        una serie del catálogo curado (los episodios se fusionan al destino).
      </p>

      <div style={{ marginBottom: 16 }}>
        <Segmented
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as string)}
          options={[
            { label: `Todos (${items.length})`, value: 'all' },
            {
              label: `Pendientes (${pendingCount})`,
              value: 'pending',
              disabled: false,
            },
            { label: `Visibles (${visibleCount})`, value: 'visible' },
            { label: `Ocultas / Rechazadas (${hiddenCount})`, value: 'hidden' },
          ]}
        />
      </div>

      {filteredItems.length === 0 ? (
        <Empty description="No hay aportes con este filtro" />
      ) : (
        <Table
          rowKey="id"
          dataSource={filteredItems}
          columns={columns}
          pagination={{ pageSize: 20, showSizeChanger: true }}
        />
      )}

      <Modal
        title={`Linkear "${linkTarget?.title}" con catalogo`}
        open={linkTarget != null}
        onCancel={() => setLinkTarget(null)}
        onOk={confirmLink}
        okText="Linkear"
        okButtonProps={{ disabled: !linkSelectedId }}
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Busca y selecciona la serie del catálogo curado. Al confirmar, los
          episodios embebidos del aporte se mueven al destino y el aporte se
          borra.
        </p>
        <Select
          showSearch
          style={{ width: '100%' }}
          placeholder="Buscar serie en el catalogo..."
          filterOption={false}
          loading={linkLoading}
          searchValue={linkSearch}
          onSearch={(v) => {
            setLinkSearch(v);
            loadCuratedOptions(v);
          }}
          onChange={(v) => setLinkSelectedId(v ?? null)}
          options={linkOptions}
          value={linkSelectedId}
        />
      </Modal>
    </div>
  );
}
