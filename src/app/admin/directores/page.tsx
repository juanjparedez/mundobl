'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Radio,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  MergeCellsOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useMessage } from '@/hooks/useMessage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { DirectorAdmin } from '@/types/person.types';
import { AdminNav } from '../AdminNav';
import '../admin.css';

const { TextArea } = Input;
const ALPHABET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function DirectoresAdminPage() {
  const message = useMessage();
  const isMobile = useMediaQuery('(max-width: 768px)');
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
      message.error('Error al cargar los directores');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [message]);

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
        (d) =>
          d.name.toLowerCase().includes(term) ||
          d.nationality?.toLowerCase().includes(term)
      );
    }

    if (selectedLetter) {
      filtered = filtered.filter((d) => {
        const first = d.name.charAt(0).toUpperCase();
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
        throw new Error(error.error || 'Error al guardar');
      }

      message.success(
        editingDirector
          ? 'Director actualizado exitosamente'
          : 'Director creado exitosamente'
      );
      handleCloseModal();
      loadDirectors();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al guardar el director';
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
        throw new Error(error.error || 'Error al eliminar');
      }

      message.success('Director eliminado correctamente');
      loadDirectors();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al eliminar el director';
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
        throw new Error(error.error || 'Error al fusionar');
      }
      message.success('Directores fusionados exitosamente');
      setMergeModalOpen(false);
      setSelectedRowKeys([]);
      setMergeTarget(null);
      loadDirectors();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al fusionar directores';
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
      title: 'Nombre',
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
      title: 'Nacionalidad',
      dataIndex: 'nationality',
      key: 'nationality',
      render: (nationality: string | null) => nationality || '-',
      responsive: ['md' as const],
    },
    {
      title: 'Series',
      key: 'count',
      render: (record: DirectorAdmin) => {
        const count = record._count?.series || 0;
        return <Tag color={count > 0 ? 'blue' : 'default'}>{count}</Tag>;
      },
      sorter: (a: DirectorAdmin, b: DirectorAdmin) =>
        (a._count?.series || 0) - (b._count?.series || 0),
    },
    {
      title: 'Acciones',
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
              {!isMobile && 'Editar'}
            </Button>
            <Popconfirm
              title="¿Eliminar director?"
              description={
                count > 0
                  ? `Este director tiene ${count} series. Primero desvincúlalo.`
                  : '¿Estás seguro de eliminar este director?'
              }
              onConfirm={() => handleDelete(record.id)}
              okText="Eliminar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
              disabled={count > 0}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                disabled={count > 0}
              >
                {!isMobile && 'Eliminar'}
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
        <Card
          title="🎬 Administración de Directores"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              Nuevo Director
            </Button>
          }
        >
          <div className="admin-search-bar">
            <Input
              className="admin-search-input"
              placeholder="Buscar por nombre o nacionalidad..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
            <span className="admin-result-count">
              {filteredDirectors.length} de {directors.length} directores
            </span>
          </div>

          <div className="admin-alpha-index">
            {ALPHABET.map((letter) => {
              const isAvailable = availableLetters.has(letter);
              const isActive = selectedLetter === letter;
              return (
                <button
                  key={letter}
                  className={`admin-alpha-btn ${isActive ? 'admin-alpha-btn--active' : ''} ${!isAvailable ? 'admin-alpha-btn--disabled' : ''}`}
                  disabled={!isAvailable}
                  onClick={() => setSelectedLetter(isActive ? null : letter)}
                >
                  {letter}
                </button>
              );
            })}
          </div>

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
        </Card>

        <Modal
          title={editingDirector ? 'Editar Director' : 'Nuevo Director'}
          open={modalOpen}
          onCancel={handleCloseModal}
          forceRender
          onOk={() => form.submit()}
          okText="Guardar"
          cancelText="Cancelar"
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Nombre"
              name="name"
              rules={[{ required: true, message: 'El nombre es requerido' }]}
            >
              <Input placeholder="Nombre del director" />
            </Form.Item>

            <Form.Item label="Nacionalidad" name="nationality">
              <Input placeholder="Ej: Tailandia, Corea del Sur" />
            </Form.Item>

            <Form.Item label="URL de Imagen" name="imageUrl">
              <Input placeholder="URL de la foto del director (opcional)" />
            </Form.Item>

            <Form.Item label="Biografía" name="biography">
              <TextArea
                rows={3}
                placeholder="Breve biografía del director (opcional)"
              />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Fusionar Directores"
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
            Selecciona qué director debe sobrevivir:
          </p>
          <Radio.Group
            value={mergeTarget}
            onChange={(e) => setMergeTarget(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {selectedRowKeys.map((id) => {
              const director = directors.find((d) => d.id === id);
              if (!director) return null;
              return (
                <Radio key={String(id)} value={id}>
                  <strong>{director.name}</strong> (
                  {director._count?.series || 0} series)
                </Radio>
              );
            })}
          </Radio.Group>
          <Alert
            type="warning"
            title="El director no seleccionado será eliminado y todas sus referencias se moverán al director que sobreviva."
            style={{ marginTop: 16 }}
          />
        </Modal>
      </div>
    </AppLayout>
  );
}
