'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { Card, Table, Button, Input, Popconfirm, Space, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';

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
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
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
  };

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
    } catch (error: any) {
      message.error(error.message || 'Error al crear el tag');
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
        <Popconfirm
          title="¿Eliminar tag?"
          description={`Esto eliminará el tag de ${record._count?.series || 0} series`}
          onConfirm={() => handleDeleteTag(record.id)}
          okText="Eliminar"
          cancelText="Cancelar"
          okButtonProps={{ danger: true }}
        >
          <Button danger icon={<DeleteOutlined />} size="small">
            Eliminar
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <AppLayout>
      <div style={{ padding: '24px' }}>
        <Card title="🏷️ Administración de Tags">
          <Space.Compact style={{ width: '100%', marginBottom: 24 }}>
            <Input
              placeholder="Nombre del nuevo tag (ej: Enemy to Lovers)"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onPressEnter={handleAddTag}
              size="large"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddTag}
              loading={adding}
              size="large"
            >
              Crear Tag
            </Button>
          </Space.Compact>

          <Table
            dataSource={tags}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </Card>
      </div>
    </AppLayout>
  );
}
