'use client';

import { useEffect, useState } from 'react';
import { Empty, Spin, Table, Tag, Space, Button } from 'antd';
import { BugOutlined, PlusOutlined, BulbOutlined } from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import type { ColumnsType } from 'antd/es/table';

interface FeedbackCase {
  id: number;
  title: string;
  type: string;
  status: string;
  priority: string;
  createdAt: string;
  assignedTo: {
    name: string | null;
    email: string | null;
  } | null;
  comments: Array<{
    id: number;
    body: string;
    createdAt: string;
  }>;
}

interface CasesResponse {
  cases: FeedbackCase[];
  total: number;
  page: number;
  pageSize: number;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'blue',
  IN_PROGRESS: 'orange',
  COMPLETED: 'green',
  REJECTED: 'red',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'default',
  MEDIUM: 'default',
  HIGH: 'orange',
  CRITICAL: 'red',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  bug: <BugOutlined />,
  feature: <PlusOutlined />,
  idea: <BulbOutlined />,
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-AR');
}

export function MyCasesSection() {
  const message = useMessage();
  const [cases, setCases] = useState<FeedbackCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: '10',
        });

        const res = await fetch(`/api/feedback/my-cases?${params}`);
        if (!res.ok) throw new Error('Failed to fetch cases');

        const data: CasesResponse = await res.json();
        setCases(data.cases);
        setTotal(data.total);
      } catch (error) {
        console.error('Error loading cases:', error);
        message.error('Error al cargar tus casos');
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, [page, message]);

  const columns: ColumnsType<FeedbackCase> = [
    {
      title: 'Tipo',
      dataIndex: 'type',
      width: 80,
      render: (type: string) => (
        <Space size="small">
          {TYPE_ICONS[type] || <BugOutlined />}
          <span>{type === 'bug' ? 'Bug' : type === 'feature' ? 'Feature' : 'Idea'}</span>
        </Space>
      ),
    },
    {
      title: 'Caso',
      dataIndex: 'title',
      render: (text: string) => (
        <span title={text}>{text.length > 40 ? `${text.slice(0, 40)}...` : text}</span>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {status === 'OPEN'
            ? 'Abierto'
            : status === 'IN_PROGRESS'
              ? 'En progreso'
              : status === 'COMPLETED'
                ? 'Completado'
                : 'Rechazado'}
        </Tag>
      ),
    },
    {
      title: 'Prioridad',
      dataIndex: 'priority',
      width: 80,
      render: (priority: string) => (
        <Tag color={PRIORITY_COLORS[priority]}>
          {priority === 'LOW'
            ? 'Baja'
            : priority === 'MEDIUM'
              ? 'Media'
              : priority === 'HIGH'
                ? 'Alta'
                : 'Crítica'}
        </Tag>
      ),
    },
    {
      title: 'Comentarios',
      dataIndex: ['comments', 'length'],
      width: 80,
      render: (count: number) => <span>{count}</span>,
    },
    {
      title: 'Fecha',
      dataIndex: 'createdAt',
      width: 100,
      render: (date: string) => formatDate(date),
    },
  ];

  if (loading && cases.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Spin />
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <Empty
        description="Sin casos reportados"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        style={{ padding: '2rem' }}
      />
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={cases}
      rowKey="id"
      size="small"
      pagination={{
        current: page,
        pageSize: 10,
        total,
        onChange: setPage,
      }}
      scroll={{ x: 800 }}
    />
  );
}
