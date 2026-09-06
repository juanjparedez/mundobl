'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Button,
  Input,
  Select,
  Space,
  Avatar,
  Tag,
  Modal,
  Spin,
  Tooltip,
  Badge,
} from 'antd';
import { DataTable, type DataTableColumn } from '@/components/design-system';
import {
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  TagsOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  PlusOutlined,
  MinusOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useMessage } from '@/hooks/useMessage';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface SeriesItem {
  id: number;
  title: string;
  originalTitle: string | null;
  year: number | null;
  type: string;
  imageUrl: string | null;
  imageThumbUrl: string | null;
  origin: string;
  countryName: string | null;
  tags: Array<{ id: number; name: string; category?: string | null }>;
  genres: Array<{ id: number; name: string }>;
}

interface TagOption {
  id: number;
  name: string;
}

interface GenreOption {
  id: number;
  name: string;
}

interface SeriesMetadataTabProps {
  initialFilter?: string;
}

export function SeriesMetadataTab({
  initialFilter = 'all',
}: SeriesMetadataTabProps) {
  const message = useMessage();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>(initialFilter);
  const [origin, setOrigin] = useState<string>('CURATED');

  // Opciones globales para autocompletado en los selects inline y bulk
  const [allTags, setAllTags] = useState<TagOption[]>([]);
  const [allGenres, setAllGenres] = useState<GenreOption[]>([]);

  // Estados de guardado inline
  const [savingId, setSavingId] = useState<number | null>(null);

  // Selección en lote
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkModalType, setBulkModalType] = useState<
    'addTags' | 'removeTags' | 'addGenres' | 'removeGenres' | null
  >(null);
  const [bulkValues, setBulkValues] = useState<string[]>([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Cargar catálogo de tags y géneros para opciones de autocompletado
  const loadOptions = useCallback(async () => {
    try {
      const [tagsRes, genresRes] = await Promise.all([
        fetch('/api/tags'),
        fetch('/api/genres'),
      ]);
      if (tagsRes.ok) {
        const data = await tagsRes.json();
        setAllTags(
          data.map((t: { id: number; name: string }) => ({
            id: t.id,
            name: t.name,
          }))
        );
      }
      if (genresRes.ok) {
        const data = await genresRes.json();
        setAllGenres(
          data.map((g: { id: number; name: string }) => ({
            id: g.id,
            name: g.name,
          }))
        );
      }
    } catch (e) {
      console.error('Error al cargar opciones de tags/géneros:', e);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  // Cargar listado de series
  const loadSeries = useCallback(
    async (
      currentPage = page,
      currentFilter = filter,
      currentOrigin = origin,
      currentSearch = search
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
          filter: currentFilter,
          origin: currentOrigin,
        });
        if (currentSearch.trim()) {
          params.set('q', currentSearch.trim());
        }

        const res = await fetch(
          `/api/admin/series-metadata?${params.toString()}`
        );
        if (!res.ok) throw new Error('Error al cargar series');
        const data = await res.json();
        setSeries(data.series);
        setTotal(data.total);
      } catch (e) {
        message.error('Error al cargar las series');
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [message, page, pageSize, filter, origin, search]
  );

  useEffect(() => {
    loadSeries(1, filter, origin, search);
    setPage(1);
  }, [filter, origin, search, loadSeries]);

  // Guardado inline de tags de una serie
  const handleUpdateTags = async (seriesId: number, newTagNames: string[]) => {
    setSavingId(seriesId);
    try {
      const res = await fetch('/api/admin/series-metadata', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesId, tags: newTagNames }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al guardar');
      }

      const updated = await res.json();
      setSeries((prev) =>
        prev.map((s) => (s.id === seriesId ? { ...s, tags: updated.tags } : s))
      );
      message.success('Tags actualizados');
      loadOptions(); // Actualizar catálogo por si se crearon tags nuevos
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSavingId(null);
    }
  };

  // Guardado inline de géneros de una serie
  const handleUpdateGenres = async (
    seriesId: number,
    newGenreNames: string[]
  ) => {
    setSavingId(seriesId);
    try {
      const res = await fetch('/api/admin/series-metadata', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesId, genres: newGenreNames }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al guardar');
      }

      const updated = await res.json();
      setSeries((prev) =>
        prev.map((s) =>
          s.id === seriesId ? { ...s, genres: updated.genres } : s
        )
      );
      message.success('Géneros actualizados');
      loadOptions();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSavingId(null);
    }
  };

  // Ejecución de operación en lote (Bulk)
  const handleBulkSubmit = async () => {
    if (
      !bulkModalType ||
      bulkValues.length === 0 ||
      selectedRowKeys.length === 0
    ) {
      setBulkModalType(null);
      return;
    }

    setBulkSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        seriesIds: selectedRowKeys,
      };

      if (bulkModalType === 'addTags') payload.addTags = bulkValues;
      if (bulkModalType === 'removeTags') payload.removeTags = bulkValues;
      if (bulkModalType === 'addGenres') payload.addGenres = bulkValues;
      if (bulkModalType === 'removeGenres') payload.removeGenres = bulkValues;

      const res = await fetch('/api/admin/series-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error en acción masiva');
      }

      message.success(`Operación aplicada a ${selectedRowKeys.length} series`);
      setBulkModalType(null);
      setBulkValues([]);
      setSelectedRowKeys([]);
      loadSeries(page, filter, origin, search);
      loadOptions();
    } catch (e) {
      message.error(
        e instanceof Error ? e.message : 'Error en operación masiva'
      );
    } finally {
      setBulkSubmitting(false);
    }
  };

  const tagOptions = useMemo(() => {
    return allTags.map((t) => ({ label: t.name, value: t.name }));
  }, [allTags]);

  const genreOptions = useMemo(() => {
    return allGenres.map((g) => ({ label: g.name, value: g.name }));
  }, [allGenres]);

  const columns: DataTableColumn<SeriesItem>[] = [
    {
      title: '',
      dataIndex: 'imageUrl',
      width: 50,
      render: (_, row) => (
        <Avatar
          shape="square"
          size={44}
          src={row.imageThumbUrl || row.imageUrl || undefined}
        >
          {row.title.charAt(0)}
        </Avatar>
      ),
    },
    {
      title: 'Serie',
      dataIndex: 'title',
      width: 220,
      render: (title: string, row) => (
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontWeight: 600 }}>
            <Link
              href={`/series/${row.id}`}
              target="_blank"
              style={{ color: 'inherit' }}
            >
              {title}
            </Link>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted, #888)' }}>
            {row.year ?? '—'} · {row.countryName ?? '—'}
            {row.origin === 'USER_EMBED' && (
              <Tag color="purple" style={{ marginLeft: 6, fontSize: 10 }}>
                Colaborador
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Etiquetas (Tags)',
      dataIndex: 'tags',
      render: (_, row) => {
        const isSaving = savingId === row.id;
        const currentTagNames = row.tags.map((t) => t.name);

        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              width: '100%',
            }}
          >
            <Select
              mode="tags"
              style={{ width: '100%', minWidth: 200 }}
              placeholder="+ Agregar tags (escribe o elige)"
              value={currentTagNames}
              onChange={(newTags) => handleUpdateTags(row.id, newTags)}
              options={tagOptions}
              tokenSeparators={[',']}
              disabled={isSaving}
              maxTagCount="responsive"
            />
            {isSaving && <Spin size="small" />}
          </div>
        );
      },
    },
    {
      title: 'Géneros',
      dataIndex: 'genres',
      width: 260,
      render: (_, row) => {
        const isSaving = savingId === row.id;
        const currentGenreNames = row.genres.map((g) => g.name);

        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              width: '100%',
            }}
          >
            <Select
              mode="tags"
              style={{ width: '100%', minWidth: 160 }}
              placeholder="+ Géneros"
              value={currentGenreNames}
              onChange={(newGenres) => handleUpdateGenres(row.id, newGenres)}
              options={genreOptions}
              disabled={isSaving}
              maxTagCount="responsive"
            />
            {isSaving && <Spin size="small" />}
          </div>
        );
      },
    },
    {
      title: 'Acciones',
      width: 80,
      align: 'center',
      render: (_, row) => (
        <Space size="small">
          <Tooltip title="Ver ficha en la web">
            <Link href={`/series/${row.id}`} target="_blank">
              <Button size="small" icon={<EyeOutlined />} />
            </Link>
          </Tooltip>
          <Tooltip title="Editar serie completa">
            <Link href={`/admin/series/${row.id}/editar`} target="_blank">
              <Button size="small" icon={<EditOutlined />} />
            </Link>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="series-metadata-tab">
      {/* Pills de auditoría rápida */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 16,
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-muted, #888)',
          }}
        >
          <FilterOutlined style={{ marginRight: 4 }} /> Filtros de auditoría:
        </span>
        <Button
          size="small"
          type={filter === 'all' ? 'primary' : 'default'}
          onClick={() => setFilter('all')}
        >
          Todas las series
        </Button>
        <Button
          size="small"
          type={filter === 'missing_tags' ? 'primary' : 'default'}
          danger={filter === 'missing_tags'}
          icon={<WarningOutlined />}
          onClick={() => setFilter('missing_tags')}
        >
          Sin etiquetas (0 tags)
        </Button>
        <Button
          size="small"
          type={filter === 'few_tags' ? 'primary' : 'default'}
          onClick={() => setFilter('few_tags')}
        >
          Pocas etiquetas (&lt; 3)
        </Button>
        <Button
          size="small"
          type={filter === 'missing_genres' ? 'primary' : 'default'}
          onClick={() => setFilter('missing_genres')}
        >
          Sin géneros (0)
        </Button>
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={() => {
            loadSeries(page, filter, origin, search);
            loadOptions();
          }}
        >
          Refrescar
        </Button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 10,
            flex: 1,
            minWidth: 280,
            maxWidth: 450,
          }}
        >
          <Input
            placeholder="Buscar por título de serie..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Select
            value={origin}
            onChange={setOrigin}
            style={{ width: 200 }}
            options={[
              { value: 'CURATED', label: 'Catálogo Curado (Flor)' },
              { value: 'ALL', label: 'Todos los orígenes' },
              { value: 'USER_EMBED', label: 'Aportes de Colaboradores' },
            ]}
          />
        </div>
      </div>

      {/* Barra de acciones en lote (Bulk Actions) */}
      {selectedRowKeys.length > 0 && (
        <div
          style={{
            background: 'var(--bg-elevated, #1f1f1f)',
            border: '1px solid var(--border-color, #333)',
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 16,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 600 }}>
            <Badge
              count={selectedRowKeys.length}
              style={{ backgroundColor: '#1890ff', marginRight: 8 }}
            />
            series seleccionadas
          </div>
          <Space wrap>
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                setBulkValues([]);
                setBulkModalType('addTags');
              }}
            >
              Agregar Tags
            </Button>
            <Button
              size="small"
              icon={<MinusOutlined />}
              onClick={() => {
                setBulkValues([]);
                setBulkModalType('removeTags');
              }}
            >
              Quitar Tags
            </Button>
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                setBulkValues([]);
                setBulkModalType('addGenres');
              }}
            >
              Agregar Géneros
            </Button>
            <Button
              size="small"
              icon={<MinusOutlined />}
              onClick={() => {
                setBulkValues([]);
                setBulkModalType('removeGenres');
              }}
            >
              Quitar Géneros
            </Button>
            <Button
              size="small"
              type="link"
              onClick={() => setSelectedRowKeys([])}
            >
              Deseleccionar
            </Button>
          </Space>
        </div>
      )}

      {/* Tabla principal */}
      <DataTable
        rowKey="id"
        columns={columns}
        dataSource={series}
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        pageSize={pageSize}
        page={page}
        total={total}
        onPageChange={(p, ps) => {
          setPage(p);
          setPageSize(ps);
          loadSeries(p, filter, origin, search);
        }}
        pageSizeOptions={['15', '25', '50', '100']}
        showTotal={(t) => `${t} series en total`}
      />

      {/* Modal de acciones en lote */}
      <Modal
        title={
          bulkModalType === 'addTags'
            ? `Agregar Tags a ${selectedRowKeys.length} series`
            : bulkModalType === 'removeTags'
              ? `Quitar Tags de ${selectedRowKeys.length} series`
              : bulkModalType === 'addGenres'
                ? `Agregar Géneros a ${selectedRowKeys.length} series`
                : `Quitar Géneros de ${selectedRowKeys.length} series`
        }
        open={bulkModalType !== null}
        onOk={handleBulkSubmit}
        confirmLoading={bulkSubmitting}
        onCancel={() => {
          setBulkModalType(null);
          setBulkValues([]);
        }}
        okText="Aplicar en lote"
        cancelText="Cancelar"
      >
        <p style={{ marginBottom: 12 }}>
          {bulkModalType?.includes('add')
            ? 'Los elementos seleccionados se sumarán a las series sin borrar los que ya tengan.'
            : 'Los elementos seleccionados se removerán únicamente de las series que los contengan.'}
        </p>
        <Select
          mode="tags"
          style={{ width: '100%' }}
          placeholder={
            bulkModalType?.includes('Tags')
              ? 'Selecciona o escribe tags...'
              : 'Selecciona o escribe géneros...'
          }
          value={bulkValues}
          onChange={setBulkValues}
          options={bulkModalType?.includes('Tags') ? tagOptions : genreOptions}
          tokenSeparators={[',']}
        />
      </Modal>
    </div>
  );
}
