'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  Input,
  Modal,
  Pagination,
  Segmented,
  Space,
  Table,
  Tag,
  Select,
  Tooltip,
  Empty,
  Spin,
  Form,
  Divider,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  BugOutlined,
  BulbOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AdminPageHero } from '@/components/admin/AdminPageHero/AdminPageHero';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { AdminNav } from '../AdminNav';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import '../admin.css';

type Status = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type FeedbackType = 'bug' | 'feature' | 'idea';

interface FeedbackCase {
  id: number;
  title: string;
  description: string | null;
  type: string;
  status: Status;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  assignedTo: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  comments: Array<{
    id: number;
    body: string;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }>;
}

interface FeedbackResponse {
  cases: FeedbackCase[];
  total: number;
  page: number;
  pageSize: number;
}

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
}

const PAGE_SIZE = 50;
const STATUS_OPTIONS = [
  { label: 'Abierto', value: 'OPEN', color: 'blue' },
  { label: 'En progreso', value: 'IN_PROGRESS', color: 'orange' },
  { label: 'Completado', value: 'COMPLETED', color: 'green' },
  { label: 'Rechazado', value: 'REJECTED', color: 'red' },
];

const PRIORITY_OPTIONS = [
  { label: 'Baja', value: 'LOW', color: 'default' },
  { label: 'Media', value: 'MEDIUM', color: 'default' },
  { label: 'Alta', value: 'HIGH', color: 'orange' },
  { label: 'Crítica', value: 'CRITICAL', color: 'red' },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  bug: <BugOutlined />,
  feature: <PlusOutlined />,
  idea: <BulbOutlined />,
};

const TYPE_LABELS: Record<string, string> = {
  bug: 'Bug',
  feature: 'Feature',
  idea: 'Idea',
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-AR');
}

