'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import {
  Card,
  Table,
  Button,
  Input,
  Modal,
  Form,
  Popconfirm,
  Space,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AdminNav } from '../AdminNav';
import '../admin.css';

interface LanguageType {
  id: number;
  name: string;
  code?: string | null;
  _count?: {
    seriesOriginalLanguage: number;
    dubbings: number;
  };
}

export default function IdiomasAdminPage() {
  const message = useMessage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [languages, setLanguages] = useState<LanguageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<LanguageType | null>(
    null
  );
  const [form] = Form.useForm();

  const loadLanguages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/languages');
      if (!response.ok) throw new Error('Error al cargar idiomas');
      const data = await response.json();
      setLanguages(data);
    } catch (error) {
      message.error('Error al cargar los idiomas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  const handleOpenModal = (language?: LanguageType) => {
    if (language) {
      setEditingLanguage(language);
      form.setFieldsValue(language);
    } else {
      setEditingLanguage(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingLanguage(null);
    form.resetFields();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const url = editingLanguage
        ? `/api/languages/${editingLanguage.id}`
        : '/api/languages';
      const method = editingLanguage ? 'PUT' : 'POST';

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
        editingLanguage
          ? 'Idioma actualizado exitosamente'
          : 'Idioma creado exitosamente'
      );
      handleCloseModal();
      loadLanguages();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al guardar el idioma';
      message.error(errorMessage);
    }
  };

  const handleDelete = async (languageId: number) => {
    try {
      const response = await fetch(`/api/languages/${languageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar');
      }

      message.success('Idioma eliminado correctamente');
      loadLanguages();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al eliminar el idioma';
      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: 'Idioma',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: LanguageType, b: LanguageType) =>
        a.name.localeCompare(b.name),
    },
    {
      title: 'Código',
      dataIndex: 'code',
      key: 'code',
      render: (code: string | null) => (code ? <Tag>{code}</Tag> : '-'),
      responsive: ['md' as const],
    },
    {
      title: 'Series',
      key: 'seriesCount',
      render: (record: LanguageType) => (
        <Tag
          color={
            (record._count?.seriesOriginalLanguage || 0) > 0
              ? 'blue'
              : 'default'
          }
        >
          {record._count?.seriesOriginalLanguage || 0}
        </Tag>
      ),
    },
    {
      title: 'Doblajes',
      key: 'dubbingsCount',
      render: (record: LanguageType) => (
        <Tag color={(record._count?.dubbings || 0) > 0 ? 'green' : 'default'}>
          {record._count?.dubbings || 0}
        </Tag>
      ),
      responsive: ['md' as const],
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (record: LanguageType) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
            size="small"
          >
            {!isMobile && 'Editar'}
          </Button>
          <Popconfirm
            title="¿Eliminar idioma?"
            description={`Esto eliminará el idioma "${record.name}"`}
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
          title="🌐 Administración de Idiomas"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              Nuevo Idioma
            </Button>
          }
        >
          <Table
            dataSource={languages}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </Card>

        <Modal
          title={editingLanguage ? 'Editar Idioma' : 'Nuevo Idioma'}
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
              <Input placeholder="Nombre del idioma (ej: Coreano)" />
            </Form.Item>

            <Form.Item label="Código" name="code">
              <Input placeholder="Código ISO (ej: ko, th, ja)" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
