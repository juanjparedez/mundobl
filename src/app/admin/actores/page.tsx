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
import type { ActorAdmin } from '@/types/person.types';
import { AdminNav } from '../AdminNav';
import '../admin.css';

const { TextArea } = Input;
const ALPHABET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function ActoresAdminPage() {
  const message = useMessage();
  const isMobile = useMediaQuery('(max-width: 768px)');
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
      message.error('Error al cargar los actores');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [message]);

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
        (a) =>
          a.name.toLowerCase().includes(term) ||
          a.stageName?.toLowerCase().includes(term) ||
          a.nationality?.toLowerCase().includes(term)
      );
    }

    if (selectedLetter) {
      filtered = filtered.filter((a) => {
        const first = a.name.charAt(0).toUpperCase();
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
      const url = editingActor
        ? `/api/actors/${editingActor.id}`
        : '/api/actors';
      const method = editingActor ? 'PUT' : 'POST';

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
        editingActor
          ? 'Actor actualizado exitosamente'
          : 'Actor creado exitosamente'
      );
      handleCloseModal();
      loadActors();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al guardar el actor';
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
        throw new Error(error.error || 'Error al eliminar');
      }

      message.success('Actor eliminado correctamente');
      loadActors();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al eliminar el actor';
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
        throw new Error(error.error || 'Error al fusionar');
      }
      message.success('Actores fusionados exitosamente');
      setMergeModalOpen(false);
      setSelectedRowKeys([]);
      setMergeTarget(null);
      loadActors();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al fusionar actores';
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
      sorter: (a: ActorAdmin, b: ActorAdmin) => a.name.localeCompare(b.name),
      render: (name: string, record: ActorAdmin) => (
        <Link href={`/actores/${record.id}`}>
          <strong>{name}</strong>
        </Link>
      ),
    },
    {
      title: 'Nombre Artístico',
      dataIndex: 'stageName',
      key: 'stageName',
      render: (stageName: string | null) => stageName || '-',
      responsive: ['md' as const],
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
      title: 'Acciones',
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
              {!isMobile && 'Editar'}
            </Button>
            <Popconfirm
              title="¿Eliminar actor?"
              description={
                total > 0
                  ? `Este actor tiene ${total} participaciones. Primero desvincúlalo.`
                  : '¿Estás seguro de eliminar este actor?'
              }
              onConfirm={() => handleDelete(record.id)}
              okText="Eliminar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
              disabled={total > 0}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                disabled={total > 0}
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
          title="👥 Administración de Actores"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              Nuevo Actor
            </Button>
          }
        >
          <div className="admin-search-bar">
            <Input
              className="admin-search-input"
              placeholder="Buscar por nombre, nombre artístico o nacionalidad..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
            <span className="admin-result-count">
              {filteredActors.length} de {actors.length} actores
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
        </Card>

        <Modal
          title={editingActor ? 'Editar Actor' : 'Nuevo Actor'}
          open={modalOpen}
          onCancel={handleCloseModal}
          onOk={() => form.submit()}
          okText="Guardar"
          forceRender
          cancelText="Cancelar"
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Nombre"
              name="name"
              rules={[{ required: true, message: 'El nombre es requerido' }]}
            >
              <Input placeholder="Nombre del actor" />
            </Form.Item>

            <Form.Item label="Nombre Artístico" name="stageName">
              <Input placeholder="Nombre artístico (opcional)" />
            </Form.Item>

            <Form.Item label="Fecha de Nacimiento" name="birthDate">
              <Input type="date" />
            </Form.Item>

            <Form.Item label="Nacionalidad" name="nationality">
              <Input placeholder="Ej: Tailandia, Corea del Sur" />
            </Form.Item>

            <Form.Item label="URL de Imagen" name="imageUrl">
              <Input placeholder="URL de la foto del actor (opcional)" />
            </Form.Item>

            <Form.Item label="Biografía" name="biography">
              <TextArea
                rows={3}
                placeholder="Breve biografía del actor (opcional)"
              />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Fusionar Actores"
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
            Selecciona qué actor debe sobrevivir:
          </p>
          <Radio.Group
            value={mergeTarget}
            onChange={(e) => setMergeTarget(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {selectedRowKeys.map((id) => {
              const actor = actors.find((a) => a.id === id);
              if (!actor) return null;
              const total =
                (actor._count?.series || 0) + (actor._count?.seasons || 0);
              return (
                <Radio key={String(id)} value={id}>
                  <strong>{actor.name}</strong> ({total} participaciones)
                </Radio>
              );
            })}
          </Radio.Group>
          <Alert
            type="warning"
            title="El actor no seleccionado será eliminado y todas sus referencias se moverán al actor que sobreviva."
            style={{ marginTop: 16 }}
          />
        </Modal>
      </div>
    </AppLayout>
  );
}
