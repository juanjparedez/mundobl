'use client';

import { useState } from 'react';
import { Button, Table, Space, Tag, Modal } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { EditSerieModal } from './EditSerieModal';
import { useRouter } from 'next/navigation';
import { useMessage } from '@/hooks/useMessage';

interface SerieData {
  key: string;
  titulo: string;
  pais: string;
  tipo: string;
  temporadas: number;
  episodios: number;
  anio: number;
  estado: string;
  rating: number | null;
}

interface AdminTableClientProps {
  data: SerieData[];
  countries: Array<{ id: number; name: string }>;
}

export function AdminTableClient({ data, countries }: AdminTableClientProps) {
  const message = useMessage();
  const router = useRouter();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSerieId, setSelectedSerieId] = useState<string | null>(null);

  const handleEdit = (record: SerieData) => {
    router.push(`/admin/series/${record.key}/editar`);
  };

  const handleDelete = (record: SerieData) => {
    Modal.confirm({
      title: '¿Estás seguro?',
      icon: <ExclamationCircleOutlined />,
      content: `¿Deseas eliminar la serie "${record.titulo}"? Esta acción no se puede deshacer.`,
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      async onOk() {
        try {
          const response = await fetch(`/api/series/${record.key}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar la serie');
          }

          message.success('Serie eliminada correctamente');
          router.refresh(); // Recargar la página para actualizar la tabla
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Error al eliminar la serie';
          message.error(errorMessage);
          console.error(error);
        }
      },
    });
  };

  const handleEditSuccess = () => {
    router.refresh(); // Recargar la página para actualizar la tabla
  };

  const columns: ColumnsType<SerieData> = [
    {
      title: 'Título',
      dataIndex: 'titulo',
      key: 'titulo',
      sorter: (a, b) => a.titulo.localeCompare(b.titulo),
      width: 300,
    },
    {
      title: 'País',
      dataIndex: 'pais',
      key: 'pais',
      filters: Array.from(new Set(data.map((s) => s.pais)))
        .sort()
        .map((pais) => ({ text: pais, value: pais })),
      onFilter: (value, record) => record.pais === value,
      width: 120,
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo: string) => {
        const colorMap: Record<string, string> = {
          serie: 'blue',
          pelicula: 'purple',
          corto: 'cyan',
          especial: 'orange',
        };
        return <Tag color={colorMap[tipo] || 'default'}>{tipo}</Tag>;
      },
      filters: [
        { text: 'Serie', value: 'serie' },
        { text: 'Película', value: 'pelicula' },
        { text: 'Corto', value: 'corto' },
        { text: 'Especial', value: 'especial' },
      ],
      onFilter: (value, record) => record.tipo === value,
      width: 100,
    },
    {
      title: 'Temporadas',
      dataIndex: 'temporadas',
      key: 'temporadas',
      sorter: (a, b) => a.temporadas - b.temporadas,
      width: 120,
    },
    {
      title: 'Episodios',
      dataIndex: 'episodios',
      key: 'episodios',
      sorter: (a, b) => a.episodios - b.episodios,
      width: 120,
    },
    {
      title: 'Año',
      dataIndex: 'anio',
      key: 'anio',
      sorter: (a, b) => a.anio - b.anio,
      width: 100,
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado: string) => (
        <Tag color={estado === 'activa' ? 'green' : 'default'}>{estado}</Tag>
      ),
      width: 120,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={data}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} de ${total} series`,
        }}
        scroll={{ x: 1200 }}
      />

      <EditSerieModal
        open={editModalOpen}
        serieId={selectedSerieId}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedSerieId(null);
        }}
        onSuccess={handleEditSuccess}
        countries={countries}
      />
    </>
  );
}