export function FeedbackClient() {
  const message = useMessage();
  const { locale, t } = useLocale();
  const [cases, setCases] = useState<FeedbackCase[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'ALL' | Status>('OPEN');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailCase, setDetailCase] = useState<FeedbackCase | null>(null);
  const [editingCase, setEditingCase] = useState<FeedbackCase | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [form] = Form.useForm();

  // Load cases
  const loadCases = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: PAGE_SIZE.toString(),
        status,
        ...(search && { search }),
      });

      const res = await fetch(`/api/admin/feedback?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Failed to fetch cases');
      const data: FeedbackResponse = await res.json();
      setCases(data.cases);
      setTotal(data.total);
    } catch (error) {
      console.error('Error loading cases:', error);
      message.error('Error al cargar los casos');
    } finally {
      setLoading(false);
    }
  }, [page, status, search, message]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  // Mock admin users (in real app, fetch from /api/users/admins)
  useEffect(() => {
    // Placeholder: you would fetch actual admins from API
    setAdminUsers([
      { id: 'admin1', name: 'Juan José Paredez', email: 'juan@example.com' },
      { id: 'admin2', name: 'Flor', email: 'flor@example.com' },
    ]);
  }, []);

  const handleStatusChange = async (caseId: number, newStatus: Status) => {
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: caseId, status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      message.success('Estado actualizado');
      loadCases();
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Error al actualizar estado');
    }
  };

  const handleAssign = async (caseId: number, assignedToId: string | null) => {
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: caseId, assignedToId }),
      });

      if (!res.ok) throw new Error('Failed to assign');
      message.success('Asignación actualizada');
      loadCases();
      setEditingCase(null);
    } catch (error) {
      console.error('Error assigning:', error);
      message.error('Error al asignar');
    }
  };

  const handlePriorityChange = async (
    caseId: number,
    newPriority: Priority
  ) => {
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: caseId, priority: newPriority }),
      });

      if (!res.ok) throw new Error('Failed to update priority');
      message.success('Prioridad actualizada');
      loadCases();
    } catch (error) {
      console.error('Error updating priority:', error);
      message.error('Error al actualizar prioridad');
    }
  };

  const columns: ColumnsType<FeedbackCase> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      width: 100,
      render: (type: string) => (
        <Space size="small">
          {TYPE_ICONS[type] || <FileTextOutlined />}
          <span>{TYPE_LABELS[type] || type}</span>
        </Space>
      ),
    },
    {
      title: 'Título',
      dataIndex: 'title',
      width: 250,
      render: (text: string, record: FeedbackCase) => (
        <a
          onClick={() => setDetailCase(record)}
          style={{ cursor: 'pointer' }}
          title={text}
        >
          {text.length > 50 ? `${text.slice(0, 50)}...` : text}
        </a>
      ),
    },
    {
      title: 'Reportado por',
      dataIndex: ['user', 'email'],
      width: 150,
      render: (email: string | null, record: FeedbackCase) =>
        record.user ? (
          <Space size="small">
            <Avatar src={record.user.image} size="small" icon={<UserOutlined />} />
            <span>{record.user.name || email}</span>
          </Space>
        ) : (
          <span style={{ color: '#999' }}>Anónimo</span>
        ),
    },
    {
      title: 'Asignado a',
      dataIndex: ['assignedTo', 'name'],
      width: 150,
      render: (name: string | null, record: FeedbackCase) => (
        <Select
          placeholder="Asignar a..."
          value={record.assignedTo?.id || undefined}
          onChange={(value) => handleAssign(record.id, value || null)}
          style={{ width: '100%' }}
          options={[
            { label: 'Sin asignar', value: null },
            ...adminUsers.map((u) => ({
              label: u.name || u.email,
              value: u.id,
            })),
          ]}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      width: 120,
      render: (status: Status, record: FeedbackCase) => {
        const option = STATUS_OPTIONS.find((o) => o.value === status);
        return (
          <Select
            value={status}
            onChange={(value) => handleStatusChange(record.id, value)}
            style={{ width: '100%' }}
            options={STATUS_OPTIONS}
            onClick={(e) => e.stopPropagation()}
          />
        );
      },
    },
    {
      title: 'Prioridad',
      dataIndex: 'priority',
      width: 120,
      render: (priority: Priority, record: FeedbackCase) => {
        const option = PRIORITY_OPTIONS.find((o) => o.value === priority);
        return (
          <Select
            value={priority}
            onChange={(value) => handlePriorityChange(record.id, value)}
            style={{ width: '100%' }}
            options={PRIORITY_OPTIONS}
            onClick={(e) => e.stopPropagation()}
          />
        );
      },
    },
    {
      title: 'Fecha',
      dataIndex: 'createdAt',
      width: 100,
      render: (date: string) => formatDate(date),
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

  return (
    <AppLayout>
      <div className="admin__container">
        <AdminPageHero title="Casos de Feedback" />

        <div className="admin__content">
        <div style={{ marginBottom: '1.5rem' }}>
          <Input
            placeholder="Buscar por título o descripción..."
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => setPage(1)}
            style={{ marginBottom: '1rem' }}
          />
        </div>
          <div className="admin__controls" style={{ marginBottom: '1.5rem' }}>
            <Segmented<'ALL' | Status>
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              options={[
                { label: 'Todos', value: 'ALL' as const },
                { label: 'Abiertos', value: 'OPEN' as const },
                { label: 'En progreso', value: 'IN_PROGRESS' as const },
                { label: 'Completados', value: 'COMPLETED' as const },
                { label: 'Rechazados', value: 'REJECTED' as const },
              ]}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spin />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={cases}
              rowKey="id"
              pagination={{
                current: page,
                pageSize: PAGE_SIZE,
                total,
                onChange: setPage,
              }}
              size="small"
              scroll={{ x: 1200 }}
            />
          )}
        </div>

        <AdminNav />
      </div>

      {/* Detail Modal */}
      <Modal
        open={detailCase !== null}
        title={`Caso #${detailCase?.id}`}
        onCancel={() => setDetailCase(null)}
        width={700}
        footer={null}
      >
        {detailCase && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3>{detailCase.title}</h3>
              <Space size="middle">
                <Tag color={STATUS_OPTIONS.find((o) => o.value === detailCase.status)?.color}>
                  {
                    STATUS_OPTIONS.find((o) => o.value === detailCase.status)
                      ?.label
                  }
                </Tag>
                <Tag
                  color={
                    PRIORITY_OPTIONS.find((o) => o.value === detailCase.priority)
                      ?.color
                  }
                >
                  {
                    PRIORITY_OPTIONS.find((o) => o.value === detailCase.priority)
                      ?.label
                  }
                </Tag>
              </Space>
            </div>

            <Divider style={{ margin: '0.5rem 0' }} />

            {detailCase.description && (
              <div>
                <h4>Descripción</h4>
                <p>{detailCase.description}</p>
              </div>
            )}

            <div style={{ fontSize: '0.9rem', color: '#999' }}>
              <p>
                <strong>Tipo:</strong> {TYPE_LABELS[detailCase.type]}
              </p>
              <p>
                <strong>Reportado por:</strong>{' '}
                {detailCase.user
                  ? `${detailCase.user.name || detailCase.user.email}`
                  : 'Anónimo'}
              </p>
              <p>
                <strong>Fecha:</strong> {formatDate(detailCase.createdAt)}
              </p>
              <p>
                <strong>Asignado a:</strong>{' '}
                {detailCase.assignedTo
                  ? `${detailCase.assignedTo.name || detailCase.assignedTo.email}`
                  : 'Sin asignar'}
              </p>
            </div>

            {detailCase.comments.length > 0 && (
              <div>
                <h4>Comentarios ({detailCase.comments.length})</h4>
                <div
                  style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid #e8e8e8',
                    borderRadius: '4px',
                    padding: '0.5rem',
                  }}
                >
                  {detailCase.comments.map((comment) => (
                    <div
                      key={comment.id}
                      style={{
                        padding: '0.5rem',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', color: '#999' }}>
                        {comment.user.name || comment.user.email}
                        {' - '}
                        {formatDate(comment.createdAt)}
                      </div>
                      <p style={{ margin: '0.25rem 0 0 0' }}>{comment.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
