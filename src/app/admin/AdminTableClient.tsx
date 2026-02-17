'use client';

import { useState, useMemo } from 'react';
import { Button, Table, Space, Tag, Modal, Input } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
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

const ALPHABET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function AdminTableClient({ data, countries }: AdminTableClientProps) {
  const message = useMessage();
  const router = useRouter();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSerieId, setSelectedSerieId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    data.forEach((s) => {
      const first = s.titulo.charAt(0).toUpperCase();
      if (/[A-Z]/.test(first)) {
        letters.add(first);
      } else {
        letters.add('#');
      }
    });
    return letters;
  }, [data]);

  const filteredData = useMemo(() => {
    let result = data;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.titulo.toLowerCase().includes(term) ||
          s.pais.toLowerCase().includes(term) ||
          s.tipo.toLowerCase().includes(term)
      );
    }

    if (selectedLetter) {
      if (selectedLetter === '#') {
        result = result.filter((s) => !/^[A-Za-z]/.test(s.titulo));
      } else {
        result = result.filter((s) =>
          s.titulo.toUpperCase().startsWith(selectedLetter)
        );
      }
    }

    return result;
  }, [data, searchTerm, selectedLetter]);

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
          router.refresh();
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
    router.refresh();
  };

  const handleLetterClick = (letter: string) => {
    setSelectedLetter(selectedLetter === letter ? null : letter);
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
      <div className="admin-search-bar">
        <Input
          placeholder="Buscar por título, país o tipo..."
          prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
          className="admin-search-input"
        />
        <span className="admin-result-count">
          {filteredData.length} de {data.length} series
        </span>
      </div>

      <div className="admin-alpha-index">
        {ALPHABET.map((letter) => {
          const hasItems = availableLetters.has(letter);
          const isSelected = selectedLetter === letter;
          return (
            <button
              key={letter}
              className={`admin-alpha-btn${isSelected ? ' admin-alpha-btn--active' : ''}${!hasItems ? ' admin-alpha-btn--disabled' : ''}`}
              onClick={() => hasItems && handleLetterClick(letter)}
              disabled={!hasItems}
            >
              {letter}
            </button>
          );
        })}
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        pagination={{
          pageSize: 20,
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
