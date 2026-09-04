'use client';

import { useMemo, useState } from 'react';
import { Table, Tag, Button, Popconfirm, Avatar } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CloudUploadOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminPageHero } from '@/components/admin/AdminPageHero/AdminPageHero';
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar/AdminTableToolbar';
import { EmptyState } from '@/components/design-system';
import { useMessage } from '@/hooks/useMessage';
import { ColaboradorNav } from './ColaboradorNav';
import './colaborador.css';

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

const VISIBILITY_LABELS: Record<string, string> = {
  VISIBLE: 'Publicada en /ver',
  HIDDEN: 'Oculta por un admin',
  PENDING_REVIEW: 'En revision',
  REJECTED: 'Rechazada',
};

interface Props {
  items: ColaboradorRow[];
}

export function ColaboradorClient({ items: initial }: Props) {
  const router = useRouter();
  const message = useMessage();
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.title.toLowerCase().includes(q));
  }, [items, search]);

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
          {VISIBILITY_LABELS[v] ?? v}
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
        subtitle="Tu propio contenido en /ver — nunca se mezcla con el catalogo curado de MundoBL."
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
          <AdminTableToolbar
            filters={<></>}
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
