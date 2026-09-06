'use client';

import { useState, useMemo } from 'react';
import { Button, Space, Tag, Input, Select } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { DataTable, type DataTableColumn } from '@/components/design-system';
import { EditSerieModal } from './EditSerieModal';
import { useRouter } from 'next/navigation';
import { useMessage, useModal } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';

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
  generos?: string[];
}

interface AdminTableClientProps {
  data: SerieData[];
  countries: Array<{ id: number; name: string }>;
  genres?: Array<{ id: number; name: string }>;
}

const ALPHABET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function AdminTableClient({
  data,
  countries,
  genres = [],
}: AdminTableClientProps) {
  const message = useMessage();
  const modal = useModal();
  const router = useRouter();
  const { t } = useLocale();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSerieId, setSelectedSerieId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
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

    if (selectedGenre) {
      result = result.filter((s) => s.generos?.includes(selectedGenre));
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
  }, [data, searchTerm, selectedGenre, selectedLetter]);

  const handleEdit = (record: SerieData) => {
    router.push(`/admin/series/${record.key}/editar`);
  };

  const handleDelete = (record: SerieData) => {
    modal.confirm({
      title: t('adminTable.deleteConfirmTitle'),
      icon: <ExclamationCircleOutlined />,
      content: interpolateMessage(t('adminTable.deleteConfirmContent'), {
        titulo: record.titulo,
      }),
      okText: t('adminTable.deleteConfirmOk'),
      okType: 'danger',
      cancelText: t('adminTable.deleteConfirmCancel'),
      async onOk() {
        try {
          const response = await fetch(`/api/series/${record.key}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar la serie');
          }

          message.success(t('adminTable.deleteSuccess'));
          router.refresh();
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : t('adminTable.deleteError');
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

  const columns: DataTableColumn<SerieData>[] = [
    {
      title: t('adminTable.columnTitle'),
      dataIndex: 'titulo',
      key: 'titulo',
      sorter: (a, b) => a.titulo.localeCompare(b.titulo),
      width: 300,
      mobile: 'title',
    },
    {
      title: t('adminTable.columnCountry'),
      dataIndex: 'pais',
      key: 'pais',
      filters: Array.from(new Set(data.map((s) => s.pais)))
        .sort()
        .map((pais) => ({ text: pais, value: pais })),
      onFilter: (value, record) => record.pais === value,
      width: 120,
      mobile: 'body',
    },
    {
      title: t('adminTable.columnType'),
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
      mobile: 'meta',
    },
    {
      title: t('adminTable.columnSeasons'),
      dataIndex: 'temporadas',
      key: 'temporadas',
      sorter: (a, b) => a.temporadas - b.temporadas,
      width: 120,
      mobile: 'body',
    },
    {
      title: t('adminTable.columnEpisodes'),
      dataIndex: 'episodios',
      key: 'episodios',
      sorter: (a, b) => a.episodios - b.episodios,
      width: 120,
      mobile: 'body',
    },
    {
      title: t('adminTable.columnYear'),
      dataIndex: 'anio',
      key: 'anio',
      sorter: (a, b) => a.anio - b.anio,
      width: 100,
      mobile: 'body',
    },
    {
      title: t('adminTable.columnStatus'),
      dataIndex: 'estado',
      key: 'estado',
      render: (estado: string) => (
        <Tag color={estado === 'activa' ? 'green' : 'default'}>{estado}</Tag>
      ),
      width: 120,
      mobile: 'meta',
    },
    {
      title: t('adminTable.columnActions'),
      key: 'acciones',
      width: 120,
      fixed: 'right',
      mobile: 'actions',
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
          placeholder={t('adminTable.searchPlaceholder')}
          prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
          className="admin-search-input"
        />
        {genres.length > 0 && (
          <Select
            placeholder="Filtrar por género"
            allowClear
            value={selectedGenre}
            onChange={(val) => setSelectedGenre(val ?? null)}
            style={{ minWidth: 170 }}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={genres.map((g) => ({ label: g.name, value: g.name }))}
          />
        )}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/admin/series/nueva')}
          style={{ marginLeft: 'auto' }}
        >
          Nueva Serie
        </Button>
        <span className="admin-result-count">
          {interpolateMessage(t('adminTable.resultCount'), {
            filtered: String(filteredData.length),
            total: String(data.length),
          })}
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

      <DataTable
        columns={columns}
        dataSource={filteredData}
        rowKey="key"
        scrollX={1200}
        showTotal={(total, range) =>
          interpolateMessage(t('adminTable.paginationTotal'), {
            from: String(range[0]),
            to: String(range[1]),
            total: String(total),
          })
        }
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
