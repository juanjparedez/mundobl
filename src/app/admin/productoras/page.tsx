'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import {
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
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { AdminPageHero } from '@/components/admin/AdminPageHero/AdminPageHero';
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar/AdminTableToolbar';
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
  const { t } = useLocale();
  const [companies, setCompanies] = useState<ProductionCompanyType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] =
    useState<ProductionCompanyType | null>(null);
  const [form] = Form.useForm();

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/production-companies');
      if (!response.ok)
        throw new Error(t('adminProductionCompanies.loadError'));
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      message.error(t('adminProductionCompanies.loadError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) return companies;
    const term = searchTerm.toLowerCase();
    return companies.filter(
      (company) =>
        company.name.toLowerCase().includes(term) ||
        company.country?.toLowerCase().includes(term)
    );
  }, [companies, searchTerm]);

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
        throw new Error(error.error || t('adminProductionCompanies.saveError'));
      }

      message.success(
        editingCompany
          ? t('adminProductionCompanies.updateSuccess')
          : t('adminProductionCompanies.createSuccess')
      );
      handleCloseModal();
      loadCompanies();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('adminProductionCompanies.saveError');
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
        throw new Error(
          error.error || t('adminProductionCompanies.deleteError')
        );
      }

      message.success(t('adminProductionCompanies.deleteSuccess'));
      loadCompanies();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('adminProductionCompanies.deleteError');
      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: t('adminProductionCompanies.columnName'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a: ProductionCompanyType, b: ProductionCompanyType) =>
        a.name.localeCompare(b.name),
    },
    {
      title: t('adminProductionCompanies.columnCountry'),
      dataIndex: 'country',
      key: 'country',
      render: (country: string | null) =>
        country || t('adminProductionCompanies.emptyValue'),
      responsive: ['md' as const],
    },
    {
      title: t('adminProductionCompanies.columnSeries'),
      key: 'count',
      sorter: (a: ProductionCompanyType, b: ProductionCompanyType) =>
        (a._count?.series || 0) - (b._count?.series || 0),
      render: (record: ProductionCompanyType) => (
        <Tag color={(record._count?.series || 0) > 0 ? 'blue' : 'default'}>
          {record._count?.series || 0}
        </Tag>
      ),
    },
    {
      title: t('adminProductionCompanies.columnActions'),
      key: 'actions',
      render: (record: ProductionCompanyType) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
            size="small"
          >
            {!isMobile && t('adminProductionCompanies.actionEdit')}
          </Button>
          <Popconfirm
            title={t('adminProductionCompanies.deleteTitle')}
            description={interpolateMessage(
              t('adminProductionCompanies.deleteDescription'),
              { name: record.name }
            )}
            onConfirm={() => handleDelete(record.id)}
            okText={t('adminProductionCompanies.actionDelete')}
            cancelText={t('adminProductionCompanies.cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              {!isMobile && t('adminProductionCompanies.actionDelete')}
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

        <AdminPageHero
          title={t('adminProductionCompanies.title')}
          subtitle={t('adminProductionCompanies.subtitle')}
          stats={[
            {
              label: t('adminProductionCompanies.statsTotal'),
              value: companies.length,
            },
            {
              label: t('adminProductionCompanies.statsFiltered'),
              value: filteredCompanies.length,
            },
          ]}
        />

        <AdminTableToolbar
          filters={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              {t('adminProductionCompanies.newItem')}
            </Button>
          }
          searchPlaceholder={t('adminProductionCompanies.searchPlaceholder')}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchSubmit={() => undefined}
          onSearchClear={() => setSearchTerm('')}
        />

        <Table
          dataSource={filteredCompanies}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
        />

        <Modal
          title={
            editingCompany
              ? t('adminProductionCompanies.modalEditTitle')
              : t('adminProductionCompanies.modalNewTitle')
          }
          open={modalOpen}
          onCancel={handleCloseModal}
          onOk={() => form.submit()}
          okText={t('adminProductionCompanies.save')}
          cancelText={t('adminProductionCompanies.cancel')}
          forceRender
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label={t('adminProductionCompanies.fieldName')}
              name="name"
              rules={[
                {
                  required: true,
                  message: t('adminProductionCompanies.requiredName'),
                },
              ]}
            >
              <Input placeholder={t('adminProductionCompanies.hintName')} />
            </Form.Item>

            <Form.Item
              label={t('adminProductionCompanies.fieldCountry')}
              name="country"
            >
              <Input placeholder={t('adminProductionCompanies.hintCountry')} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
