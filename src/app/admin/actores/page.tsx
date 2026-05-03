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
import type { ActorAdmin } from '@/types/person.types';
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

export default function ActoresAdminPage() {
  const message = useMessage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { t } = useLocale();
  const [actors, setActors] = useState<ActorAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingActor, setEditingActor] = useState<ActorAdmin | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<number | null>(null);
  const [form] = Form.useForm();

  const loadActors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/actors');
      if (!response.ok) throw new Error('Error al cargar actores');
      const data = await response.json();
      setActors(data);
    } catch (error) {
      message.error(t('adminActors.loadError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    loadActors();
  }, [loadActors]);

  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    actors.forEach((actor) => {
      const first = actor.name.charAt(0).toUpperCase();
      letters.add(/[A-Z]/.test(first) ? first : '#');
    });
    return letters;
  }, [actors]);

  const filteredActors = useMemo(() => {
    let filtered = actors;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (actor) =>
          actor.name.toLowerCase().includes(term) ||
          actor.stageName?.toLowerCase().includes(term) ||
          actor.nationality?.toLowerCase().includes(term)
      );
    }

    if (selectedLetter) {
      filtered = filtered.filter((actor) => {
        const first = actor.name.charAt(0).toUpperCase();
        if (selectedLetter === '#') return !/[A-Z]/.test(first);
        return first === selectedLetter;
      });
    }

    return filtered;
  }, [actors, searchTerm, selectedLetter]);

  const handleOpenModal = (actor?: ActorAdmin) => {
    if (actor) {
      setEditingActor(actor);
      form.setFieldsValue({
        ...actor,
        birthDate: actor.birthDate
          ? new Date(actor.birthDate).toISOString().split('T')[0]
          : undefined,
      });
    } else {
      setEditingActor(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingActor(null);
    form.resetFields();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const url = editingActor ? `/api/actors/${editingActor.id}` : '/api/actors';
      const method = editingActor ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('adminActors.saveError'));
      }

      message.success(
        editingActor
          ? t('adminActors.saveUpdateSuccess')
          : t('adminActors.saveCreateSuccess')
      );
      handleCloseModal();
      loadActors();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('adminActors.saveError');
      message.error(errorMessage);
    }
  };

  const handleDelete = async (actorId: number) => {
    try {
      const response = await fetch(`/api/actors/${actorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('adminActors.deleteError'));
      }

      message.success(t('adminActors.deleteSuccess'));
      loadActors();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('adminActors.deleteError');
      message.error(errorMessage);
    }
  };

  const handleMerge = async () => {
    if (!mergeTarget || selectedRowKeys.length !== 2) return;
    const sourceId = selectedRowKeys.find((id) => id !== mergeTarget);

    try {
      const response = await fetch('/api/actors/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, targetId: mergeTarget }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('adminActors.mergeError'));
      }
      message.success(t('adminActors.mergeSuccess'));
      setMergeModalOpen(false);
      setSelectedRowKeys([]);
      setMergeTarget(null);
      loadActors();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('adminActors.mergeError');
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
      title: t('adminActors.columnName'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a: ActorAdmin, b: ActorAdmin) => a.name.localeCompare(b.name),
      render: (name: string, record: ActorAdmin) => (
        <Link href={`/actores/${record.id}`}>
          <strong>{name || t('adminActors.unnamed')}</strong>
        </Link>
      ),
    },
    {
      title: t('adminActors.columnStageName'),
      dataIndex: 'stageName',
      key: 'stageName',
      render: (stageName: string | null) => stageName || t('adminActors.emptyValue'),
      responsive: ['md' as const],
    },
    {
      title: t('adminActors.columnNationality'),
      dataIndex: 'nationality',
      key: 'nationality',
      render: (nationality: string | null) =>
        nationality || t('adminActors.emptyValue'),
      responsive: ['md' as const],
    },
    {
      title: t('adminActors.columnSeries'),
      key: 'count',
      render: (record: ActorAdmin) => {
        const seriesCount = record._count?.series || 0;
        const seasonsCount = record._count?.seasons || 0;
        const total = seriesCount + seasonsCount;
        return <Tag color={total > 0 ? 'blue' : 'default'}>{total}</Tag>;
      },
      sorter: (a: ActorAdmin, b: ActorAdmin) => {
        const totalA = (a._count?.series || 0) + (a._count?.seasons || 0);
        const totalB = (b._count?.series || 0) + (b._count?.seasons || 0);
        return totalA - totalB;
      },
    },
    {
      title: t('adminActors.columnActions'),
      key: 'actions',
      render: (record: ActorAdmin) => {
        const total =
          (record._count?.series || 0) + (record._count?.seasons || 0);
        return (
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
              size="small"
            >
              {!isMobile && t('adminActors.actionEdit')}
            </Button>
            <Popconfirm
              title={t('adminActors.deleteTitle')}
              description={
                total > 0
                  ? interpolate(t('adminActors.deleteBlockedDescription'), {
                      count: total,
                    })
                  : t('adminActors.deleteDescription')
              }
              onConfirm={() => handleDelete(record.id)}
              okText={t('adminActors.actionDelete')}
              cancelText={t('adminActors.cancel')}
              okButtonProps={{ danger: true }}
              disabled={total > 0}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                disabled={total > 0}
              >
                {!isMobile && t('adminActors.actionDelete')}
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
          title={t('adminActors.title')}
          subtitle={t('adminActors.subtitle')}
          stats={[
            { label: t('adminActors.statsTotal'), value: actors.length },
            { label: t('adminActors.statsFiltered'), value: filteredActors.length },
            { label: t('adminActors.statsSelected'), value: selectedRowKeys.length },
          ]}
        />

        <AdminTableToolbar
          filters={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              {t('adminActors.newItem')}
            </Button>
          }
          searchPlaceholder={t('adminActors.searchPlaceholder')}
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
            {t('adminActors.mergeSelected')}
          </Button>
        )}

        <Table
          dataSource={filteredActors}
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
            editingActor
              ? t('adminActors.modalEditTitle')
              : t('adminActors.modalNewTitle')
          }
          open={modalOpen}
          onCancel={handleCloseModal}
          onOk={() => form.submit()}
          okText={t('adminActors.save')}
          forceRender
          cancelText={t('adminActors.cancel')}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label={t('adminActors.fieldName')}
              name="name"
              rules={[{ required: true, message: t('adminActors.requiredName') }]}
            >
              <Input placeholder={t('adminActors.hintName')} />
            </Form.Item>

            <Form.Item label={t('adminActors.fieldStageName')} name="stageName">
              <Input placeholder={t('adminActors.hintStageName')} />
            </Form.Item>

            <Form.Item label={t('adminActors.fieldBirthDate')} name="birthDate">
              <Input type="date" />
            </Form.Item>

            <Form.Item label={t('adminActors.fieldNationality')} name="nationality">
              <Input placeholder={t('adminActors.hintNationality')} />
            </Form.Item>

            <Form.Item label={t('adminActors.fieldImageUrl')} name="imageUrl">
              <Input placeholder={t('adminActors.hintImageUrl')} />
            </Form.Item>

            <Form.Item label={t('adminActors.fieldBiography')} name="biography">
              <TextArea rows={3} placeholder={t('adminActors.hintBiography')} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={t('adminActors.mergeModalTitle')}
          open={mergeModalOpen}
          onCancel={() => {
            setMergeModalOpen(false);
            setMergeTarget(null);
          }}
          onOk={handleMerge}
          okText={t('adminActors.mergeSelected')}
          okButtonProps={{ danger: true }}
          cancelText={t('adminActors.cancel')}
        >
          <p style={{ marginBottom: 12 }}>{t('adminActors.mergeSelectSurvivor')}</p>
          <Radio.Group
            value={mergeTarget}
            onChange={(event) => setMergeTarget(event.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {selectedRowKeys.map((id) => {
              const actor = actors.find((item) => item.id === id);
              if (!actor) return null;
              const total =
                (actor._count?.series || 0) + (actor._count?.seasons || 0);

              return (
                <Radio key={String(id)} value={id}>
                  <strong>{actor.name}</strong>{' '}
                  ({interpolate(t('adminActors.participationCount'), { count: total })})
                </Radio>
              );
            })}
          </Radio.Group>
          <Alert
            type="warning"
            message={t('adminActors.mergeWarning')}
            style={{ marginTop: 16 }}
          />
        </Modal>
      </div>
    </AppLayout>
  );
}
