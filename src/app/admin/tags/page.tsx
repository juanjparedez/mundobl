'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import {
  Card,
  Table,
  Button,
  Input,
  Popconfirm,
  Space,
  Tag,
  Modal,
  Form,
  Radio,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  MergeCellsOutlined,
} from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AdminNav } from '../AdminNav';
import '../admin.css';

interface TagType {
  id: number;
  name: string;
  category?: string | null;
  _count?: {
    series: number;
  };
}

export default function TagsAdminPage() {
  const message = useMessage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<number | null>(null);
  const [form] = Form.useForm();

  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('Error al cargar tags');
      const data = await response.json();
      setTags(data);
    } catch (error) {
      message.error('Error al cargar los tags');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      message.warning('Escribe un nombre para el tag');
      return;
    }

    setAdding(true);
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim(), category: 'trope' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear tag');
      }

      message.success('Tag creado exitosamente');
      setNewTagName('');
      loadTags();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al crear el tag';
      message.error(errorMessage);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar tag');

      message.success('Tag eliminado correctamente');
      loadTags();
    } catch (error) {
      message.error('Error al eliminar el tag');
      console.error(error);
    }
  };

  const handleEditTag = async (values: Record<string, unknown>) => {
    if (!editingTag) return;
    try {
      const response = await fetch(`/api/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar');
      }

      message.success('Tag actualizado exitosamente');
      setEditModalOpen(false);
      setEditingTag(null);
      form.resetFields();
      loadTags();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al actualizar el tag';
      message.error(errorMessage);
    }
  };

  const handleMerge = async () => {
    if (!mergeTarget || selectedRowKeys.length !== 2) return;
    const sourceId = selectedRowKeys.find((id) => id !== mergeTarget);
    try {
      const response = await fetch('/api/tags/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, targetId: mergeTarget }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al fusionar');
      }
      message.success('Tags fusionados exitosamente');
      setMergeModalOpen(false);
      setSelectedRowKeys([]);
      setMergeTarget(null);
      loadTags();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al fusionar tags';
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
      title: 'Tag',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Tag color="blue">{name}</Tag>,
    },
    {
      title: 'Categoría',
      dataIndex: 'category',
      key: 'category',
      render: (category: string | null) => category || 'Sin categoría',
      responsive: ['md' as const],
    },
    {
      title: 'Series',
      key: 'count',
      render: (record: TagType) => record._count?.series || 0,
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (record: TagType) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingTag(record);
              form.setFieldsValue(record);
              setEditModalOpen(true);
            }}
          >
            {!isMobile && 'Editar'}
          </Button>
          <Popconfirm
            title="¿Eliminar tag?"
            description={`Esto eliminará el tag de ${record._count?.series || 0} series`}
            onConfirm={() => handleDeleteTag(record.id)}
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
        <Card title="🏷️ Administración de Tags">
          <Space.Compact style={{ width: '100%', marginBottom: 24 }}>
            <Input
              placeholder="Nombre del nuevo tag (ej: Enemy to Lovers)"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onPressEnter={handleAddTag}
              size={isMobile ? 'middle' : 'large'}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddTag}
              loading={adding}
              size={isMobile ? 'middle' : 'large'}
            >
              Crear Tag
            </Button>
          </Space.Compact>

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
              Fusionar seleccionados
            </Button>
          )}

          <Table
            dataSource={tags}
            columns={columns}
            rowKey="id"
            loading={loading}
            rowSelection={rowSelection}
            pagination={{ pageSize: 20 }}
          />
        </Card>

        <Modal
          title="Editar Tag"
          open={editModalOpen}
          onCancel={() => {
            setEditModalOpen(false);
            setEditingTag(null);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          okText="Guardar"
          cancelText="Cancelar"
          forceRender
        >
          <Form form={form} layout="vertical" onFinish={handleEditTag}>
            <Form.Item
              label="Nombre"
              name="name"
              rules={[{ required: true, message: 'El nombre es requerido' }]}
            >
              <Input placeholder="Nombre del tag" />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Fusionar Tags"
          open={mergeModalOpen}
          onCancel={() => {
            setMergeModalOpen(false);
            setMergeTarget(null);
          }}
          onOk={handleMerge}
          okText="Fusionar"
          okButtonProps={{ danger: true }}
          cancelText="Cancelar"
        >
          <p style={{ marginBottom: 12 }}>
            Selecciona qué tag debe sobrevivir:
          </p>
          <Radio.Group
            value={mergeTarget}
            onChange={(e) => setMergeTarget(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {selectedRowKeys.map((id) => {
              const tag = tags.find((t) => t.id === id);
              if (!tag) return null;
              return (
                <Radio key={String(id)} value={id}>
                  <Tag color="blue">{tag.name}</Tag> ({tag._count?.series || 0}{' '}
                  series)
                </Radio>
              );
            })}
          </Radio.Group>
          <Alert
            type="warning"
            title="El tag no seleccionado será eliminado y todas las series que lo tenían pasarán a usar el tag que sobreviva."
            style={{ marginTop: 16 }}
          />
        </Modal>
      </div>
    </AppLayout>
  );
}
