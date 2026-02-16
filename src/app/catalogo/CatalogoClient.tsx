'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Row,
  Col,
  Empty,
  Tag,
  Input,
  Select,
  Button,
  Pagination,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  PlusOutlined,
  StarOutlined,
  StarFilled,
  EyeOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';

const { Option } = Select;

interface SerieData {
  id: string;
  titulo: string;
  pais: string;
  tipo: string;
  temporadas: number;
  episodios: number;
  anio: number;
  rating: number | null;
  observaciones: string | null;
  imageUrl?: string | null;
  synopsis?: string | null;
  visto?: boolean;
  isFavorite?: boolean;
}

interface CatalogoClientProps {
  series: SerieData[];
}

const PAGE_SIZE_OPTIONS = [24, 48, 96];
const DEFAULT_PAGE_SIZE = 48;

const getGradientByType = (tipo: string): string => {
  const gradients: Record<string, string> = {
    serie:
      'linear-gradient(135deg, rgba(47, 84, 235, 0.7) 0%, rgba(104, 109, 224, 0.8) 100%)',
    pelicula:
      'linear-gradient(135deg, rgba(235, 47, 150, 0.7) 0%, rgba(184, 50, 128, 0.8) 100%)',
    corto:
      'linear-gradient(135deg, rgba(19, 194, 194, 0.7) 0%, rgba(65, 105, 225, 0.8) 100%)',
    especial:
      'linear-gradient(135deg, rgba(250, 140, 22, 0.7) 0%, rgba(245, 89, 62, 0.8) 100%)',
  };
  return gradients[tipo] || gradients['serie'];
};

