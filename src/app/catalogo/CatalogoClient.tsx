'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Row,
  Col,
  Card,
  Empty,
  Space,
  Tag,
  Input,
  Select,
  Slider,
  Button,
  Pagination,
  Tooltip,
} from 'antd';
import { SearchOutlined, FilterOutlined, PlusOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
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

const ITEMS_PER_PAGE = 50;

// Función para generar gradientes sutiles basados en el tipo de contenido
const getGradientByType = (tipo: string): string => {
  const gradients: Record<string, string> = {
    // Serie: Azul suave
    serie: 'linear-gradient(135deg, rgba(47, 84, 235, 0.7) 0%, rgba(104, 109, 224, 0.8) 100%)',

    // Película: Magenta/Rosa suave
    pelicula: 'linear-gradient(135deg, rgba(235, 47, 150, 0.7) 0%, rgba(184, 50, 128, 0.8) 100%)',

    // Corto: Cyan suave
    corto: 'linear-gradient(135deg, rgba(19, 194, 194, 0.7) 0%, rgba(65, 105, 225, 0.8) 100%)',

    // Especial: Naranja suave
    especial: 'linear-gradient(135deg, rgba(250, 140, 22, 0.7) 0%, rgba(245, 89, 62, 0.8) 100%)',
  };

  return gradients[tipo] || gradients['serie'];
};

// Función para obtener estilos de card por tipo
const getCardStyles = (tipo: string) => {
  const styles: Record<string, { border: string; bgGradient: string }> = {
    serie: {
      border: '4px solid rgba(47, 84, 235, 0.9)',
      bgGradient: 'linear-gradient(135deg, rgba(47, 84, 235, 0.15) 0%, rgba(47, 84, 235, 0.03) 70%, transparent 100%)',
    },
    pelicula: {
      border: '4px solid rgba(235, 47, 150, 0.9)',
      bgGradient: 'linear-gradient(135deg, rgba(235, 47, 150, 0.15) 0%, rgba(235, 47, 150, 0.03) 70%, transparent 100%)',
    },
    corto: {
      border: '4px solid rgba(19, 194, 194, 0.9)',
      bgGradient: 'linear-gradient(135deg, rgba(19, 194, 194, 0.15) 0%, rgba(19, 194, 194, 0.03) 70%, transparent 100%)',
    },
    especial: {
      border: '4px solid rgba(250, 140, 22, 0.9)',
      bgGradient: 'linear-gradient(135deg, rgba(250, 140, 22, 0.15) 0%, rgba(250, 140, 22, 0.03) 70%, transparent 100%)',
    },
  };

  return styles[tipo] || styles['serie'];
};

export function CatalogoClient({ series: initialSeries }: CatalogoClientProps) {
  const router = useRouter();
  const message = useMessage();

  // Estado local de series (para actualizar favoritos sin recargar)
  const [series, setSeries] = useState<SerieData[]>(initialSeries);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>();
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [selectedViewed, setSelectedViewed] = useState<string>('all');
  const [selectedFavorite, setSelectedFavorite] = useState<string>('all');
  const [minRating, setMinRating] = useState(0);
  const [yearRange, setYearRange] = useState<[number, number]>([2000, 2026]);
  const [currentPage, setCurrentPage] = useState(1);

  // Obtener países únicos
  const countries = useMemo(() => {
    const uniqueCountries = Array.from(new Set(series.map((s) => s.pais).filter(Boolean)));
    return uniqueCountries.sort();
  }, [series]);

  // Aplicar filtros
  const filteredSeries = useMemo(() => {
    let filtered = [...series];

    // Búsqueda por título
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.titulo.toLowerCase().includes(term) ||
          s.pais.toLowerCase().includes(term) ||
          s.tipo.toLowerCase().includes(term)
      );
    }

    // Filtro por país
    if (selectedCountry) {
      filtered = filtered.filter((s) => s.pais === selectedCountry);
    }

    // Filtro por tipo
    if (selectedType) {
      filtered = filtered.filter((s) => s.tipo === selectedType);
    }

    // Filtro por visto/no visto
    if (selectedViewed === 'watched') {
      filtered = filtered.filter((s) => s.visto === true);
    } else if (selectedViewed === 'unwatched') {
      filtered = filtered.filter((s) => !s.visto);
    }

    // Filtro por favoritos
    if (selectedFavorite === 'favorites') {
      filtered = filtered.filter((s) => s.isFavorite === true);
    }

    // Filtro por rating mínimo
    if (minRating > 0) {
      filtered = filtered.filter((s) => (s.rating ?? 0) >= minRating);
    }

    // Filtro por rango de años
    filtered = filtered.filter((s) => {
      const year = s.anio ?? 0;
      return year >= yearRange[0] && year <= yearRange[1];
    });

    return filtered;
  }, [series, searchTerm, selectedCountry, selectedType, selectedViewed, selectedFavorite, minRating, yearRange]);

  // Paginación
  const paginatedSeries = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredSeries.slice(startIndex, endIndex);
  }, [filteredSeries, currentPage]);

  // Reset página cuando cambian filtros
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCountry(undefined);
    setSelectedType(undefined);
    setSelectedViewed('all');
    setSelectedFavorite('all');
    setMinRating(0);
    setYearRange([2000, 2026]);
    setCurrentPage(1);
  };

  const toggleFavorite = async (serieId: string, currentFavorite: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se abra el detalle de la serie

    try {
      const response = await fetch(`/api/series/${serieId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !currentFavorite }),
      });

      if (!response.ok) throw new Error('Error al actualizar favorito');

      // Actualizar el estado local
      setSeries((prevSeries) =>
        prevSeries.map((s) =>
          s.id === serieId ? { ...s, isFavorite: !currentFavorite } : s
        )
      );

      message.success(
        !currentFavorite ? '⭐ Agregado a favoritos' : 'Removido de favoritos'
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      message.error('Error al actualizar favorito');
    }
  };

  const handleCardClick = (id: string) => {
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

  return (
    <>
      {/* Header con botón agregar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h2>Catálogo de Series y Películas</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => router.push('/admin/series/nueva')}
        >
          Agregar Nueva
        </Button>
      </div>

      {/* Panel de Filtros Compacto */}
      <Card
        size="small"
        style={{ marginBottom: '16px' }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {/* Fila única: Todos los filtros principales */}
          <Row gutter={[8, 8]} align="middle">
            <Col xs={24} sm={12} md={8} lg={5}>
              <Input
                size="small"
                placeholder="Buscar..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleFilterChange();
                }}
                allowClear
              />
            </Col>

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
                <Option value="serie">📺 Serie</Option>
                <Option value="pelicula">🎬 Película</Option>
                <Option value="corto">🎞️ Corto</Option>
                <Option value="especial">✨ Especial</Option>
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
              >
                <Option value="all">Todas</Option>
                <Option value="watched">✓ Vistas</Option>
                <Option value="unwatched">○ No vistas</Option>
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
              >
                <Option value="all">Todos</Option>
                <Option value="favorites">⭐ Favoritos</Option>
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
                    ★ {rating}+
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={12} md={8} lg={5}>
              <Space.Compact size="small" style={{ width: '100%' }}>
                <Select
                  size="small"
                  placeholder="Desde"
                  style={{ width: '50%' }}
                  value={yearRange[0]}
                  onChange={(value) => {
                    setYearRange([value, yearRange[1]]);
                    handleFilterChange();
                  }}
                >
                  {Array.from({ length: 27 }, (_, i) => 2000 + i).map((year) => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
                <Select
                  size="small"
                  placeholder="Hasta"
                  style={{ width: '50%' }}
                  value={yearRange[1]}
                  onChange={(value) => {
                    setYearRange([yearRange[0], value]);
                    handleFilterChange();
                  }}
                >
                  {Array.from({ length: 27 }, (_, i) => 2000 + i).map((year) => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
              </Space.Compact>
            </Col>

            <Col xs={12} sm={6} md={4} lg={2}>
              <Button
                size="small"
                icon={<FilterOutlined />}
                onClick={clearFilters}
                block
              >
                Limpiar
              </Button>
            </Col>
          </Row>

          {/* Contador de resultados */}
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            textAlign: 'right',
            marginTop: '4px'
          }}>
            {filteredSeries.length} de {series.length} series
          </div>
        </Space>
      </Card>

      {/* Grid de Series */}
      {paginatedSeries.length > 0 ? (
        <>
          <Row gutter={[16, 16]}>
            {paginatedSeries.map((serie) => {
              const gradient = getGradientByType(serie.tipo);
              const cardStyles = getCardStyles(serie.tipo);
              const hasSynopsis = serie.synopsis && serie.synopsis.trim().length > 0;

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={serie.id}>
                  <Tooltip
                    title={hasSynopsis ? serie.synopsis : 'Sin sinopsis'}
                    placement="top"
                    styles={{ root: { maxWidth: '400px' } }}
                  >
                    <Card
                      hoverable
                      className={`serie-card serie-card--${serie.tipo}`}
                      onClick={() => handleCardClick(serie.id)}
                      style={{
                        cursor: 'pointer',
                        borderLeft: cardStyles.border,
                        backgroundImage: cardStyles.bgGradient,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      styles={{ body: { padding: '12px', position: 'relative', zIndex: 1 } }}
                      cover={
                        <div
                          className="serie-card-cover"
                          style={{
                            background: gradient,
                            backgroundImage: serie.imageUrl ? `url(${serie.imageUrl})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundBlendMode: serie.imageUrl ? 'overlay' : 'normal',
                          }}
                        >
                          <Button
                            type="text"
                            icon={serie.isFavorite ? <StarFilled /> : <StarOutlined />}
                            onClick={(e) => toggleFavorite(serie.id, serie.isFavorite || false, e)}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              zIndex: 3,
                              color: serie.isFavorite ? '#fadb14' : 'rgba(255, 255, 255, 0.85)',
                              fontSize: '20px',
                              background: 'rgba(0, 0, 0, 0.4)',
                              backdropFilter: 'blur(4px)',
                            }}
                            size="small"
                          />
                          <div className="serie-title-overlay">{serie.titulo}</div>
                        </div>
                      }
                    >
                      <div className="serie-card-meta">
                        <div className="serie-card-tags">
                          <Tag color={getColorByType(serie.tipo)}>{serie.tipo.toUpperCase()}</Tag>
                          {serie.visto && <Tag color="success">✓ Vista</Tag>}
                          {serie.rating && <Tag color="gold">★ {serie.rating}</Tag>}
                        </div>
                        <div className="serie-card-info">
                          <span>{serie.pais}</span>
                          {serie.anio && <span>•</span>}
                          <span>{serie.anio || 'N/A'}</span>
                          {serie.temporadas > 0 && (
                            <>
                              <span>•</span>
                              <span>
                                {serie.temporadas}T
                                {serie.episodios > 0 && ` ${serie.episodios}E`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Tooltip>
                </Col>
              );
            })}
          </Row>

          {/* Paginación */}
          {filteredSeries.length > ITEMS_PER_PAGE && (
            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <Pagination
                current={currentPage}
                pageSize={ITEMS_PER_PAGE}
                total={filteredSeries.length}
                onChange={setCurrentPage}
                showSizeChanger={false}
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} de ${total} series`
                }
              />
            </div>
          )}
        </>
      ) : (
        <Empty
          description={
            searchTerm ||
            selectedCountry ||
            selectedType ||
            selectedViewed !== 'all' ||
            selectedFavorite !== 'all' ||
            minRating > 0
              ? 'No se encontraron series con estos filtros'
              : 'No hay series en el catálogo'
          }
        />
      )}
    </>
  );
}
