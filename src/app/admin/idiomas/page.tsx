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
  const { t } = useLocale();
  const [languages, setLanguages] = useState<LanguageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<LanguageType | null>(
    null
  );
  const [form] = Form.useForm();

  const loadLanguages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/languages');
      if (!response.ok) throw new Error(t('adminLanguages.loadError'));
      const data = await response.json();
      setLanguages(data);
    } catch (error) {
      message.error(t('adminLanguages.loadError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  const filteredLanguages = useMemo(() => {
    if (!searchTerm.trim()) return languages;
    const term = searchTerm.toLowerCase();
    return languages.filter(
      (lang) =>
        lang.name.toLowerCase().includes(term) ||
        lang.code?.toLowerCase().includes(term)
    );
  }, [languages, searchTerm]);

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
        throw new Error(error.error || t('adminLanguages.saveError'));
      }

      message.success(
        editingLanguage
          ? t('adminLanguages.updateSuccess')
          : t('adminLanguages.createSuccess')
      );
      handleCloseModal();
      loadLanguages();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('adminLanguages.saveError');
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
        throw new Error(error.error || t('adminLanguages.deleteError'));
      }

      message.success(t('adminLanguages.deleteSuccess'));
      loadLanguages();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('adminLanguages.deleteError');
      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: t('adminLanguages.columnName'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a: LanguageType, b: LanguageType) =>
        a.name.localeCompare(b.name),
    },
    {
      title: t('adminLanguages.columnCode'),
      dataIndex: 'code',
      key: 'code',
      render: (code: string | null) =>
        code ? <Tag>{code}</Tag> : t('adminLanguages.emptyValue'),
      responsive: ['md' as const],
    },
    {
      title: t('adminLanguages.columnSeries'),
      key: 'seriesCount',
      sorter: (a: LanguageType, b: LanguageType) =>
        (a._count?.seriesOriginalLanguage || 0) -
        (b._count?.seriesOriginalLanguage || 0),
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
      title: t('adminLanguages.columnDubbings'),
      key: 'dubbingsCount',
      sorter: (a: LanguageType, b: LanguageType) =>
        (a._count?.dubbings || 0) - (b._count?.dubbings || 0),
      render: (record: LanguageType) => (
        <Tag color={(record._count?.dubbings || 0) > 0 ? 'green' : 'default'}>
          {record._count?.dubbings || 0}
        </Tag>
      ),
      responsive: ['md' as const],
    },
    {
      title: t('adminLanguages.columnActions'),
      key: 'actions',
      render: (record: LanguageType) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
            size="small"
          >
            {!isMobile && t('adminLanguages.actionEdit')}
          </Button>
          <Popconfirm
            title={t('adminLanguages.deleteTitle')}
            description={interpolateMessage(
              t('adminLanguages.deleteDescription'),
              { name: record.name }
            )}
            onConfirm={() => handleDelete(record.id)}
            okText={t('adminLanguages.actionDelete')}
            cancelText={t('adminLanguages.cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              {!isMobile && t('adminLanguages.actionDelete')}
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
          title={t('adminLanguages.title')}
          subtitle={t('adminLanguages.subtitle')}
          stats={[
            { label: t('adminLanguages.statsTotal'), value: languages.length },
            {
              label: t('adminLanguages.statsFiltered'),
              value: filteredLanguages.length,
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
              {t('adminLanguages.newItem')}
            </Button>
          }
          searchPlaceholder={t('adminLanguages.searchPlaceholder')}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchSubmit={() => undefined}
          onSearchClear={() => setSearchTerm('')}
        />

        <Table
          dataSource={filteredLanguages}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
        />

        <Modal
          title={
            editingLanguage
              ? t('adminLanguages.modalEditTitle')
              : t('adminLanguages.modalNewTitle')
          }
          open={modalOpen}
          onCancel={handleCloseModal}
          onOk={() => form.submit()}
          okText={t('adminLanguages.save')}
          cancelText={t('adminLanguages.cancel')}
          forceRender
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label={t('adminLanguages.fieldName')}
              name="name"
              rules={[
                { required: true, message: t('adminLanguages.requiredName') },
              ]}
            >
              <Input placeholder={t('adminLanguages.hintName')} />
            </Form.Item>

            <Form.Item label={t('adminLanguages.fieldCode')} name="code">
              <Input placeholder={t('adminLanguages.hintCode')} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
