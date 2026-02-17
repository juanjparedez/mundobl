'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Tabs,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Timeline,
  Avatar,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  LikeOutlined,
  LikeFilled,
  BugOutlined,
  BulbOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { PageTitle } from '@/components/common/PageTitle/PageTitle';
import { useMessage } from '@/hooks/useMessage';
import './FeedbackClient.css';

interface FeatureRequestUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface FeatureRequest {
  id: number;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  user: FeatureRequestUser | null;
  _count: { votes: number };
  votes: Array<{ userId: string }>;
}

const TYPE_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  bug: { color: 'red', label: 'Bug', icon: <BugOutlined /> },
  feature: { color: 'blue', label: 'Feature', icon: <RocketOutlined /> },
  idea: { color: 'purple', label: 'Idea', icon: <BulbOutlined /> },
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pendiente: { color: 'default', label: 'Pendiente' },
  en_progreso: { color: 'processing', label: 'En progreso' },
  completado: { color: 'success', label: 'Completado' },
  descartado: { color: 'error', label: 'Descartado' },
};

export function FeedbackClient() {
  const message = useMessage();
  const { data: session } = useSession();
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const isAdmin = session?.user?.role === 'ADMIN';
  const userId = session?.user?.id;

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/feature-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCreate = async (values: { title: string; description?: string; type: string }) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Error al crear');

      const newRequest = await response.json();
      setRequests((prev) => [newRequest, ...prev]);
      setModalOpen(false);
      form.resetFields();
      message.success('Solicitud creada');
    } catch (error) {
      message.error('Error al crear la solicitud');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (requestId: number) => {
    try {
      const response = await fetch(`/api/feature-requests/${requestId}/vote`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Error al votar');

      const { voted } = await response.json();

      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== requestId) return r;
          return {
            ...r,
            _count: {
              votes: voted ? r._count.votes + 1 : r._count.votes - 1,
            },
            votes: voted
              ? [...r.votes, { userId: userId! }]
              : r.votes.filter((v) => v.userId !== userId),
          };
        })
      );
    } catch (error) {
      message.error('Error al votar');
      console.error(error);
    }
  };

  const handleStatusChange = async (requestId: number, status: string) => {
    try {
      const response = await fetch(`/api/feature-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Error al actualizar');

      const updated = await response.json();
      setRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
      message.success('Estado actualizado');
    } catch (error) {
      message.error('Error al actualizar');
      console.error(error);
    }
  };

  const handleDelete = async (requestId: number) => {
    try {
      const response = await fetch(`/api/feature-requests/${requestId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');

      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      message.success('Solicitud eliminada');
    } catch (error) {
      message.error('Error al eliminar');
      console.error(error);
    }
  };

  const activeRequests = requests.filter((r) => r.status !== 'completado');
  const completedRequests = requests
    .filter((r) => r.status === 'completado')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const renderRequestCard = (request: FeatureRequest) => {
    const typeConfig = TYPE_CONFIG[request.type] || TYPE_CONFIG.idea;
    const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pendiente;
    const hasVoted = userId ? request.votes.some((v) => v.userId === userId) : false;

    return (
      <div key={request.id} className="feedback-card">
        <div className="feedback-card__header">
          <h4 className="feedback-card__title">{request.title}</h4>
          <div className="feedback-card__tags">
            <Tag icon={typeConfig.icon} color={typeConfig.color}>
              {typeConfig.label}
            </Tag>
            <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
          </div>
        </div>

        {request.description && (
          <p className="feedback-card__description">{request.description}</p>
        )}

        <div className="feedback-card__footer">
          <div className="feedback-card__meta">
            {request.user && (
              <>
                <Avatar
                  src={request.user.image}
                  icon={!request.user.image ? <UserOutlined /> : undefined}
                  size={20}
                />
                <span>{request.user.name}</span>
              </>
            )}
            <span>
              {new Date(request.createdAt).toLocaleDateString('es-ES')}
            </span>
          </div>

          <div className="feedback-card__actions">
            {userId && (
              <Button
                type={hasVoted ? 'primary' : 'default'}
                size="small"
                icon={hasVoted ? <LikeFilled /> : <LikeOutlined />}
                onClick={() => handleVote(request.id)}
              >
                {request._count.votes}
              </Button>
            )}

            {isAdmin && (
              <Select
                value={request.status}
                size="small"
                style={{ width: 130 }}
                onChange={(value) => handleStatusChange(request.id, value)}
                options={Object.entries(STATUS_CONFIG).map(([value, config]) => ({
                  value,
                  label: config.label,
                }))}
              />
            )}

            {isAdmin && (
              <Button
                danger
                size="small"
                onClick={() => handleDelete(request.id)}
              >
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const tabItems = [
    {
      key: 'requests',
      label: 'Ideas y Bugs',
      children: (
        <>
          <div className="feedback-page__header">
            <span style={{ color: 'var(--text-secondary)' }}>
              {activeRequests.length} solicitudes activas
            </span>
            {session?.user && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalOpen(true)}
              >
                Nueva solicitud
              </Button>
            )}
          </div>
          {activeRequests.length > 0 ? (
            <div className="feedback-list">
              {activeRequests.map(renderRequestCard)}
            </div>
          ) : (
            <Empty description="No hay solicitudes activas" />
          )}
        </>
      ),
    },
    {
      key: 'changelog',
      label: 'Changelog',
      children:
        completedRequests.length > 0 ? (
          <Timeline
            items={completedRequests.map((r) => ({
              color: 'green',
              dot: <CheckCircleOutlined />,
              children: (
                <div className="changelog-item">
                  <div className="changelog-item__title">
                    <Tag
                      icon={TYPE_CONFIG[r.type]?.icon}
                      color={TYPE_CONFIG[r.type]?.color}
                    >
                      {TYPE_CONFIG[r.type]?.label}
                    </Tag>
                    {r.title}
                  </div>
                  {r.description && (
                    <div className="changelog-item__description">
                      {r.description}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-tertiary)',
                      marginTop: 4,
                    }}
                  >
                    {new Date(r.updatedAt).toLocaleDateString('es-ES')}
                  </div>
                </div>
              ),
            }))}
          />
        ) : (
          <Empty description="No hay cambios registrados" />
        ),
    },
  ];

  return (
    <div className="feedback-page">
      <PageTitle title="Feedback" />
      <Tabs items={tabItems} />

      <Modal
        title="Nueva solicitud"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="type"
            label="Tipo"
            rules={[{ required: true, message: 'Seleccioná un tipo' }]}
          >
            <Select
              options={[
                { label: 'Bug', value: 'bug' },
                { label: 'Feature', value: 'feature' },
                { label: 'Idea', value: 'idea' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="title"
            label="Título"
            rules={[{ required: true, message: 'Ingresá un título' }]}
          >
            <Input maxLength={200} />
          </Form.Item>

          <Form.Item name="description" label="Descripción">
            <Input.TextArea rows={3} maxLength={1000} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
            >
              Crear
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
