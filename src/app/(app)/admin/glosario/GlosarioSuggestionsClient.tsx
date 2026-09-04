'use client';

import { useState } from 'react';
import { Button, Card, Select, Space, Table, Tag, Typography, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { AdminNav } from '../AdminNav';
import { PageTitleClient } from '@/components/common/PageTitle/PageTitleClient';
import '../admin.css';

export interface GlossarySuggestionItem {
  id: number;
  term: string;
  transliteration: string | null;
  country: string;
  category: string;
  meaning: string;
  context: string;
  sourceName: string | null;
  sourceUrl: string | null;
  notes: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null; nickname: string | null; image: string | null } | null;
}

interface Props {
  initialSuggestions: GlossarySuggestionItem[];
}

export function GlosarioSuggestionsClient({ initialSuggestions }: Props) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const updateStatus = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/admin/glossary-suggestions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('No se pudo actualizar la sugerencia.');
      setSuggestions((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
      message.success(status === 'APPROVED' ? 'Término aprobado y publicado.' : 'Sugerencia rechazada.');
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : 'Error al actualizar.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = statusFilter === 'ALL'
    ? suggestions
    : suggestions.filter((suggestion) => suggestion.status === statusFilter);

  return (
    <>
      <AdminNav />
      <main className="admin-content">
        <PageTitleClient level={1}>Sugerencias del glosario</PageTitleClient>
        <Card>
          <Space style={{ marginBottom: 16 }}>
            <Typography.Text strong>Estado</Typography.Text>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: 'Todas' },
                { value: 'PENDING', label: 'Pendientes' },
                { value: 'APPROVED', label: 'Aprobadas' },
                { value: 'REJECTED', label: 'Rechazadas' },
              ]}
            />
          </Space>
          <Table
            rowKey="id"
            dataSource={filtered}
            scroll={{ x: 900 }}
            columns={[
              {
                title: 'Término',
                key: 'term',
                render: (_: unknown, item: GlossarySuggestionItem) => (
                  <div>
                    <strong>{item.term}</strong>
                    {item.transliteration && <div>{item.transliteration}</div>}
                    <Tag>{item.country}</Tag> <Tag>{item.category}</Tag>
                  </div>
                ),
              },
              { title: 'Significado', dataIndex: 'meaning', key: 'meaning' },
              { title: 'Contexto', dataIndex: 'context', key: 'context' },
              {
                title: 'Estado',
                dataIndex: 'status',
                key: 'status',
                render: (status: string) => <Tag color={status === 'APPROVED' ? 'green' : status === 'REJECTED' ? 'red' : 'gold'}>{status}</Tag>,
              },
              {
                title: 'Acciones',
                key: 'actions',
                render: (_: unknown, item: GlossarySuggestionItem) => item.status === 'PENDING' && (
                  <Space>
                    <Button loading={updatingId === item.id} icon={<CheckOutlined />} onClick={() => updateStatus(item.id, 'APPROVED')}>Aprobar</Button>
                    <Button danger loading={updatingId === item.id} icon={<CloseOutlined />} onClick={() => updateStatus(item.id, 'REJECTED')}>Rechazar</Button>
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      </main>
    </>
  );
}
