'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import {
  Card,
  Table,
  Button,
  Input,
  Modal,
  Form,
  message,
  Popconfirm,
  Space,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';

const { TextArea } = Input;

interface Universe {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  _count?: {
    series: number;
  };
}

export default function UniversesAdminPage() {
  const message = useMessage();
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUniverse, setEditingUniverse] = useState<Universe | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUniverses();
  }, []);

  const loadUniverses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/universes');
      if (!response.ok) throw new Error('Error al cargar universos');
      const data = await response.json();
      setUniverses(data);
    } catch (error) {
      message.error('Error al cargar los universos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (universe?: Universe) => {
    if (universe) {
      setEditingUniverse(universe);
      form.setFieldsValue(universe);
    } else {
      setEditingUniverse(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUniverse(null);
    form.resetFields();
  };

  const handleSubmit = async (values: any) => {
    try {
      const url = editingUniverse
        ? `/api/universes/${editingUniverse.id}`
        : '/api/universes';
      const method = editingUniverse ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar');
      }

      message.success(
        editingUniverse
          ? 'Universo actualizado exitosamente'
          : 'Universo creado exitosamente'
      );
      handleCloseModal();
      loadUniverses();
    } catch (error: any) {
      message.error(error.message || 'Error al guardar el universo');
    }
  };

  const handleDelete = async (universeId: number) => {
    try {
      const response = await fetch(`/api/universes/${universeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar');
      }

      message.success('Universo eliminado correctamente');
      loadUniverses();
    } catch (error: any) {
      message.error(error.message || 'Error al eliminar el universo');
    }
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      render: (description: string | null) => description || '-',
    },
    {
      title: 'Series',
      key: 'count',
      render: (record: Universe) => (
        <Tag color="blue">{record._count?.series || 0} series</Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (record: Universe) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
            size="small"
          >
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar universo?"
            description={
              record._count && record._count.series > 0
                ? `Este universo tiene ${record._count.series} series. Primero desvincúlalas.`
                : '¿Estás seguro de eliminar este universo?'
            }
            onConfirm={() => handleDelete(record.id)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            disabled={record._count ? record._count.series > 0 : false}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              disabled={record._count ? record._count.series > 0 : false}
            >
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout>
      <div style={{ padding: '24px' }}>
        <Card
          title="🌌 Administración de Universos"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              Nuevo Universo
            </Button>
          }
        >
          <Table
            dataSource={universes}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </Card>

        <Modal
          title={editingUniverse ? 'Editar Universo' : 'Nuevo Universo'}
          open={modalOpen}
          onCancel={handleCloseModal}
          onOk={() => form.submit()}
          okText="Guardar"
          cancelText="Cancelar"
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Nombre"
              name="name"
              rules={[{ required: true, message: 'El nombre es requerido' }]}
            >
              <Input placeholder="Ej: 2 Moons Universe" />
            </Form.Item>

            <Form.Item label="Descripción" name="description">
              <TextArea
                rows={3}
                placeholder="Descripción del universo (opcional)"
              />
            </Form.Item>

            <Form.Item label="URL de Imagen" name="imageUrl">
              <Input placeholder="URL de la imagen del universo (opcional)" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
