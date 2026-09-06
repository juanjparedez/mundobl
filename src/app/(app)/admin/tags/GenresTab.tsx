'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
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
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar/AdminTableToolbar';
import { DataTable } from '@/components/design-system';

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
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<number | null>(null);
  const [merging, setMerging] = useState(false);
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

  const handleMerge = async () => {
    if (!mergeTarget || selectedRowKeys.length < 2) return;
    const sourceIds = selectedRowKeys.filter((id) => id !== mergeTarget);
    setMerging(true);
    try {
      const response = await fetch('/api/genres/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceIds, targetId: mergeTarget }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al fusionar los géneros');
      }
      message.success('Géneros fusionados correctamente');
      setMergeModalOpen(false);
      setSelectedRowKeys([]);
      setMergeTarget(null);
      loadGenres();
      onGenresUpdated?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al fusionar géneros';
      message.error(errorMessage);
    } finally {
      setMerging(false);
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
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddGenre}
              loading={adding}
            >
              {!isMobile && 'Crear Género'}
            </Button>
            {selectedRowKeys.length >= 2 && (
              <Button
                icon={<MergeCellsOutlined />}
                onClick={() => {
                  setMergeTarget(null);
                  setMergeModalOpen(true);
                }}
              >
                Fusionar géneros ({selectedRowKeys.length})
              </Button>
            )}
          </Space>
        }
      />

      <DataTable
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        columns={columns}
        dataSource={filteredGenres}
        rowKey="id"
        loading={loading}
        pageSize={25}
        pageSizeOptions={['10', '25', '50', '100']}
        showTotal={(total) => `${total} géneros en total`}
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

      <Modal
        title="Fusionar Géneros"
        open={mergeModalOpen}
        onOk={handleMerge}
        confirmLoading={merging}
        onCancel={() => {
          setMergeModalOpen(false);
          setMergeTarget(null);
        }}
        okButtonProps={{ disabled: !mergeTarget }}
        okText="Fusionar seleccionados"
        cancelText="Cancelar"
      >
        <Alert
          message="Esta acción moverá todas las series asociadas hacia el género que elijas como principal. Los géneros no seleccionados se eliminarán de forma permanente."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <p style={{ marginBottom: 8, fontWeight: 500 }}>
          Selecciona cuál de los {selectedRowKeys.length} géneros debe
          conservarse:
        </p>
        <Radio.Group
          value={mergeTarget}
          onChange={(e) => setMergeTarget(e.target.value)}
        >
          <Space direction="vertical">
            {selectedRowKeys.map((key) => {
              const genre = genres.find((g) => g.id === key);
              if (!genre) return null;
              return (
                <Radio key={genre.id} value={genre.id}>
                  {genre.name} ({genre._count?.series || 0} series)
                </Radio>
              );
            })}
          </Space>
        </Radio.Group>
      </Modal>
    </div>
  );
}
