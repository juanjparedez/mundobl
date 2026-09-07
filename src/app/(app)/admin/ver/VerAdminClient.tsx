'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Button, Segmented, Space, Tag, Tooltip } from 'antd';
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { DataTable, type DataTableColumn } from '@/components/design-system';
import type { VerAdminRow } from '@/lib/database';
import './admin-ver.css';

interface VerAdminClientProps {
  rows: VerAdminRow[];
}

/** Etiqueta y color de cada estado de `Episode.playback`. */
const PLAYBACK_META: Record<string, { label: string; color: string }> = {
  OK: { label: 'OK', color: 'green' },
  GEO_BLOCKED: { label: 'Geo', color: 'volcano' },
  AGE_RESTRICTED: { label: 'Edad', color: 'magenta' },
  REMOVED: { label: 'Caído', color: 'red' },
  NOT_EMBEDDABLE: { label: 'Sin embed', color: 'orange' },
  UNKNOWN: { label: 'Sin sondear', color: 'default' },
};

type Filter = 'all' | 'problems' | 'curated' | 'user';

export function VerAdminClient({ rows }: VerAdminClientProps) {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<number | null>(null);

  /** Una serie "con problemas" es la que el usuario no puede mirar entera. */
  const hasProblem = (r: VerAdminRow) =>
    r.playable < r.totalEmbeds ||
    r.geoRestrictedCore ||
    r.visibility !== 'VISIBLE';

  const filtered = useMemo(() => {
    switch (filter) {
      case 'problems':
        return rows.filter(hasProblem);
      case 'curated':
        return rows.filter((r) => r.origin === 'CURATED');
      case 'user':
        return rows.filter((r) => r.origin === 'USER_EMBED');
      default:
        return rows;
    }
  }, [rows, filter]);

  const call = async (
    url: string,
    id: number,
    body?: Record<string, unknown>
  ) => {
    setBusyId(id);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error ?? 'La acción falló.');
        return false;
      }
      message.success(data.message ?? 'Listo.');
      router.refresh();
      return true;
    } catch {
      message.error('Error de red.');
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const removeFromVer = (row: VerAdminRow) => {
    modal.confirm({
      title: `¿Sacar "${row.title}" de /ver?`,
      width: 560,
      content: (
        <div>
          <p>
            Se vacían los {row.totalEmbeds} embed(s) de sus episodios, así deja
            de aparecer en /ver.
          </p>
          <p>
            <strong>No se borra nada más</strong>: la ficha, las temporadas, los
            episodios y el progreso de los usuarios (vistos, notas, comentarios)
            quedan intactos.
          </p>
          {row.origin === 'CURATED' && (
            <p className="admin-ver__note">
              Esta serie es del catálogo curado, así que su ficha sigue viva en
              /catalogo y /series. Es la acción correcta acá: borrar la serie se
              llevaría puesta la reseña.
            </p>
          )}
        </div>
      ),
      okText: 'Sacar de /ver',
      cancelText: 'Cancelar',
      onOk: () => call(`/api/admin/ver/${row.id}/remove`, row.id),
    });
  };

  const toggleVisibility = (row: VerAdminRow) => {
    const next = row.visibility === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE';
    call(`/api/admin/user-series/${row.id}/visibility`, row.id, {
      visibility: next,
    });
  };

  const deleteSeries = (row: VerAdminRow) => {
    modal.confirm({
      title: `¿Borrar "${row.title}" por completo?`,
      okButtonProps: { danger: true },
      content: (
        <p>
          Se borra la serie entera con sus temporadas, episodios y todo lo
          asociado. No se puede deshacer. Si solo querés que no aparezca en
          /ver, usá <strong>Sacar de /ver</strong>.
        </p>
      ),
      okText: 'Borrar todo',
      cancelText: 'Cancelar',
      onOk: async () => {
        setBusyId(row.id);
        try {
          const res = await fetch(`/api/admin/user-series/${row.id}`, {
            method: 'DELETE',
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            message.error(d.error ?? 'No se pudo borrar.');
            return;
          }
          message.success('Serie borrada.');
          router.refresh();
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  const columns: DataTableColumn<VerAdminRow>[] = [
    {
      title: 'Serie',
      dataIndex: 'title',
      key: 'title',
      mobile: 'title',
      render: (_: unknown, row) => (
        <Space direction="vertical" size={0}>
          <Link href={`/ver/${row.id}`} target="_blank">
            {row.title}
          </Link>
          <span className="admin-ver__sub">
            {row.year ?? 's/año'}
            {row.channels[0] ? ` · ${row.channels[0]}` : ''}
          </span>
        </Space>
      ),
    },
    {
      title: 'Origen',
      dataIndex: 'origin',
      key: 'origin',
      width: 130,
      mobile: 'meta',
      render: (o: string, row) => (
        <Space direction="vertical" size={2}>
          <Tag color={o === 'CURATED' ? 'purple' : 'blue'}>
            {o === 'CURATED' ? 'Curada' : 'Aporte'}
          </Tag>
          {row.submittedBy && (
            <span className="admin-ver__sub">{row.submittedBy}</span>
          )}
        </Space>
      ),
    },
    {
      title: 'Reproducible',
      key: 'playable',
      width: 150,
      mobile: 'meta',
      sorter: (a, b) => a.playable / a.totalEmbeds - b.playable / b.totalEmbeds,
      render: (_: unknown, row) => {
        const todo = row.playable === row.totalEmbeds;
        const nada = row.playable === 0;
        return (
          <Tooltip
            title={
              row.lastCheckedAt
                ? `Último sondeo: ${new Date(row.lastCheckedAt).toLocaleString('es-AR')}`
                : 'Nunca sondeada — correr scripts/audit-ver-playability.ts'
            }
          >
            <Tag color={nada ? 'red' : todo ? 'green' : 'orange'}>
              {row.playable} / {row.totalEmbeds}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Estado de los embeds',
      key: 'playback',
      mobile: 'body',
      render: (_: unknown, row) => (
        <Space size={4} wrap>
          {Object.entries(row.playbackCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([status, n]) => (
              <Tag
                key={status}
                color={PLAYBACK_META[status]?.color ?? 'default'}
              >
                {PLAYBACK_META[status]?.label ?? status} {n}
              </Tag>
            ))}
          {row.trailers > 0 && (
            <Tooltip
              title={
                row.trailers === row.totalEmbeds
                  ? 'Todos sus embeds son trailers: la serie ya no aparece en /ver. Conviene sacarla para que deje de figurar acá.'
                  : 'Tiene trailers cargados como capítulos. Ya no se publican en /ver, pero el resto de los episodios sí.'
              }
            >
              <Tag icon={<WarningOutlined />} color="gold">
                {row.trailers === row.totalEmbeds
                  ? 'Solo trailers'
                  : `Trailers ${row.trailers}`}
              </Tag>
            </Tooltip>
          )}
          {row.geoRestrictedCore && (
            <Tag icon={<WarningOutlined />} color="volcano">
              Geo-bloqueada
            </Tag>
          )}
          {row.visibility !== 'VISIBLE' && (
            <Tag color="default">{row.visibility}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 260,
      mobile: 'actions',
      render: (_: unknown, row) => (
        <Space size={4} wrap>
          <Tooltip title="Vacía los embeds y la saca de /ver. Conserva la ficha y el progreso de los usuarios.">
            <Button
              size="small"
              icon={<DisconnectOutlined />}
              loading={busyId === row.id}
              onClick={() => removeFromVer(row)}
            >
              Sacar de /ver
            </Button>
          </Tooltip>
          {/* Ocultar y borrar solo aplican a aportes: los endpoints de
              moderacion rechazan las series CURATED a proposito. */}
          {row.origin === 'USER_EMBED' && (
            <>
              <Tooltip
                title={
                  row.visibility === 'VISIBLE'
                    ? 'Ocultar el aporte'
                    : 'Volver a mostrarlo'
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
                  loading={busyId === row.id}
                  onClick={() => toggleVisibility(row)}
                />
              </Tooltip>
              <Tooltip title="Borrar el aporte por completo">
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={busyId === row.id}
                  onClick={() => deleteSeries(row)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  const conProblemas = rows.filter(hasProblem).length;

  return (
    <div className="admin-ver">
      <h1 className="admin-ver__title">Administrar /ver</h1>
      <p className="admin-ver__intro">
        Todo lo que hoy está publicado en /ver, sin importar si es del catálogo
        curado o un aporte de la comunidad — que es como lo ve el visitante. Los
        estados salen del último sondeo de{' '}
        <code>scripts/audit-ver-playability.ts</code>.
      </p>

      <div className="admin-ver__toolbar">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { label: `Todas (${rows.length})`, value: 'all' },
            { label: `Con problemas (${conProblemas})`, value: 'problems' },
            {
              label: `Curadas (${rows.filter((r) => r.origin === 'CURATED').length})`,
              value: 'curated',
            },
            {
              label: `Aportes (${rows.filter((r) => r.origin === 'USER_EMBED').length})`,
              value: 'user',
            },
          ]}
        />
      </div>

      <DataTable<VerAdminRow>
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        pageSize={25}
        empty="No hay series con embeds."
      />
    </div>
  );
}
