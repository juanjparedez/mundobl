'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Popconfirm,
  Space,
  Tag,
  Modal,
  Form,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar/AdminTableToolbar';

export interface GenreType {
  id: number;
  name: string;
  _count?: {
    series: number;
  };
}

interface GenresTabProps {
  onGenresUpdated?: () => void;
}

export function GenresTab({ onGenresUpdated }: GenresTabProps) {
  const message = useMessage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [genres, setGenres] = useState<GenreType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newGenreName, setNewGenreName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<GenreType | null>(null);
  const [form] = Form.useForm();

  const loadGenres = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/genres');
      if (!response.ok) throw new Error('Error al cargar géneros');
      const data = await response.json();
      setGenres(data);
    } catch (error) {
      message.error('Error al cargar los géneros');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadGenres();
  }, [loadGenres]);

  const filteredGenres = useMemo(() => {
    if (!searchTerm.trim()) return genres;
    const term = searchTerm.toLowerCase();
    return genres.filter((genre) => genre.name.toLowerCase().includes(term));
  }, [genres, searchTerm]);

  const handleAddGenre = async () => {
    if (!newGenreName.trim()) {
      message.warning('Escribe un nombre para el género');
      return;
    }

    setAdding(true);
    try {
      const response = await fetch('/api/genres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGenreName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear género');
      }

      message.success('Género creado correctamente');
      setNewGenreName('');
      loadGenres();
      onGenresUpdated?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al crear género';
      message.error(errorMessage);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteGenre = async (genreId: number) => {
    try {
      const response = await fetch(`/api/genres/${genreId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al eliminar el género');
      }

      message.success('Género eliminado');
      loadGenres();
      onGenresUpdated?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al eliminar el género';
      message.error(errorMessage);
    }
  };

  const handleEditGenre = async (values: { name: string }) => {
    if (!editingGenre) return;
    try {
      const response = await fetch(`/api/genres/${editingGenre.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar género');
      }

      message.success('Género actualizado correctamente');
      setEditModalOpen(false);
      setEditingGenre(null);
      form.resetFields();
      loadGenres();
      onGenresUpdated?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al actualizar el género';
      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: 'Género',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: GenreType, b: GenreType) => a.name.localeCompare(b.name),
      render: (name: string) => (
        <Tag color="cyan" style={{ fontSize: 13, padding: '4px 10px' }}>
          {name}
        </Tag>
      ),
    },
    {
      title: 'Series Curadas',
      key: 'count',
      sorter: (a: GenreType, b: GenreType) =>
        (a._count?.series || 0) - (b._count?.series || 0),
      render: (record: GenreType) => <Tag>{record._count?.series || 0}</Tag>,
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (record: GenreType) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingGenre(record);
              form.setFieldsValue({ name: record.name });
              setEditModalOpen(true);
            }}
          >
            {!isMobile && 'Editar'}
          </Button>
          <Popconfirm
            title={`¿Eliminar género "${record.name}"?`}
            description={`Se desvinculará de las ${record._count?.series || 0} series asociadas.`}
            onConfirm={() => handleDeleteGenre(record.id)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button icon={<DeleteOutlined />} size="small" danger>
              {!isMobile && 'Eliminar'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="genres-tab">
      <AdminTableToolbar
        filters={
          <Input
            placeholder="Nuevo género (ej: Drama)"
            value={newGenreName}
            onChange={(e) => setNewGenreName(e.target.value)}
            onPressEnter={handleAddGenre}
            style={{ minWidth: isMobile ? 180 : 260 }}
          />
        }
        searchPlaceholder="Buscar géneros..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={() => undefined}
        onSearchClear={() => setSearchTerm('')}
        rightActions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddGenre}
            loading={adding}
          >
            {!isMobile && 'Crear Género'}
          </Button>
        }
      />

      <Table
        columns={columns}
        dataSource={filteredGenres}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 25,
          showSizeChanger: true,
          pageSizeOptions: ['10', '25', '50', '100'],
          showTotal: (total) => `${total} géneros en total`,
        }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title="Editar Género"
        open={editModalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingGenre(null);
          form.resetFields();
        }}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={handleEditGenre}>
          <Form.Item
            name="name"
            label="Nombre del Género"
            rules={[{ required: true, message: 'El nombre es requerido' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
