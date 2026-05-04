'use client';

import { useEffect, useState } from 'react';
import {
  Empty,
  Spin,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Divider,
  Tooltip,
} from 'antd';
import {
  BugOutlined,
  PlusOutlined,
  BulbOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMessage } from '@/hooks/useMessage';

interface FeedbackCase {
  id: number;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: {
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
  const messageApi = useMessage();
  const [cases, setCases] = useState<FeedbackCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [detailCase, setDetailCase] = useState<FeedbackCase | null>(null);
  const [editingCase, setEditingCase] = useState<FeedbackCase | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();

  const loadCases = async (currentPage: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '10',
      });

      const res = await fetch(`/api/feedback/my-cases?${params}`);
      if (!res.ok) throw new Error('Failed to fetch cases');

      const data: CasesResponse = await res.json();
      setCases(data.cases);
      setTotal(data.total);
    } catch (error) {
      console.error('Error loading cases:', error);
      messageApi.error('Error al cargar tus casos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases(page);
  }, [page, messageApi]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !detailCase) return;

    try {
      setSubmitLoading(true);
      const res = await fetch(`/api/feedback/${detailCase.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentText }),
      });

      if (!res.ok) throw new Error('Failed to add comment');
      messageApi.success('Comentario agregado');
      setCommentText('');
      await loadCases(page);
      if (detailCase) {
        const updated = cases.find((c) => c.id === detailCase.id);
        if (updated) setDetailCase(updated);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      messageApi.error('Error al agregar comentario');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDuplicate = async (caseId: number) => {
    try {
      const caseData = cases.find((c) => c.id === caseId);
      if (!caseData) return;

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${caseData.title} (copia)`,
          description: caseData.description,
          type: caseData.type,
          priority: caseData.priority,
        }),
      });

      if (!res.ok) throw new Error('Failed to duplicate');
      messageApi.success('Caso duplicado');
      loadCases(page);
    } catch (error) {
      console.error('Error duplicating:', error);
      messageApi.error('Error al duplicar');
    }
  };

  const handleChangeStatus = async (caseId: number, newStatus: string) => {
    try {
      const res = await fetch('/api/feedback/update-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: caseId, status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      messageApi.success('Estado actualizado');
      loadCases(page);
      if (detailCase && detailCase.id === caseId) {
        setDetailCase({ ...detailCase, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      messageApi.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (caseId: number) => {
    Modal.confirm({
      title: 'Eliminar caso',
      content: '¿Estás seguro de que quieres eliminar este caso?',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const res = await fetch(`/api/feedback/${caseId}`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error('Failed to delete');
          messageApi.success('Caso eliminado');
          loadCases(page);
          setDetailCase(null);
        } catch (error) {
          console.error('Error deleting:', error);
          messageApi.error('Error al eliminar');
        }
      },
    });
  };

  const handleEdit = async (values: {
    title: string;
    description: string;
    priority: string;
  }) => {
    if (!editingCase) return;

    try {
      const res = await fetch(`/api/feedback/${editingCase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error('Failed to update');
      messageApi.success('Caso actualizado');
      setEditingCase(null);
      loadCases(page);
    } catch (error) {
      console.error('Error updating:', error);
      messageApi.error('Error al actualizar');
    }
  };

  const columns: ColumnsType<FeedbackCase> = [
    {
      title: 'Tipo',
      dataIndex: 'type',
      width: 80,
      render: (type: string) => (
        <Space size="small">
          {TYPE_ICONS[type] || <BugOutlined />}
          <span>
            {type === 'bug' ? 'Bug' : type === 'feature' ? 'Feature' : 'Idea'}
          </span>
        </Space>
      ),
    },
    {
      title: 'Caso',
      dataIndex: 'title',
      render: (text: string, record: FeedbackCase) => (
        <a
          onClick={() => setDetailCase(record)}
          style={{ cursor: 'pointer' }}
          title={text}
        >
          {text.length > 40 ? `${text.slice(0, 40)}...` : text}
        </a>
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
      title: 'Acciones',
      width: 200,
      render: (_, record: FeedbackCase) => (
        <Space size="small">
          <Tooltip title="Editar">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingCase(record);
                form.setFieldsValue({
                  title: record.title,
                  description: record.description,
                  priority: record.priority,
                });
              }}
            />
          </Tooltip>
          <Tooltip title="Duplicar">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleDuplicate(record.id)}
            />
          </Tooltip>
          <Tooltip title="Comentarios">
            <Button
              type="text"
              size="small"
              icon={<MessageOutlined />}
              onClick={() => setDetailCase(record)}
            />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
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
    <>
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
        scroll={{ x: 1000 }}
      />

      {/* Detail Modal */}
      <Modal
        open={detailCase !== null}
        title={`Caso #${detailCase?.id} - ${detailCase?.title}`}
        onCancel={() => setDetailCase(null)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setDetailCase(null)}>
            Cerrar
          </Button>,
        ]}
      >
        {detailCase && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <Space>
              <Tag color={STATUS_COLORS[detailCase.status]}>
                {detailCase.status === 'OPEN'
                  ? 'Abierto'
                  : detailCase.status === 'IN_PROGRESS'
                    ? 'En progreso'
                    : detailCase.status === 'COMPLETED'
                      ? 'Completado'
                      : 'Rechazado'}
              </Tag>
              <Select
                value={detailCase.status}
                onChange={(value) => handleChangeStatus(detailCase.id, value)}
                style={{ width: 150 }}
                options={[
                  { label: 'Abierto', value: 'OPEN' },
                  { label: 'En progreso', value: 'IN_PROGRESS' },
                  { label: 'Completado', value: 'COMPLETED' },
                  { label: 'Rechazado', value: 'REJECTED' },
                ]}
              />
            </Space>

            <Divider style={{ margin: '0.5rem 0' }} />

            {detailCase.description && (
              <div>
                <h4>Descripción</h4>
                <p>{detailCase.description}</p>
              </div>
            )}

            <div>
              <h4>Comentarios ({detailCase.comments.length})</h4>
              <div
                style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: '1px solid #e8e8e8',
                  borderRadius: '4px',
                  padding: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                {detailCase.comments.length === 0 ? (
                  <p style={{ color: '#999' }}>Sin comentarios</p>
                ) : (
                  detailCase.comments.map((comment) => (
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
                  ))
                )}
              </div>
            </div>

            <Divider style={{ margin: '0.5rem 0' }} />

            <div>
              <h4>Agregar Comentario</h4>
              <Input.TextArea
                rows={3}
                placeholder="Escribe tu comentario..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={1000}
                showCount
              />
              <Button
                type="primary"
                style={{ marginTop: '0.5rem' }}
                loading={submitLoading}
                onClick={handleAddComment}
              >
                Comentar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editingCase !== null}
        title={`Editar Caso #${editingCase?.id}`}
        onCancel={() => setEditingCase(null)}
        onOk={() => form.submit()}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEdit}
          style={{ marginTop: '1rem' }}
        >
          <Form.Item
            label="Título"
            name="title"
            rules={[{ required: true, message: 'El título es requerido' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Descripción" name="description">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item label="Prioridad" name="priority">
            <Select
              options={[
                { label: 'Baja', value: 'LOW' },
                { label: 'Media', value: 'MEDIUM' },
                { label: 'Alta', value: 'HIGH' },
                { label: 'Crítica', value: 'CRITICAL' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
