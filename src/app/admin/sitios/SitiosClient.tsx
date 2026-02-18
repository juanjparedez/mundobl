'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import {
  Card,
  Table,
  Button,
  Input,
  InputNumber,
  Modal,
  Form,
  Select,
  Popconfirm,
  Space,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AdminNav } from '../AdminNav';
import '../admin.css';
import './sitios.css';

const CATEGORY_OPTIONS = [
  { label: 'Noticias', value: 'noticias' },
  { label: 'Comunidad', value: 'comunidad' },
  { label: 'Streaming', value: 'streaming' },
  { label: 'Info', value: 'info' },
  { label: 'Otro', value: 'otro' },
];

const CATEGORY_COLORS: Record<string, string> = {
  noticias: 'blue',
  comunidad: 'green',
  streaming: 'purple',
  info: 'cyan',
  otro: 'default',
};

const LANGUAGE_OPTIONS = [
  { label: 'Español', value: 'ES' },
  { label: 'Inglés', value: 'EN' },
  { label: 'Multi', value: 'Multi' },
  { label: 'Tailandés', value: 'TH' },
  { label: 'Japonés', value: 'JP' },
  { label: 'Coreano', value: 'KR' },
  { label: 'Chino', value: 'ZH' },
  { label: 'Portugués', value: 'PT' },
];

interface SiteType {
  id: number;
  name: string;
  url: string;
  description: string | null;
  category: string | null;
  language: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

export function SitiosClient() {
  const message = useMessage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [sites, setSites] = useState<SiteType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteType | null>(null);
  const [form] = Form.useForm();

  const loadSites = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sitios');
      if (!response.ok) throw new Error('Error al cargar sitios');
      const data = await response.json();
      setSites(data);
    } catch (error) {
      message.error('Error al cargar los sitios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  const handleOpenModal = (site?: SiteType) => {
    if (site) {
      setEditingSite(site);
      form.setFieldsValue(site);
    } else {
      setEditingSite(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingSite(null);
    form.resetFields();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const url = editingSite ? `/api/sitios/${editingSite.id}` : '/api/sitios';
      const method = editingSite ? 'PUT' : 'POST';

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
        editingSite
          ? 'Sitio actualizado exitosamente'
          : 'Sitio creado exitosamente'
      );
      handleCloseModal();
      loadSites();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al guardar el sitio';
      message.error(errorMessage);
    }
  };

  const handleDelete = async (siteId: number) => {
    try {
      const response = await fetch(`/api/sitios/${siteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar');
      }

      message.success('Sitio eliminado correctamente');
      loadSites();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al eliminar el sitio';
      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: 'Nombre',
      key: 'name',
      render: (record: SiteType) => (
        <a
          href={record.url}
          target="_blank"
          rel="noopener noreferrer"
          className="sitios-table__link"
        >
          <LinkOutlined /> {record.name}
        </a>
      ),
      sorter: (a: SiteType, b: SiteType) => a.name.localeCompare(b.name),
    },
    {
      title: 'Categoría',
      key: 'category',
      render: (record: SiteType) =>
        record.category ? (
          <Tag color={CATEGORY_COLORS[record.category] || 'default'}>
            {record.category}
          </Tag>
        ) : (
          '-'
        ),
      responsive: ['md' as const],
    },
    {
      title: 'Idioma',
      dataIndex: 'language',
      key: 'language',
      width: 80,
      render: (lang: string | null) => lang || '-',
      responsive: ['md' as const],
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      responsive: ['lg' as const],
    },
    {
      title: 'Orden',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      responsive: ['md' as const],
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (record: SiteType) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
            size="small"
          >
            {!isMobile && 'Editar'}
          </Button>
          <Popconfirm
            title="¿Eliminar sitio?"
            description={`Esto eliminará "${record.name}"`}
            onConfirm={() => handleDelete(record.id)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              {!isMobile && 'Eliminar'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="admin-page-wrapper">
        <AdminNav />
        <Card
          title="Administración de Sitios de Interés"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              {isMobile ? 'Nuevo' : 'Nuevo Sitio'}
            </Button>
          }
        >
          <Table
            dataSource={sites}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </Card>

        <Modal
          title={editingSite ? 'Editar Sitio' : 'Nuevo Sitio'}
          open={modalOpen}
          onCancel={handleCloseModal}
          onOk={() => form.submit()}
          okText="Guardar"
          cancelText="Cancelar"
          forceRender
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Nombre"
              name="name"
              rules={[{ required: true, message: 'El nombre es requerido' }]}
            >
              <Input placeholder="Nombre del sitio" />
            </Form.Item>

            <Form.Item
              label="URL"
              name="url"
              rules={[
                { required: true, message: 'La URL es requerida' },
                { type: 'url', message: 'Ingresá una URL válida' },
              ]}
            >
              <Input placeholder="https://ejemplo.com" />
            </Form.Item>

            <Form.Item label="Descripción" name="description">
              <Input.TextArea
                rows={3}
                placeholder="Breve descripción del sitio"
              />
            </Form.Item>

            <Form.Item label="Categoría" name="category">
              <Select
                options={CATEGORY_OPTIONS}
                placeholder="Seleccionar categoría"
                allowClear
              />
            </Form.Item>

            <Form.Item label="Idioma" name="language">
              <Select
                options={LANGUAGE_OPTIONS}
                placeholder="Idioma del sitio"
                allowClear
              />
            </Form.Item>

            <Form.Item label="URL de imagen" name="imageUrl">
              <Input placeholder="https://ejemplo.com/logo.png" />
            </Form.Item>

            <Form.Item label="Orden" name="sortOrder" initialValue={0}>
              <InputNumber min={0} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
