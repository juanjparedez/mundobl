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
  Radio,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MergeCellsOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useMessage } from '@/hooks/useMessage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { DirectorAdmin } from '@/types/person.types';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { AdminPageHero } from '@/components/admin/AdminPageHero/AdminPageHero';
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar/AdminTableToolbar';
import { AdminAlphabetIndex } from '@/components/admin/AdminAlphabetIndex/AdminAlphabetIndex';
import { AdminNav } from '../AdminNav';
import '../admin.css';

const { TextArea } = Input;
const ALPHABET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function interpolate(template: string, params: Record<string, string | number>) {
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

export default function DirectoresAdminPage() {
  const message = useMessage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { t } = useLocale();
  const [directors, setDirectors] = useState<DirectorAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDirector, setEditingDirector] = useState<DirectorAdmin | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<number | null>(null);
  const [form] = Form.useForm();

  const loadDirectors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/directors');
      if (!response.ok) throw new Error('Error al cargar directores');
      const data = await response.json();
      setDirectors(data);
    } catch (error) {
      message.error(t('adminDirectors.loadError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    loadDirectors();
  }, [loadDirectors]);

  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    directors.forEach((director) => {
      const first = director.name.charAt(0).toUpperCase();
      letters.add(/[A-Z]/.test(first) ? first : '#');
    });
    return letters;
  }, [directors]);

  const filteredDirectors = useMemo(() => {
    let filtered = directors;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (director) =>
          director.name.toLowerCase().includes(term) ||
          director.nationality?.toLowerCase().includes(term)
      );
    }

    if (selectedLetter) {
      filtered = filtered.filter((director) => {
        const first = director.name.charAt(0).toUpperCase();
        if (selectedLetter === '#') return !/[A-Z]/.test(first);
        return first === selectedLetter;
      });
    }

    return filtered;
  }, [directors, searchTerm, selectedLetter]);

  const handleOpenModal = (director?: DirectorAdmin) => {
    if (director) {
      setEditingDirector(director);
      form.setFieldsValue(director);
    } else {
      setEditingDirector(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingDirector(null);
    form.resetFields();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const url = editingDirector
        ? `/api/directors/${editingDirector.id}`
        : '/api/directors';
      const method = editingDirector ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('adminDirectors.saveError'));
      }

      message.success(
        editingDirector
          ? t('adminDirectors.saveUpdateSuccess')
          : t('adminDirectors.saveCreateSuccess')
      );
      handleCloseModal();
      loadDirectors();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('adminDirectors.saveError');
      message.error(errorMessage);
    }
  };

  const handleDelete = async (directorId: number) => {
    try {
      const response = await fetch(`/api/directors/${directorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('adminDirectors.deleteError'));
      }

      message.success(t('adminDirectors.deleteSuccess'));
      loadDirectors();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('adminDirectors.deleteError');
      message.error(errorMessage);
    }
  };

  const handleMerge = async () => {
    if (!mergeTarget || selectedRowKeys.length !== 2) return;
    const sourceId = selectedRowKeys.find((id) => id !== mergeTarget);

    try {
      const response = await fetch('/api/directors/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, targetId: mergeTarget }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('adminDirectors.mergeError'));
      }
      message.success(t('adminDirectors.mergeSuccess'));
      setMergeModalOpen(false);
      setSelectedRowKeys([]);
      setMergeTarget(null);
      loadDirectors();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('adminDirectors.mergeError');
      message.error(errorMessage);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      if (keys.length <= 2) setSelectedRowKeys(keys);
    },
  };

  const columns = [
    {
      title: t('adminDirectors.columnName'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a: DirectorAdmin, b: DirectorAdmin) =>
        a.name.localeCompare(b.name),
      render: (name: string, record: DirectorAdmin) => (
        <Link href={`/directores/${record.id}`}>
          <strong>{name}</strong>
        </Link>
      ),
    },
    {
      title: t('adminDirectors.columnNationality'),
      dataIndex: 'nationality',
      key: 'nationality',
      render: (nationality: string | null) =>
        nationality || t('adminDirectors.emptyValue'),
      responsive: ['md' as const],
    },
    {
      title: t('adminDirectors.columnSeries'),
      key: 'count',
      render: (record: DirectorAdmin) => {
        const count = record._count?.series || 0;
        return <Tag color={count > 0 ? 'blue' : 'default'}>{count}</Tag>;
      },
      sorter: (a: DirectorAdmin, b: DirectorAdmin) =>
        (a._count?.series || 0) - (b._count?.series || 0),
    },
    {
      title: t('adminDirectors.columnActions'),
      key: 'actions',
      render: (record: DirectorAdmin) => {
        const count = record._count?.series || 0;
        return (
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
              size="small"
            >
              {!isMobile && t('adminDirectors.actionEdit')}
            </Button>
            <Popconfirm
              title={t('adminDirectors.deleteTitle')}
              description={
                count > 0
                  ? interpolate(t('adminDirectors.deleteBlockedDescription'), {
                      count,
                    })
                  : t('adminDirectors.deleteDescription')
              }
              onConfirm={() => handleDelete(record.id)}
              okText={t('adminDirectors.actionDelete')}
              cancelText={t('adminDirectors.cancel')}
              okButtonProps={{ danger: true }}
              disabled={count > 0}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                disabled={count > 0}
              >
                {!isMobile && t('adminDirectors.actionDelete')}
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <AppLayout>
      <div className="admin-page-wrapper">
        <AdminNav />

        <AdminPageHero
          title={t('adminDirectors.title')}
          subtitle={t('adminDirectors.subtitle')}
          stats={[
            { label: t('adminDirectors.statsTotal'), value: directors.length },
            {
              label: t('adminDirectors.statsFiltered'),
              value: filteredDirectors.length,
            },
            {
              label: t('adminDirectors.statsSelected'),
              value: selectedRowKeys.length,
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
              {t('adminDirectors.newItem')}
            </Button>
          }
          searchPlaceholder={t('adminDirectors.searchPlaceholder')}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchSubmit={() => undefined}
          onSearchClear={() => setSearchTerm('')}
        />

        <AdminAlphabetIndex
          letters={ALPHABET}
          availableLetters={availableLetters}
          selectedLetter={selectedLetter}
          onSelectLetter={setSelectedLetter}
        />

        {selectedRowKeys.length === 2 && (
          <Button
            type="primary"
            icon={<MergeCellsOutlined />}
            onClick={() => {
              setMergeTarget(selectedRowKeys[0] as number);
              setMergeModalOpen(true);
            }}
            style={{ marginBottom: 12 }}
          >
            {t('adminDirectors.mergeSelected')}
          </Button>
        )}

        <Table
          dataSource={filteredDirectors}
          columns={columns}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
        />

        <Modal
          title={
            editingDirector
              ? t('adminDirectors.modalEditTitle')
              : t('adminDirectors.modalNewTitle')
          }
          open={modalOpen}
          onCancel={handleCloseModal}
          forceRender
          onOk={() => form.submit()}
          okText={t('adminDirectors.save')}
          cancelText={t('adminDirectors.cancel')}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label={t('adminDirectors.fieldName')}
              name="name"
              rules={[
                { required: true, message: t('adminDirectors.requiredName') },
              ]}
            >
              <Input placeholder={t('adminDirectors.hintName')} />
            </Form.Item>

            <Form.Item
              label={t('adminDirectors.fieldNationality')}
              name="nationality"
            >
              <Input placeholder={t('adminDirectors.hintNationality')} />
            </Form.Item>

            <Form.Item label={t('adminDirectors.fieldImageUrl')} name="imageUrl">
              <Input placeholder={t('adminDirectors.hintImageUrl')} />
            </Form.Item>

            <Form.Item
              label={t('adminDirectors.fieldBiography')}
              name="biography"
            >
              <TextArea rows={3} placeholder={t('adminDirectors.hintBiography')} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={t('adminDirectors.mergeModalTitle')}
          open={mergeModalOpen}
          onCancel={() => {
            setMergeModalOpen(false);
            setMergeTarget(null);
          }}
          onOk={handleMerge}
          okText={t('adminDirectors.mergeSelected')}
          okButtonProps={{ danger: true }}
          cancelText={t('adminDirectors.cancel')}
        >
          <p style={{ marginBottom: 12 }}>
            {t('adminDirectors.mergeSelectSurvivor')}
          </p>
          <Radio.Group
            value={mergeTarget}
            onChange={(event) => setMergeTarget(event.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {selectedRowKeys.map((id) => {
              const director = directors.find((item) => item.id === id);
              if (!director) return null;
              const count = director._count?.series || 0;
              return (
                <Radio key={String(id)} value={id}>
                  <strong>{director.name}</strong> (
                  {interpolate(t('adminDirectors.seriesCount'), { count })})
                </Radio>
              );
            })}
          </Radio.Group>
          <Alert
            type="warning"
            message={t('adminDirectors.mergeWarning')}
            style={{ marginTop: 16 }}
          />
        </Modal>
      </div>
    </AppLayout>
  );
}