export function CatalogoClient({ series: initialSeries }: CatalogoClientProps) {
  const router = useRouter();
  const message = useMessage();

  const [series, setSeries] = useState<SerieData[]>(initialSeries);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>();
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [selectedViewed, setSelectedViewed] = useState<string | undefined>();
  const [selectedFavorite, setSelectedFavorite] = useState<string | undefined>();
  const [minRating, setMinRating] = useState(0);
  const [yearFrom, setYearFrom] = useState<number | undefined>();
  const [yearTo, setYearTo] = useState<number | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filtersVisible, setFiltersVisible] = useState(true);

  const countries = useMemo(() => {
    const uniqueCountries = Array.from(
      new Set(series.map((s) => s.pais).filter(Boolean))
    );
    return uniqueCountries.sort();
  }, [series]);

  const yearBounds = useMemo(() => {
    const years = series.map((s) => s.anio).filter((y) => y > 0);
    return {
      min: Math.min(...years, 1990),
      max: Math.max(...years, 2026),
    };
  }, [series]);

  const hasActiveFilters = !!(
    searchTerm ||
    selectedCountry ||
    selectedType ||
    selectedViewed ||
    selectedFavorite ||
    minRating > 0 ||
    yearFrom ||
    yearTo
  );

  const filteredSeries = useMemo(() => {
    let filtered = [...series];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.titulo.toLowerCase().includes(term) ||
          s.pais.toLowerCase().includes(term) ||
          s.tipo.toLowerCase().includes(term)
      );
    }

    if (selectedCountry) {
      filtered = filtered.filter((s) => s.pais === selectedCountry);
    }

    if (selectedType) {
      filtered = filtered.filter((s) => s.tipo === selectedType);
    }

    if (selectedViewed === 'watched') {
      filtered = filtered.filter((s) => s.visto === true);
    } else if (selectedViewed === 'unwatched') {
      filtered = filtered.filter((s) => !s.visto);
    }

    if (selectedFavorite === 'favorites') {
      filtered = filtered.filter((s) => s.isFavorite === true);
    }

    if (minRating > 0) {
      filtered = filtered.filter((s) => (s.rating ?? 0) >= minRating);
    }

    if (yearFrom) {
      filtered = filtered.filter((s) => (s.anio ?? 0) >= yearFrom);
    }

    if (yearTo) {
      filtered = filtered.filter((s) => (s.anio ?? 0) <= yearTo);
    }

    return filtered;
  }, [
    series,
    searchTerm,
    selectedCountry,
    selectedType,
    selectedViewed,
    selectedFavorite,
    minRating,
    yearFrom,
    yearTo,
  ]);

  const paginatedSeries = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSeries.slice(startIndex, startIndex + pageSize);
  }, [filteredSeries, currentPage, pageSize]);

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCountry(undefined);
    setSelectedType(undefined);
    setSelectedViewed(undefined);
    setSelectedFavorite(undefined);
    setMinRating(0);
    setYearFrom(undefined);
    setYearTo(undefined);
    setCurrentPage(1);
  };

  const toggleFavorite = async (
    serieId: string,
    currentFavorite: boolean,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    try {
      const response = await fetch(`/api/series/${serieId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !currentFavorite }),
      });

      if (!response.ok) throw new Error('Error al actualizar favorito');

      setSeries((prevSeries) =>
        prevSeries.map((s) =>
          s.id === serieId ? { ...s, isFavorite: !currentFavorite } : s
        )
      );

      message.success(
        !currentFavorite ? 'Agregado a favoritos' : 'Removido de favoritos'
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      message.error('Error al actualizar favorito');
    }
  };

  const handleCardClick = (id: string) => {
    router.push(`/series/${id}`);
  };

  const handleQuickView = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/series/${id}`);
  };

  const getColorByType = (tipo: string) => {
    const colorMap: Record<string, string> = {
      serie: 'geekblue',
      pelicula: 'magenta',
      corto: 'cyan',
      especial: 'volcano',
    };
    return colorMap[tipo] || 'default';
  };

  const yearOptions = Array.from(
    { length: yearBounds.max - yearBounds.min + 1 },
    (_, i) => yearBounds.min + i
  );

  return (
    <>
      {/* Toolbar: búsqueda + acciones */}
      <div className="catalogo-toolbar">
        <div className="catalogo-toolbar-left">
          <Input
            placeholder="Buscar por título, país o tipo..."
            prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleFilterChange();
            }}
            allowClear
            className="catalogo-search"
          />
          <Button
            icon={filtersVisible ? <UpOutlined /> : <DownOutlined />}
            onClick={() => setFiltersVisible(!filtersVisible)}
            className={hasActiveFilters ? 'catalogo-filter-btn-active' : ''}
          >
            Filtros{hasActiveFilters ? ` (${filteredSeries.length})` : ''}
          </Button>
        </div>
        <div className="catalogo-toolbar-right">
          <span className="catalogo-count">
            {filteredSeries.length === series.length
              ? `${series.length} títulos`
              : `${filteredSeries.length} de ${series.length}`}
          </span>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push('/admin/series/nueva')}
          >
            Nueva
          </Button>
        </div>
      </div>

      {/* Panel de filtros colapsable */}
      {filtersVisible && (
        <div className="catalogo-filters">
          <Row gutter={[8, 8]} align="middle">
            <Col xs={12} sm={6} md={4} lg={3}>
              <Select
                size="small"
                placeholder="País"
                style={{ width: '100%' }}
                value={selectedCountry}
                onChange={(value) => {
                  setSelectedCountry(value);
                  handleFilterChange();
                }}
                allowClear
              >
                {countries.map((country) => (
                  <Option key={country} value={country}>
                    {country}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={12} sm={6} md={4} lg={3}>
              <Select
                size="small"
                placeholder="Tipo"
                style={{ width: '100%' }}
                value={selectedType}
                onChange={(value) => {
                  setSelectedType(value);
                  handleFilterChange();
                }}
                allowClear
              >
                <Option value="serie">Serie</Option>
                <Option value="pelicula">Película</Option>
                <Option value="corto">Corto</Option>
                <Option value="especial">Especial</Option>
              </Select>
            </Col>

            <Col xs={12} sm={6} md={4} lg={3}>
              <Select
                size="small"
                placeholder="Estado"
                style={{ width: '100%' }}
                value={selectedViewed}
                onChange={(value) => {
                  setSelectedViewed(value);
                  handleFilterChange();
                }}
                allowClear
              >
                <Option value="watched">Vistas</Option>
                <Option value="unwatched">No vistas</Option>
              </Select>
            </Col>

            <Col xs={12} sm={6} md={4} lg={2}>
              <Select
                size="small"
                placeholder="Favoritos"
                style={{ width: '100%' }}
                value={selectedFavorite}
                onChange={(value) => {
                  setSelectedFavorite(value);
                  handleFilterChange();
                }}
                allowClear
              >
                <Option value="favorites">Favoritos</Option>
              </Select>
            </Col>

            <Col xs={12} sm={6} md={4} lg={3}>
              <Select
                size="small"
                placeholder="Rating mín."
                style={{ width: '100%' }}
                value={minRating > 0 ? minRating : undefined}
                onChange={(value) => {
                  setMinRating(value || 0);
                  handleFilterChange();
                }}
                allowClear
              >
                {[5, 6, 7, 8, 9, 10].map((rating) => (
                  <Option key={rating} value={rating}>
                    {rating}+
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={12} sm={6} md={3} lg={2}>
              <Select
                size="small"
                placeholder="Desde"
                style={{ width: '100%' }}
                value={yearFrom}
                onChange={(value) => {
                  setYearFrom(value);
                  handleFilterChange();
                }}
                allowClear
              >
                {yearOptions.map((year) => (
                  <Option key={year} value={year}>
                    {year}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={12} sm={6} md={3} lg={2}>
              <Select
                size="small"
                placeholder="Hasta"
                style={{ width: '100%' }}
                value={yearTo}
                onChange={(value) => {
                  setYearTo(value);
                  handleFilterChange();
                }}
                allowClear
              >
                {yearOptions.map((year) => (
                  <Option key={year} value={year}>
                    {year}
                  </Option>
                ))}
              </Select>
            </Col>

            {hasActiveFilters && (
              <Col xs={12} sm={6} md={3} lg={2}>
                <Button
                  size="small"
                  icon={<FilterOutlined />}
                  onClick={clearFilters}
                  block
                >
                  Limpiar
                </Button>
              </Col>
            )}
          </Row>
        </div>
      )}

      {/* Grid de Series */}
      {paginatedSeries.length > 0 ? (
        <>
          <Row gutter={[16, 16]}>
            {paginatedSeries.map((serie) => {
              const gradient = getGradientByType(serie.tipo);

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={serie.id}>
                  <div
                    className={`serie-card serie-card--${serie.tipo}`}
                    onClick={() => handleCardClick(serie.id)}
                  >
                    <div
                      className="serie-card-cover"
                      style={{
                        background: gradient,
                        backgroundImage: serie.imageUrl
                          ? `url(${serie.imageUrl})`
                          : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundBlendMode: serie.imageUrl
                          ? 'overlay'
                          : 'normal',
                      }}
                    >
                      <div className="serie-card-actions">
                        <Tooltip title={serie.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
                          <button
                            className={`serie-card-action-btn ${serie.isFavorite ? 'favorite-active' : ''}`}
                            onClick={(e) =>
                              toggleFavorite(serie.id, serie.isFavorite || false, e)
                            }
                          >
                            {serie.isFavorite ? <StarFilled /> : <StarOutlined />}
                          </button>
                        </Tooltip>
                        <Tooltip title="Ver detalle">
                          <button
                            className="serie-card-action-btn"
                            onClick={(e) => handleQuickView(serie.id, e)}
                          >
                            <EyeOutlined />
                          </button>
                        </Tooltip>
                      </div>
                      <div className="serie-title-overlay">
                        {serie.titulo}
                      </div>
                    </div>
                    <div className="serie-card-body">
                      <div className="serie-card-tags">
                        <Tag color={getColorByType(serie.tipo)}>
                          {serie.tipo.toUpperCase()}
                        </Tag>
                        {serie.visto && <Tag color="success">Vista</Tag>}
                        {serie.rating != null && serie.rating > 0 && (
                          <Tag color="gold">{serie.rating}</Tag>
                        )}
                      </div>
                      <div className="serie-card-info">
                        <span>{serie.pais}</span>
                        {serie.anio > 0 && (
                          <>
                            <span className="serie-card-dot" />
                            <span>{serie.anio}</span>
                          </>
                        )}
                        {serie.temporadas > 0 && (
                          <>
                            <span className="serie-card-dot" />
                            <span>
                              {serie.temporadas}T
                              {serie.episodios > 0 && ` ${serie.episodios}E`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>

          {/* Paginación */}
          <div className="catalogo-pagination">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredSeries.length}
              onChange={(page, size) => {
                setCurrentPage(page);
                if (size !== pageSize) {
                  setPageSize(size);
                  setCurrentPage(1);
                }
              }}
              showSizeChanger
              pageSizeOptions={PAGE_SIZE_OPTIONS.map(String)}
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} de ${total}`
              }
            />
          </div>
        </>
      ) : (
        <Empty
          description={
            hasActiveFilters
              ? 'No se encontraron series con estos filtros'
              : 'No hay series en el catálogo'
          }
        />
      )}
    </>
  );
}
