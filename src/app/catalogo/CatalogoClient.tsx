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
  Drawer,
  Space,
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
  AppstoreOutlined,
  UnorderedListOutlined,
  FontSizeOutlined,
  GlobalOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';

const { Option } = Select;

interface SerieData {
  id: string;
  titulo: string;
  pais: string;
  paisCode?: string | null;
  tipo: string;
  temporadas: number;
  episodios: number;
  anio: number;
  rating: number | null;
  observaciones: string | null;
  imageUrl?: string | null;
  imagePosition?: string;
  synopsis?: string | null;
  visto?: boolean;
  isFavorite?: boolean;
  universoId?: number | null;
  universoNombre?: string | null;
}

interface UniverseGroup {
  type: 'universe';
  universoId: number;
  universoNombre: string;
  series: SerieData[];
}

interface SingleSerie {
  type: 'single';
  serie: SerieData;
}

type CatalogItem = UniverseGroup | SingleSerie;

interface CatalogoClientProps {
  series: SerieData[];
}

const PAGE_SIZE_OPTIONS = [24, 48, 96];
const DEFAULT_PAGE_SIZE = 48;
const ALPHABET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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

const getColorByType = (tipo: string) => {
  const colorMap: Record<string, string> = {
    serie: 'geekblue',
    pelicula: 'magenta',
    corto: 'cyan',
    especial: 'volcano',
  };
  return colorMap[tipo] || 'default';
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
  const [selectedFavorite, setSelectedFavorite] = useState<
    string | undefined
  >();
  const [minRating, setMinRating] = useState(0);
  const [yearFrom, setYearFrom] = useState<number | undefined>();
  const [yearTo, setYearTo] = useState<number | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [showAlphaIndex, setShowAlphaIndex] = useState(false);
  const [expandedUniverses, setExpandedUniverses] = useState<Set<number>>(
    new Set()
  );
  const isMobile = useMediaQuery('(max-width: 768px)');

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

  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    series.forEach((s) => {
      const first = s.titulo.charAt(0).toUpperCase();
      if (/[A-Z]/.test(first)) {
        letters.add(first);
      } else {
        letters.add('#');
      }
    });
    return letters;
  }, [series]);

  const hasActiveFilters = !!(
    searchTerm ||
    selectedCountry ||
    selectedType ||
    selectedViewed ||
    selectedFavorite ||
    selectedLetter ||
    minRating > 0 ||
    yearFrom ||
    yearTo
  );

  // Filter series first, then group by universe
  const filteredSeries = useMemo(() => {
    let filtered = [...series];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.titulo.toLowerCase().includes(term) ||
          s.pais.toLowerCase().includes(term) ||
          s.tipo.toLowerCase().includes(term) ||
          s.universoNombre?.toLowerCase().includes(term)
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

    if (selectedLetter) {
      filtered = filtered.filter((s) => {
        const first = s.titulo.charAt(0).toUpperCase();
        if (selectedLetter === '#') {
          return !/[A-Z]/.test(first);
        }
        return first === selectedLetter;
      });
    }

    return filtered;
  }, [
    series,
    searchTerm,
    selectedCountry,
    selectedType,
    selectedViewed,
    selectedFavorite,
    selectedLetter,
    minRating,
    yearFrom,
    yearTo,
  ]);

  // Group filtered series into CatalogItems (universe groups + singles)
  const catalogItems = useMemo((): CatalogItem[] => {
    const universeMap = new Map<number, SerieData[]>();
    const singles: SerieData[] = [];

    filteredSeries.forEach((s) => {
      if (s.universoId) {
        const existing = universeMap.get(s.universoId) || [];
        existing.push(s);
        universeMap.set(s.universoId, existing);
      } else {
        singles.push(s);
      }
    });

    const items: CatalogItem[] = [];

    // Add universe groups
    universeMap.forEach((groupSeries, universoId) => {
      if (groupSeries.length > 1) {
        // Sort series within a universe by year
        groupSeries.sort((a, b) => (a.anio || 0) - (b.anio || 0));
        items.push({
          type: 'universe',
          universoId,
          universoNombre: groupSeries[0].universoNombre || 'Universo',
          series: groupSeries,
        });
      } else {
        // Only 1 series in this universe after filtering — show as single
        singles.push(groupSeries[0]);
      }
    });

    // Add singles
    singles.forEach((serie) => {
      items.push({ type: 'single', serie });
    });

    // Sort all items alphabetically
    items.sort((a, b) => {
      const nameA = a.type === 'universe' ? a.universoNombre : a.serie.titulo;
      const nameB = b.type === 'universe' ? b.universoNombre : b.serie.titulo;
      return nameA.localeCompare(nameB);
    });

    return items;
  }, [filteredSeries]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return catalogItems.slice(startIndex, startIndex + pageSize);
  }, [catalogItems, currentPage, pageSize]);

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCountry(undefined);
    setSelectedType(undefined);
    setSelectedViewed(undefined);
    setSelectedFavorite(undefined);
    setSelectedLetter(null);
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

  const toggleUniverse = (universoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedUniverses((prev) => {
      const next = new Set(prev);
      if (next.has(universoId)) {
        next.delete(universoId);
      } else {
        next.add(universoId);
      }
      return next;
    });
  };

  const yearOptions = Array.from(
    { length: yearBounds.max - yearBounds.min + 1 },
    (_, i) => yearBounds.min + i
  );

  // --- Render helpers ---

  const renderSingleCard = (serie: SerieData) => {
    const gradient = getGradientByType(serie.tipo);
    return (
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
            backgroundPosition: serie.imagePosition || 'center',
            backgroundBlendMode: serie.imageUrl ? 'overlay' : 'normal',
          }}
        >
          <div className="serie-card-actions">
            <Tooltip
              title={
                serie.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'
              }
            >
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
          <div className="serie-title-overlay">{serie.titulo}</div>
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
            <span>
              <CountryFlag code={serie.paisCode} size="small" /> {serie.pais}
            </span>
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
    );
  };

  const renderUniverseCard = (group: UniverseGroup) => {
    const firstSerie = group.series[0];
    const isExpanded = expandedUniverses.has(group.universoId);
    return (
      <div className="universe-card-wrapper">
        <div
          className="serie-card serie-card--universe"
          onClick={(e) => toggleUniverse(group.universoId, e)}
        >
          <div
            className="serie-card-cover"
            style={{
              background:
                'linear-gradient(135deg, rgba(82, 73, 200, 0.8) 0%, rgba(130, 87, 229, 0.9) 100%)',
              backgroundImage: firstSerie.imageUrl
                ? `url(${firstSerie.imageUrl})`
                : undefined,
              backgroundSize: 'cover',
              backgroundPosition: firstSerie.imagePosition || 'center',
            }}
          >
            <div className="serie-title-overlay">{group.universoNombre}</div>
          </div>
          <div className="serie-card-body">
            <div className="serie-card-tags">
              <Tag color="purple" style={{ margin: 0 }}>
                <GlobalOutlined /> {group.series.length} títulos
              </Tag>
            </div>
            <div className="serie-card-info">
              <span>
                {isExpanded ? <UpOutlined /> : <DownOutlined />} Ver series
              </span>
            </div>
          </div>
        </div>
        {isExpanded && (
          <div className="universe-expand-panel">
            {group.series.map((serie) => (
              <div
                key={serie.id}
                className="universe-expand-entry"
                onClick={() => handleCardClick(serie.id)}
              >
                <span className="universe-expand-entry-title">
                  {serie.titulo}
                </span>
                <div className="universe-expand-entry-meta">
                  <Tag color={getColorByType(serie.tipo)} style={{ margin: 0 }}>
                    {serie.tipo.toUpperCase()}
                  </Tag>
                  {serie.anio > 0 && <span>{serie.anio}</span>}
                  {serie.rating != null && serie.rating > 0 && (
                    <Tag color="gold" style={{ margin: 0 }}>
                      {serie.rating}
                    </Tag>
                  )}
                </div>
                <RightOutlined style={{ color: 'var(--text-tertiary)' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSingleListItem = (serie: SerieData) => (
    <div
      className={`serie-list-item serie-list-item--${serie.tipo}`}
      onClick={() => handleCardClick(serie.id)}
    >
      <div
        className="serie-list-item-cover"
        style={{
          background: getGradientByType(serie.tipo),
          backgroundImage: serie.imageUrl
            ? `url(${serie.imageUrl})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: serie.imagePosition || 'center',
        }}
      />
      <div className="serie-list-item-content">
        <span className="serie-list-item-title">{serie.titulo}</span>
        <div className="serie-list-item-meta">
          <Tag color={getColorByType(serie.tipo)} style={{ margin: 0 }}>
            {serie.tipo.toUpperCase()}
          </Tag>
          <span>
            <CountryFlag code={serie.paisCode} size="small" /> {serie.pais}
          </span>
          {serie.anio > 0 && <span>{serie.anio}</span>}
          {serie.rating != null && serie.rating > 0 && (
            <Tag color="gold" style={{ margin: 0 }}>
              {serie.rating}
            </Tag>
          )}
        </div>
      </div>
      <button
        className={`serie-list-item-fav ${serie.isFavorite ? 'favorite-active' : ''}`}
        onClick={(e) => toggleFavorite(serie.id, serie.isFavorite || false, e)}
      >
        {serie.isFavorite ? <StarFilled /> : <StarOutlined />}
      </button>
    </div>
  );

  const renderUniverseListItem = (group: UniverseGroup) => {
    const isExpanded = expandedUniverses.has(group.universoId);
    return (
      <div className="universe-list-group">
        <div
          className="universe-list-header"
          onClick={(e) => toggleUniverse(group.universoId, e)}
        >
          <GlobalOutlined />
          <span>{group.universoNombre}</span>
          <Tag color="purple" style={{ margin: 0 }}>
            {group.series.length} títulos
          </Tag>
          {isExpanded ? <UpOutlined /> : <DownOutlined />}
        </div>
        {isExpanded &&
          group.series.map((serie) => (
            <div
              key={serie.id}
              className={`serie-list-item serie-list-item--${serie.tipo} serie-list-item--universe`}
              onClick={() => handleCardClick(serie.id)}
            >
              <div
                className="serie-list-item-cover"
                style={{
                  background: getGradientByType(serie.tipo),
                  backgroundImage: serie.imageUrl
                    ? `url(${serie.imageUrl})`
                    : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: serie.imagePosition || 'center',
                }}
              />
              <div className="serie-list-item-content">
                <span className="serie-list-item-title">{serie.titulo}</span>
                <div className="serie-list-item-meta">
                  <Tag color={getColorByType(serie.tipo)} style={{ margin: 0 }}>
                    {serie.tipo.toUpperCase()}
                  </Tag>
                  <span>
                    <CountryFlag code={serie.paisCode} size="small" />{' '}
                    {serie.pais}
                  </span>
                  {serie.anio > 0 && <span>{serie.anio}</span>}
                  {serie.rating != null && serie.rating > 0 && (
                    <Tag color="gold" style={{ margin: 0 }}>
                      {serie.rating}
                    </Tag>
                  )}
                </div>
              </div>
              <button
                className={`serie-list-item-fav ${serie.isFavorite ? 'favorite-active' : ''}`}
                onClick={(e) =>
                  toggleFavorite(serie.id, serie.isFavorite || false, e)
                }
              >
                {serie.isFavorite ? <StarFilled /> : <StarOutlined />}
              </button>
            </div>
          ))}
      </div>
    );
  };

  const filtersContent = (
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
  );

  return (
    <>
      {/* Toolbar: búsqueda + acciones */}
      <div className="catalogo-toolbar">
        <div className="catalogo-toolbar-left">
          <Input
            placeholder="Buscar por título, país o tipo..."
            prefix={
              <SearchOutlined style={{ color: 'var(--text-tertiary)' }} />
            }
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
          <Tooltip title="Filtro alfabético">
            <Button
              icon={<FontSizeOutlined />}
              onClick={() => {
                setShowAlphaIndex(!showAlphaIndex);
                if (showAlphaIndex) {
                  setSelectedLetter(null);
                  handleFilterChange();
                }
              }}
              className={selectedLetter ? 'catalogo-filter-btn-active' : ''}
              type={showAlphaIndex ? 'primary' : 'default'}
            />
          </Tooltip>
        </div>
        <div className="catalogo-toolbar-right">
          <span className="catalogo-count">
            {filteredSeries.length === series.length
              ? `${series.length} títulos`
              : `${filteredSeries.length} de ${series.length}`}
          </span>
          <Space.Compact>
            <Button
              icon={<AppstoreOutlined />}
              type={viewMode === 'grid' ? 'primary' : 'default'}
              onClick={() => setViewMode('grid')}
              size={isMobile ? 'small' : 'middle'}
            />
            <Button
              icon={<UnorderedListOutlined />}
              type={viewMode === 'list' ? 'primary' : 'default'}
              onClick={() => setViewMode('list')}
              size={isMobile ? 'small' : 'middle'}
            />
          </Space.Compact>
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
      {isMobile ? (
        <Drawer
          title="Filtros"
          placement="bottom"
          open={filtersVisible}
          onClose={() => setFiltersVisible(false)}
          size="default"
          className="catalogo-filters-drawer"
        >
          {filtersContent}
        </Drawer>
      ) : (
        filtersVisible && (
          <div className="catalogo-filters">{filtersContent}</div>
        )
      )}

      {/* Índice alfabético */}
      {showAlphaIndex && (
        <div className="catalogo-alpha-index">
          {ALPHABET.map((letter) => {
            const isAvailable = availableLetters.has(letter);
            const isActive = selectedLetter === letter;
            return (
              <button
                key={letter}
                className={`catalogo-alpha-btn${isActive ? ' catalogo-alpha-btn--active' : ''}${!isAvailable ? ' catalogo-alpha-btn--disabled' : ''}`}
                disabled={!isAvailable}
                onClick={() => {
                  setSelectedLetter(isActive ? null : letter);
                  handleFilterChange();
                }}
              >
                {letter}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid/List de Series */}
      {paginatedItems.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <Row gutter={[16, 16]}>
              {paginatedItems.map((item) => {
                if (item.type === 'universe') {
                  return (
                    <Col
                      xs={12}
                      sm={12}
                      md={8}
                      lg={6}
                      key={`universe-${item.universoId}`}
                    >
                      {renderUniverseCard(item)}
                    </Col>
                  );
                }
                return (
                  <Col xs={12} sm={12} md={8} lg={6} key={item.serie.id}>
                    {renderSingleCard(item.serie)}
                  </Col>
                );
              })}
            </Row>
          ) : (
            <div className="catalogo-list-view">
              {paginatedItems.map((item) => {
                if (item.type === 'universe') {
                  return (
                    <div key={`universe-${item.universoId}`}>
                      {renderUniverseListItem(item)}
                    </div>
                  );
                }
                return (
                  <div key={item.serie.id}>
                    {renderSingleListItem(item.serie)}
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginación */}
          <div className="catalogo-pagination">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={catalogItems.length}
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
              size={isMobile ? 'small' : 'middle'}
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
