'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import {
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
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { AdminPageHero } from '@/components/admin/AdminPageHero/AdminPageHero';
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar/AdminTableToolbar';
import {
  CATEGORY_COLORS,
  CATEGORY_SELECT_OPTIONS,
  LANGUAGE_OPTIONS,
} from '@/constants/sitios';
import { AdminNav } from '../AdminNav';
import '../admin.css';
import './sitios.css';

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
  const { t } = useLocale();
  const [sites, setSites] = useState<SiteType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteType | null>(null);
  const [form] = Form.useForm();

  const loadSites = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sitios');
      if (!response.ok) throw new Error(t('adminSites.loadError'));
      const data = await response.json();
      setSites(data);
    } catch (error) {
      message.error(t('adminSites.loadError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  const filteredSites = useMemo(() => {
    if (!searchTerm.trim()) return sites;
    const term = searchTerm.toLowerCase();
    return sites.filter(
      (site) =>
        site.name.toLowerCase().includes(term) ||
        site.category?.toLowerCase().includes(term) ||
        site.description?.toLowerCase().includes(term)
    );
  }, [sites, searchTerm]);

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
        throw new Error(error.error || t('adminSites.saveError'));
      }

      message.success(
        editingSite
          ? t('adminSites.updateSuccess')
          : t('adminSites.createSuccess')
      );
      handleCloseModal();
      loadSites();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('adminSites.saveError');
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
        throw new Error(error.error || t('adminSites.deleteError'));
      }

      message.success(t('adminSites.deleteSuccess'));
      loadSites();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('adminSites.deleteError');
      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: t('adminSites.columnName'),
      key: 'name',
      render: (record: SiteType) => (
        <a
          href={record.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="sitios-table__link"
        >
          <LinkOutlined /> {record.name}
        </a>
      ),
      sorter: (a: SiteType, b: SiteType) => a.name.localeCompare(b.name),
    },
    {
      title: t('adminSites.columnCategory'),
      key: 'category',
      render: (record: SiteType) =>
        record.category ? (
          <Tag color={CATEGORY_COLORS[record.category] || 'default'}>
            {record.category}
          </Tag>
        ) : (
          t('adminSites.emptyValue')
        ),
      responsive: ['md' as const],
    },
    {
      title: t('adminSites.columnLanguage'),
      dataIndex: 'language',
      key: 'language',
      width: 80,
      render: (lang: string | null) => lang || t('adminSites.emptyValue'),
      responsive: ['md' as const],
    },
    {
      title: t('adminSites.columnDescription'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      responsive: ['lg' as const],
    },
    {
      title: t('adminSites.columnOrder'),
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      sorter: (a: SiteType, b: SiteType) => a.sortOrder - b.sortOrder,
      responsive: ['md' as const],
    },
    {
      title: t('adminSites.columnActions'),
      key: 'actions',
      render: (record: SiteType) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
            size="small"
          >
            {!isMobile && t('adminSites.actionEdit')}
          </Button>
          <Popconfirm
            title={t('adminSites.deleteTitle')}
            description={interpolateMessage(t('adminSites.deleteDescription'), {
              name: record.name,
            })}
            onConfirm={() => handleDelete(record.id)}
            okText={t('adminSites.actionDelete')}
            cancelText={t('adminSites.cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              {!isMobile && t('adminSites.actionDelete')}
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
          title={t('adminSites.title')}
          subtitle={t('adminSites.subtitle')}
          stats={[
            { label: t('adminSites.statsTotal'), value: sites.length },
            {
              label: t('adminSites.statsFiltered'),
              value: filteredSites.length,
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
              {isMobile
                ? t('adminSites.newItemShort')
                : t('adminSites.newItem')}
            </Button>
          }
          searchPlaceholder={t('adminSites.searchPlaceholder')}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchSubmit={() => undefined}
          onSearchClear={() => setSearchTerm('')}
        />

        <Table
          dataSource={filteredSites}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
        />

        <Modal
          title={
            editingSite
              ? t('adminSites.modalEditTitle')
              : t('adminSites.modalNewTitle')
          }
          open={modalOpen}
          onCancel={handleCloseModal}
          onOk={() => form.submit()}
          okText={t('adminSites.save')}
          cancelText={t('adminSites.cancel')}
          forceRender
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label={t('adminSites.fieldName')}
              name="name"
              rules={[
                { required: true, message: t('adminSites.requiredName') },
              ]}
            >
              <Input placeholder={t('adminSites.hintName')} />
            </Form.Item>

            <Form.Item
              label={t('adminSites.fieldUrl')}
              name="url"
              rules={[
                { required: true, message: t('adminSites.requiredUrl') },
                { type: 'url', message: t('adminSites.invalidUrl') },
              ]}
            >
              <Input placeholder={t('adminSites.hintUrl')} />
            </Form.Item>

            <Form.Item
              label={t('adminSites.fieldDescription')}
              name="description"
            >
              <Input.TextArea
                rows={3}
                placeholder={t('adminSites.hintDescription')}
              />
            </Form.Item>

            <Form.Item label={t('adminSites.fieldCategory')} name="category">
              <Select
                options={CATEGORY_SELECT_OPTIONS}
                placeholder={t('adminSites.hintCategory')}
                allowClear
              />
            </Form.Item>

            <Form.Item label={t('adminSites.fieldLanguage')} name="language">
              <Select
                options={LANGUAGE_OPTIONS}
                placeholder={t('adminSites.hintLanguage')}
                allowClear
              />
            </Form.Item>

            <Form.Item label={t('adminSites.fieldImageUrl')} name="imageUrl">
              <Input placeholder={t('adminSites.hintImageUrl')} />
            </Form.Item>

            <Form.Item
              label={t('adminSites.fieldOrder')}
              name="sortOrder"
              initialValue={0}
            >
              <InputNumber min={0} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
