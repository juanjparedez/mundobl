'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Table,
  Tag,
  Button,
  Space,
  Select,
  Popconfirm,
  Avatar,
  Card,
  Input,
} from 'antd';
import {
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  BulbOutlined,
  UserOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { AdminNav } from '../AdminNav';
import { PageTitleClient } from '@/components/common/PageTitle/PageTitleClient';
import { formatPublicName } from '@/lib/user-display';
import { useMessage } from '@/hooks/useMessage';
import '../admin.css';

export interface SuggestionItem {
  id: number;
  seriesId: number;
  seriesTitle: string;
  seriesType: string;
  userId?: string | null;
  userName?: string | null;
  userNickname?: string | null;
  userImage?: string | null;
  type: string;
  content: string;
  status: string;
  adminNotes?: string | null;
  createdAt: string;
}

interface SugerenciasClientProps {
  initialSuggestions: SuggestionItem[];
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  DATO_FALTANTE: { label: '📌 Dato faltante', color: 'blue' },
  CORRECCION_REPARTO: { label: '🎭 Reparto', color: 'purple' },
  DIAS_EMISION: { label: '📅 Emisión', color: 'cyan' },
  LINK_OFICIAL: { label: '🔗 Link oficial', color: 'green' },
  OTRO: { label: '💬 Otro', color: 'default' },
};

export function SugerenciasClient({
  initialSuggestions,
}: SugerenciasClientProps) {
  const message = useMessage();
  const [suggestions, setSuggestions] =
    useState<SuggestionItem[]>(initialSuggestions);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleUpdateStatus = async (
    id: number,
    newStatus: 'APPROVED' | 'DISCARDED'
  ) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/suggestions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Error al actualizar estado');

      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
      message.success(
        newStatus === 'APPROVED'
          ? 'Sugerencia marcada como aplicada/aprobada.'
          : 'Sugerencia descartada.'
      );
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : 'Error al actualizar'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/suggestions/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar');

      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      message.success('Sugerencia eliminada');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const filtered = suggestions.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && s.type !== typeFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchSeries = s.seriesTitle.toLowerCase().includes(term);
      const matchContent = s.content.toLowerCase().includes(term);
      const matchUser = (s.userName || '').toLowerCase().includes(term);
      if (!matchSeries && !matchContent && !matchUser) return false;
    }
    return true;
  });

  const columns = [
    {
      title: 'Serie',
      key: 'series',
      render: (_: unknown, record: SuggestionItem) => (
        <div>
          <Link
            href={`/admin/series/${record.seriesId}/editar`}
            style={{ fontWeight: 600 }}
          >
            {record.seriesTitle}
          </Link>
          <div>
            <Link
              href={`/series/${record.seriesId}`}
              target="_blank"
              style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}
            >
              Ver ficha pública ↗
            </Link>
          </div>
        </div>
      ),
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: string) => {
        const config = TYPE_CONFIG[type] || {
          label: type,
          color: 'default',
        };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Sugerencia de la Comunidad',
      dataIndex: 'content',
      key: 'content',
      render: (content: string, record: SuggestionItem) => (
        <div>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
            {content}
          </p>
          <div
            style={{
              marginTop: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '12px',
              color: 'var(--text-tertiary)',
            }}
          >
            <Avatar
              src={record.userImage}
              icon={!record.userImage ? <UserOutlined /> : undefined}
              size={18}
            />
            <span>
              {formatPublicName({
                name: record.userName ?? null,
                nickname: record.userNickname ?? null,
              })}
            </span>
            <span>·</span>
            <span>{new Date(record.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        if (status === 'APPROVED') {
          return <Tag color="success">Aplicada</Tag>;
        }
        if (status === 'DISCARDED') {
          return <Tag color="default">Descartada</Tag>;
        }
        return <Tag color="warning">Pendiente</Tag>;
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 220,
      render: (_: unknown, record: SuggestionItem) => (
        <Space size="small">
          <Link href={`/admin/series/${record.seriesId}/editar`}>
            <Button size="small" icon={<EditOutlined />} title="Editar serie">
              Editar
            </Button>
          </Link>
          {record.status === 'PENDING' && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                loading={updatingId === record.id}
                onClick={() => handleUpdateStatus(record.id, 'APPROVED')}
                title="Marcar como aplicada"
              />
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                loading={updatingId === record.id}
                onClick={() => handleUpdateStatus(record.id, 'DISCARDED')}
                title="Descartar"
              />
            </>
          )}
          <Popconfirm
            title="¿Eliminar esta sugerencia?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
          >
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Eliminar registro"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="admin-page">
        <AdminNav />
        <div className="admin-header">
          <PageTitleClient level={2}>
            💡 Sugerencias y Aportes de la Comunidad
          </PageTitleClient>
        </div>

        <div className="admin-content">
          <Card style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Input
                  placeholder="Buscar por serie o texto..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 240 }}
                  allowClear
                />
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 150 }}
                >
                  <Select.Option value="ALL">Todos los estados</Select.Option>
                  <Select.Option value="PENDING">Pendientes</Select.Option>
                  <Select.Option value="APPROVED">Aplicadas</Select.Option>
                  <Select.Option value="DISCARDED">Descartadas</Select.Option>
                </Select>
                <Select
                  value={typeFilter}
                  onChange={setTypeFilter}
                  style={{ width: 170 }}
                >
                  <Select.Option value="ALL">Todos los tipos</Select.Option>
                  <Select.Option value="DATO_FALTANTE">
                    📌 Dato faltante
                  </Select.Option>
                  <Select.Option value="CORRECCION_REPARTO">
                    🎭 Reparto
                  </Select.Option>
                  <Select.Option value="DIAS_EMISION">
                    📅 Días de emisión
                  </Select.Option>
                  <Select.Option value="LINK_OFICIAL">
                    🔗 Link oficial
                  </Select.Option>
                  <Select.Option value="OTRO">💬 Otro</Select.Option>
                </Select>
              </div>

              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Mostrando {filtered.length} de {suggestions.length} sugerencias
              </div>
            </div>
          </Card>

          <Table
            columns={columns}
            dataSource={filtered}
            rowKey="id"
            pagination={{ pageSize: 15 }}
            locale={{
              emptyText: (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <BulbOutlined
                    style={{
                      fontSize: 32,
                      color: 'var(--text-tertiary)',
                      marginBottom: 8,
                    }}
                  />
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    No hay sugerencias registradas con los filtros
                    seleccionados.
                  </p>
                </div>
              ),
            }}
          />
        </div>
      </div>
    </AppLayout>
  );
}
