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

interface ProductionCompanyType {
  id: number;
  name: string;
  country?: string | null;
  _count?: {
    series: number;
  };
}

export default function ProductorasAdminPage() {
  const message = useMessage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [companies, setCompanies] = useState<ProductionCompanyType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] =
    useState<ProductionCompanyType | null>(null);
  const [form] = Form.useForm();

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/production-companies');
      if (!response.ok) throw new Error('Error al cargar productoras');
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      message.error('Error al cargar las productoras');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleOpenModal = (company?: ProductionCompanyType) => {
    if (company) {
      setEditingCompany(company);
      form.setFieldsValue(company);
    } else {
      setEditingCompany(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCompany(null);
    form.resetFields();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const url = editingCompany
        ? `/api/production-companies/${editingCompany.id}`
        : '/api/production-companies';
      const method = editingCompany ? 'PUT' : 'POST';

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
        editingCompany
          ? 'Productora actualizada exitosamente'
          : 'Productora creada exitosamente'
      );
      handleCloseModal();
      loadCompanies();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al guardar la productora';
      message.error(errorMessage);
    }
  };

  const handleDelete = async (companyId: number) => {
    try {
      const response = await fetch(`/api/production-companies/${companyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar');
      }

      message.success('Productora eliminada correctamente');
      loadCompanies();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al eliminar la productora';
      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: ProductionCompanyType, b: ProductionCompanyType) =>
        a.name.localeCompare(b.name),
    },
    {
      title: 'País',
      dataIndex: 'country',
      key: 'country',
      render: (country: string | null) => country || '-',
      responsive: ['md' as const],
    },
    {
      title: 'Series',
      key: 'count',
      render: (record: ProductionCompanyType) => (
        <Tag color={(record._count?.series || 0) > 0 ? 'blue' : 'default'}>
          {record._count?.series || 0}
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (record: ProductionCompanyType) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
            size="small"
          >
            {!isMobile && 'Editar'}
          </Button>
          <Popconfirm
            title="¿Eliminar productora?"
            description={`Esto eliminará la productora "${record.name}"`}
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
          title="🏢 Administración de Productoras"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              Nueva Productora
            </Button>
          }
        >
          <Table
            dataSource={companies}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </Card>

        <Modal
          title={editingCompany ? 'Editar Productora' : 'Nueva Productora'}
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
              <Input placeholder="Nombre de la productora" />
            </Form.Item>

            <Form.Item label="País" name="country">
              <Input placeholder="País de la productora (opcional)" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
