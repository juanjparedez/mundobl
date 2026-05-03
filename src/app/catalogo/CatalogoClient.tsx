'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  FireOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import Image from 'next/image';
import { useMessage } from '@/hooks/useMessage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { WelcomeBanner } from '@/components/common/WelcomeBanner/WelcomeBanner';

const { Option } = Select;

interface SerieTag {
  id: number;
  name: string;
}

interface SerieData {
  id: string;
  titulo: string;
  pais: string;
  paisCode?: string | null;
  tipo: string;
  formato?: string;
  temporadas: number;
  episodios: number;
  runtimeHours?: number;
  anio: number;
  rating: number | null;
  observaciones: string | null;
  imageUrl?: string | null;
  imagePosition?: string;
  synopsis?: string | null;
  visto?: boolean;
  universoId?: number | null;
  universoNombre?: string | null;
  tags?: SerieTag[];
  genres?: string[];
  directors?: string[];
  actors?: string[];
  productionCompany?: string | null;
  originalLanguage?: string | null;
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
  userRole: string | null;
}

const PAGE_SIZE_OPTIONS = [24, 48, 96];
const DEFAULT_PAGE_SIZE = 48;
const ALPHABET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const getGradientByType = (tipo: string): string => {
  const gradients: Record<string, string> = {
    serie:
      'linear-gradient(135deg, rgba(169, 115, 164, 0.76) 0%, rgba(112, 87, 168, 0.86) 100%)',
    pelicula:
      'linear-gradient(135deg, rgba(212, 112, 150, 0.74) 0%, rgba(171, 82, 128, 0.86) 100%)',
    corto:
      'linear-gradient(135deg, rgba(233, 144, 106, 0.74) 0%, rgba(183, 102, 146, 0.82) 100%)',
    especial:
      'linear-gradient(135deg, rgba(227, 167, 92, 0.76) 0%, rgba(209, 112, 108, 0.86) 100%)',
    anime:
      'linear-gradient(135deg, rgba(212, 97, 151, 0.74) 0%, rgba(198, 95, 179, 0.86) 100%)',
    reality:
      'linear-gradient(135deg, rgba(226, 165, 93, 0.74) 0%, rgba(191, 126, 80, 0.86) 100%)',
  };
  return gradients[tipo] || gradients['serie'];
};

const getColorByType = (tipo: string) => {
  const colorMap: Record<string, string> = {
    serie: 'purple',
    pelicula: 'magenta',
    corto: 'orange',
    especial: 'gold',
    anime: 'pink',
    reality: 'gold',
  };
  return colorMap[tipo] || 'default';
};

type QuickFilterValue = 'popular' | 'recent' | 'trend' | null;

export function CatalogoClient({
  series: initialSeries,
  userRole,
}: CatalogoClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = useMessage();
  const { t } = useLocale();
  const canEdit = userRole === 'ADMIN' || userRole === 'EDITOR';

  const [series] = useState<SerieData[]>(initialSeries);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/favorites')
      .then((res) => (res.ok ? res.json() : []))
      .then((ids: number[]) => setFavoriteIds(new Set(ids.map(String))))
      .catch(() => {});
  }, []);

  const isFavorite = useCallback(
    (serieId: string) => favoriteIds.has(serieId),
    [favoriteIds]
  );

  // Filtros (initial values may come from URL query params, so links from
  // detail views can pre-apply a single filter — see MetadataPrimitives)
  const initialYear = searchParams.get('year');
  const initialYearNum = initialYear ? parseInt(initialYear, 10) : undefined;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(
    searchParams.get('country') ?? undefined
  );
  const [selectedType, setSelectedType] = useState<string | undefined>(
    searchParams.get('type') ?? undefined
  );
  const [selectedFormat, setSelectedFormat] = useState<string | undefined>(
    searchParams.get('format') ?? undefined
  );
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(
    searchParams.get('genre') ?? undefined
  );
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(
    searchParams.get('language') ?? undefined
  );
  const [selectedProductionCompany, setSelectedProductionCompany] = useState<
    string | undefined
  >(searchParams.get('productionCompany') ?? undefined);
  const [selectedDirector, setSelectedDirector] = useState<string | undefined>(
    searchParams.get('director') ?? undefined
  );
  const [selectedActor, setSelectedActor] = useState<string | undefined>(
    searchParams.get('actor') ?? undefined
  );
  const [selectedViewed, setSelectedViewed] = useState<string | undefined>();
  const [selectedFavorite, setSelectedFavorite] = useState<
    string | undefined
  >();
  const initialTagParam = searchParams.get('tag');
  const initialTagId = initialTagParam ? parseInt(initialTagParam, 10) : null;
  const [selectedTags, setSelectedTags] = useState<number[]>(
    initialTagId && !isNaN(initialTagId) ? [initialTagId] : []
  );
  const [minRating, setMinRating] = useState(0);
  const [yearFrom, setYearFrom] = useState<number | undefined>(
    initialYearNum && !isNaN(initialYearNum) ? initialYearNum : undefined
  );
  const [yearTo, setYearTo] = useState<number | undefined>(
    initialYearNum && !isNaN(initialYearNum) ? initialYearNum : undefined
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedQuickFilter, setSelectedQuickFilter] =
    useState<QuickFilterValue>(null);
  const [showAlphaIndex, setShowAlphaIndex] = useState(false);
  const [expandedUniverses, setExpandedUniverses] = useState<Set<number>>(
    new Set()
  );
  const [expandedInfoCardId, setExpandedInfoCardId] = useState<string | null>(
    null
  );
  const isMobile = useMediaQuery('(max-width: 768px)');

  const countries = useMemo(() => {
    const uniqueCountries = Array.from(
      new Set(series.map((s) => s.pais).filter(Boolean))
    );
    return uniqueCountries.sort();
  }, [series]);

  const availableTags = useMemo(() => {
    const tagMap = new Map<number, string>();
    series.forEach((s) => {
      s.tags?.forEach((t) => tagMap.set(t.id, t.name));
    });
    return Array.from(tagMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
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
    selectedFormat ||
    selectedGenre ||
    selectedLanguage ||
    selectedProductionCompany ||
    selectedDirector ||
    selectedActor ||
    selectedViewed ||
    selectedFavorite ||
    selectedTags.length > 0 ||
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

    if (selectedFormat) {
      filtered = filtered.filter((s) => s.formato === selectedFormat);
    }

    if (selectedGenre) {
      const term = selectedGenre.toLowerCase();
      filtered = filtered.filter((s) =>
        s.genres?.some((name) => name.toLowerCase() === term)
      );
    }

    if (selectedLanguage) {
      const term = selectedLanguage.toLowerCase();
      filtered = filtered.filter(
        (s) => s.originalLanguage?.toLowerCase() === term
      );
    }

    if (selectedProductionCompany) {
      const term = selectedProductionCompany.toLowerCase();
      filtered = filtered.filter(
        (s) => s.productionCompany?.toLowerCase() === term
      );
    }

    if (selectedDirector) {
      const term = selectedDirector.toLowerCase();
      filtered = filtered.filter((s) =>
        s.directors?.some((name) => name.toLowerCase() === term)
      );
    }

    if (selectedActor) {
      const term = selectedActor.toLowerCase();
      filtered = filtered.filter((s) =>
        s.actors?.some((name) => name.toLowerCase() === term)
      );
    }

    if (selectedViewed === 'watched') {
      filtered = filtered.filter((s) => s.visto === true);
    } else if (selectedViewed === 'unwatched') {
      filtered = filtered.filter((s) => !s.visto);
    }

    if (selectedFavorite === 'favorites') {
      filtered = filtered.filter((s) => favoriteIds.has(s.id));
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((s) => {
        const ids = new Set(s.tags?.map((t) => t.id) ?? []);
        return selectedTags.every((tagId) => ids.has(tagId));
      });
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

    if (selectedQuickFilter === 'popular') {
      filtered = filtered.filter((s) => (s.rating ?? 0) >= 8);
    }

    if (selectedQuickFilter === 'recent') {
      const currentYear = new Date().getFullYear();
      filtered = filtered.filter((s) => (s.anio ?? 0) >= currentYear - 1);
    }

    if (selectedQuickFilter === 'trend') {
      const currentYear = new Date().getFullYear();
      filtered = filtered.filter(
        (s) => (s.rating ?? 0) >= 7 && (s.anio ?? 0) >= currentYear - 3
      );
    }

    return filtered;
  }, [
    series,
    searchTerm,
    selectedCountry,
    selectedType,
    selectedFormat,
    selectedGenre,
    selectedLanguage,
    selectedProductionCompany,
    selectedDirector,
    selectedActor,
    selectedViewed,
    selectedFavorite,
    favoriteIds,
    selectedTags,
    selectedLetter,
    selectedQuickFilter,
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
    setSelectedFormat(undefined);
    setSelectedGenre(undefined);
    setSelectedLanguage(undefined);
    setSelectedProductionCompany(undefined);
    setSelectedDirector(undefined);
    setSelectedActor(undefined);
    setSelectedViewed(undefined);
    setSelectedFavorite(undefined);
    setSelectedTags([]);
    setSelectedLetter(null);
    setSelectedQuickFilter(null);
    setMinRating(0);
    setYearFrom(undefined);
    setYearTo(undefined);
    setCurrentPage(1);
    router.replace('/catalogo');
  };

  const toggleFavorite = async (serieId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const response = await fetch(`/api/series/${serieId}/favorite`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Error al actualizar favorito');

      const data = await response.json();
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (data.isFavorite) {
          next.add(serieId);
        } else {
          next.delete(serieId);
        }
        return next;
      });

      message.success(
        data.isFavorite ? t('catalogo.favoriteAdded') : t('catalogo.favoriteRemoved')
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      message.error(t('catalogo.favoriteError'));
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

  const toggleCardInfo = (serieId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedInfoCardId((prev) => (prev === serieId ? null : serieId));
  };

  const yearOptions = Array.from(
    { length: yearBounds.max - yearBounds.min + 1 },
    (_, i) => yearBounds.min + i
  );

  // --- Render helpers ---

  const renderSingleCard = (serie: SerieData) => {
    const gradient = getGradientByType(serie.tipo);
    const isInfoExpanded = expandedInfoCardId === serie.id;
    const actorHighlights = (serie.actors ?? []).slice(0, 3);
    return (
      <div
        className={`serie-card serie-card--${serie.tipo}`}
        onClick={() => handleCardClick(serie.id)}
      >
        <div className="serie-card-cover">
          {serie.imageUrl ? (
            <Image
              src={serie.imageUrl}
              alt={serie.titulo}
              fill
              sizes="(max-width: 480px) 50vw, (max-width: 768px) 46vw, (max-width: 1200px) 31vw, 24vw"
              quality={60}
              fetchPriority="low"
              style={{
                objectFit: 'cover',
                objectPosition: serie.imagePosition || 'center',
              }}
            />
          ) : (
            <div
              className="serie-card-gradient-overlay"
              style={{ background: gradient }}
            />
          )}
          <div className="serie-card-gradient-overlay">
            <div className="serie-card-actions">
              <Tooltip
                title={
                  isFavorite(serie.id)
                    ? t('catalogo.removeFavorite')
                    : t('catalogo.addFavorite')
                }
              >
                <button
                  className={`serie-card-action-btn ${isFavorite(serie.id) ? 'favorite-active' : ''}`}
                  onClick={(e) => toggleFavorite(serie.id, e)}
                >
                  {isFavorite(serie.id) ? <StarFilled /> : <StarOutlined />}
                </button>
              </Tooltip>
              <Tooltip title={t('catalogo.viewDetail')}>
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
        </div>
        <div className="serie-card-body">
          <div className="serie-card-title">{serie.titulo}</div>
          <div className="serie-card-primary-meta">
            <span>
              <CountryFlag code={serie.paisCode} size="small" /> {serie.pais}
            </span>
            {serie.rating != null && serie.rating > 0 && (
              <Tag color="gold" style={{ margin: 0 }}>
                ★ {serie.rating}
              </Tag>
            )}
          </div>
          <div className="serie-card-secondary-meta">
            <Tag color={getColorByType(serie.tipo)} style={{ margin: 0 }}>
              {serie.tipo.toUpperCase()}
            </Tag>
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
            {(serie.runtimeHours ?? 0) > 0 && (
              <>
                <span className="serie-card-dot" />
                <span>
                  {serie.runtimeHours}h
                </span>
              </>
            )}
            {serie.visto && <Tag color="success">{t('catalogo.watchedTag')}</Tag>}
          </div>

          <button
            className={`serie-card-more-info-btn${isInfoExpanded ? ' serie-card-more-info-btn--active' : ''}`}
            onClick={(e) => toggleCardInfo(serie.id, e)}
          >
            {isInfoExpanded ? t('catalogo.hideInfo') : t('catalogo.moreInfo')}
          </button>

          {isInfoExpanded && (
            <div className="serie-card-info-panel">
              <div className="serie-card-info-line">
                <span>{t('catalogo.infoSeasons')}</span>
                <strong>{serie.temporadas}</strong>
              </div>
              <div className="serie-card-info-line">
                <span>{t('catalogo.infoEpisodes')}</span>
                <strong>{serie.episodios}</strong>
              </div>
              <div className="serie-card-info-line">
                <span>{t('catalogo.infoRuntime')}</span>
                <strong>
                  {(serie.runtimeHours ?? 0) > 0
                    ? `${serie.runtimeHours}h`
                    : t('catalogo.infoUnknown')}
                </strong>
              </div>
              <div className="serie-card-info-line serie-card-info-line--stacked">
                <span>{t('catalogo.infoActors')}</span>
                <strong>
                  {actorHighlights.length > 0
                    ? actorHighlights.join(', ')
                    : t('catalogo.infoNoActors')}
                </strong>
              </div>
            </div>
          )}
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
          <div className="serie-card-cover">
            {firstSerie.imageUrl ? (
              <Image
                src={firstSerie.imageUrl}
                alt={group.universoNombre}
                fill
                sizes="(max-width: 480px) 50vw, (max-width: 768px) 46vw, (max-width: 1200px) 31vw, 24vw"
                quality={60}
                fetchPriority="low"
                style={{
                  objectFit: 'cover',
                  objectPosition: firstSerie.imagePosition || 'center',
                }}
              />
            ) : (
              <div
                className="serie-card-gradient-overlay"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(82, 73, 200, 0.8) 0%, rgba(130, 87, 229, 0.9) 100%)',
                }}
              />
            )}
            <div className="serie-card-gradient-overlay">
              <div className="serie-title-overlay">{group.universoNombre}</div>
            </div>
          </div>
          <div className="serie-card-body">
            <div className="serie-card-tags">
              {firstSerie.paisCode && (
                <CountryFlag code={firstSerie.paisCode} size="small" />
              )}
              <Tag color="purple" style={{ margin: 0 }}>
                <GlobalOutlined /> {interpolateMessage(t('catalogo.universeTitles'), { n: String(group.series.length) })}
              </Tag>
            </div>
            <div className="serie-card-info">
              <span>
                {isExpanded ? <UpOutlined /> : <DownOutlined />} {t('catalogo.universeExpand')}
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
      <div className="serie-list-item-cover">
        {serie.imageUrl ? (
          <Image
            src={serie.imageUrl}
            alt={serie.titulo}
            fill
            sizes="48px"
            quality={50}
            fetchPriority="low"
            style={{
              objectFit: 'cover',
              objectPosition: serie.imagePosition || 'center',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: getGradientByType(serie.tipo),
            }}
          />
        )}
      </div>
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
        className={`serie-list-item-fav ${isFavorite(serie.id) ? 'favorite-active' : ''}`}
        onClick={(e) => toggleFavorite(serie.id, e)}
      >
        {isFavorite(serie.id) ? <StarFilled /> : <StarOutlined />}
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
            {interpolateMessage(t('catalogo.universeTitles'), { n: String(group.series.length) })}
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
              <div className="serie-list-item-cover">
                {serie.imageUrl ? (
                  <Image
                    src={serie.imageUrl}
                    alt={serie.titulo}
                    fill
                    sizes="48px"
                    quality={50}
                    fetchPriority="low"
                    style={{
                      objectFit: 'cover',
                      objectPosition: serie.imagePosition || 'center',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: getGradientByType(serie.tipo),
                    }}
                  />
                )}
              </div>
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
                className={`serie-list-item-fav ${isFavorite(serie.id) ? 'favorite-active' : ''}`}
                onClick={(e) => toggleFavorite(serie.id, e)}
              >
                {isFavorite(serie.id) ? <StarFilled /> : <StarOutlined />}
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
          placeholder={t('catalogo.filterCountry')}
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
          placeholder={t('catalogo.filterType')}
          style={{ width: '100%' }}
          value={selectedType}
          onChange={(value) => {
            setSelectedType(value);
            handleFilterChange();
          }}
          allowClear
        >
          <Option value="serie">{t('seriesHeader.typeSerie')}</Option>
          <Option value="pelicula">{t('seriesHeader.typePelicula')}</Option>
          <Option value="corto">{t('seriesHeader.typeCorto')}</Option>
          <Option value="especial">{t('seriesHeader.typeEspecial')}</Option>
          <Option value="anime">{t('seriesHeader.typeAnime')}</Option>
          <Option value="reality">{t('seriesHeader.typeReality')}</Option>
        </Select>
      </Col>

      <Col xs={12} sm={6} md={4} lg={3}>
        <Select
          size="small"
          placeholder={t('catalogo.filterStatus')}
          style={{ width: '100%' }}
          value={selectedViewed}
          onChange={(value) => {
            setSelectedViewed(value);
            handleFilterChange();
          }}
          allowClear
        >
          <Option value="watched">{t('catalogo.statusWatched')}</Option>
          <Option value="unwatched">{t('catalogo.statusUnwatched')}</Option>
        </Select>
      </Col>

      <Col xs={12} sm={6} md={4} lg={2}>
        <Select
          size="small"
          placeholder={t('catalogo.filterFavorites')}
          style={{ width: '100%' }}
          value={selectedFavorite}
          onChange={(value) => {
            setSelectedFavorite(value);
            handleFilterChange();
          }}
          allowClear
        >
          <Option value="favorites">{t('catalogo.favoritesOnly')}</Option>
        </Select>
      </Col>

      <Col xs={24} sm={12} md={8} lg={6}>
        <Select
          size="small"
          mode="multiple"
          placeholder={t('catalogo.filterTags')}
          style={{ width: '100%' }}
          value={selectedTags}
          onChange={(value) => {
            setSelectedTags(value);
            handleFilterChange();
          }}
          allowClear
          showSearch
          maxTagCount="responsive"
          filterOption={(input, option) =>
            (option?.label as string)
              ?.toLowerCase()
              .includes(input.toLowerCase()) ?? false
          }
          options={availableTags.map((t) => ({
            value: t.id,
            label: t.name,
          }))}
        />
      </Col>

      <Col xs={12} sm={6} md={4} lg={3}>
        <Select
          size="small"
          placeholder={t('catalogo.filterMinRating')}
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
          placeholder={t('catalogo.filterFrom')}
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
          placeholder={t('catalogo.filterTo')}
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
            {t('catalogo.filterClear')}
          </Button>
        </Col>
      )}
    </Row>
  );

  return (
    <>
      <WelcomeBanner isLoggedIn={userRole !== null} />
      {/* Toolbar: búsqueda + acciones */}
      <div className="catalogo-toolbar">
        <div className="catalogo-toolbar-left">
          <Input
            placeholder={t('catalogo.searchPlaceholder')}
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
            {t('catalogo.filtersButton')}{hasActiveFilters ? ` (${filteredSeries.length})` : ''}
          </Button>
          <Tooltip title={t('catalogo.alphaFilterTooltip')}>
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
              ? interpolateMessage(t('catalogo.titlesCount'), { n: String(series.length) })
              : interpolateMessage(t('catalogo.filteredCount'), { from: String(filteredSeries.length), total: String(series.length) })}
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
          {canEdit && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push('/admin/series/nueva')}
            >
              {t('catalogo.newButton')}
            </Button>
          )}
        </div>
      </div>

      <div className="catalogo-quick-filters" role="group" aria-label="Filtros rápidos">
        <button
          className={`catalogo-quick-chip${selectedQuickFilter === 'popular' ? ' catalogo-quick-chip--active' : ''}`}
          onClick={() => {
            setSelectedQuickFilter((prev) =>
              prev === 'popular' ? null : 'popular'
            );
            handleFilterChange();
          }}
        >
          <FireOutlined /> Populares
        </button>
        <button
          className={`catalogo-quick-chip${selectedQuickFilter === 'recent' ? ' catalogo-quick-chip--active' : ''}`}
          onClick={() => {
            setSelectedQuickFilter((prev) =>
              prev === 'recent' ? null : 'recent'
            );
            handleFilterChange();
          }}
        >
          <ClockCircleOutlined /> Recién agregados
        </button>
        <button
          className={`catalogo-quick-chip${selectedQuickFilter === 'trend' ? ' catalogo-quick-chip--active' : ''}`}
          onClick={() => {
            setSelectedQuickFilter((prev) =>
              prev === 'trend' ? null : 'trend'
            );
            handleFilterChange();
          }}
        >
          <ThunderboltOutlined /> Tendencia
        </button>
      </div>

      {/* Filtros activos (deep-links del detalle) */}
      {(selectedCountry ||
        selectedType ||
        selectedFormat ||
        selectedGenre ||
        selectedLanguage ||
        selectedProductionCompany ||
        selectedDirector ||
        selectedActor ||
        selectedQuickFilter ||
        (yearFrom && yearTo && yearFrom === yearTo) ||
        selectedTags.length > 0) && (
        <div className="catalogo-active-filters">
          <span className="catalogo-active-filters-label">{t('catalogo.filteringBy')}</span>
          {selectedCountry && (
            <Tag
              closable
              onClose={() => {
                setSelectedCountry(undefined);
                handleFilterChange();
              }}
            >
              {interpolateMessage(t('catalogo.filterCountryLabel'), { value: selectedCountry })}
            </Tag>
          )}
          {selectedType && (
            <Tag
              closable
              onClose={() => {
                setSelectedType(undefined);
                handleFilterChange();
              }}
            >
              {interpolateMessage(t('catalogo.filterTypeLabel'), { value: selectedType })}
            </Tag>
          )}
          {selectedFormat && (
            <Tag
              closable
              onClose={() => {
                setSelectedFormat(undefined);
                handleFilterChange();
              }}
            >
              {interpolateMessage(t('catalogo.filterFormatLabel'), { value: selectedFormat })}
            </Tag>
          )}
          {selectedGenre && (
            <Tag
              closable
              onClose={() => {
                setSelectedGenre(undefined);
                handleFilterChange();
              }}
            >
              {interpolateMessage(t('catalogo.filterGenreLabel'), { value: selectedGenre })}
            </Tag>
          )}
          {selectedLanguage && (
            <Tag
              closable
              onClose={() => {
                setSelectedLanguage(undefined);
                handleFilterChange();
              }}
            >
              {interpolateMessage(t('catalogo.filterLanguageLabel'), { value: selectedLanguage })}
            </Tag>
          )}
          {selectedProductionCompany && (
            <Tag
              closable
              onClose={() => {
                setSelectedProductionCompany(undefined);
                handleFilterChange();
              }}
            >
              {interpolateMessage(t('catalogo.filterProductionLabel'), { value: selectedProductionCompany })}
            </Tag>
          )}
          {selectedDirector && (
            <Tag
              closable
              onClose={() => {
                setSelectedDirector(undefined);
                handleFilterChange();
              }}
            >
              {interpolateMessage(t('catalogo.filterDirectorLabel'), { value: selectedDirector })}
            </Tag>
          )}
          {selectedActor && (
            <Tag
              closable
              onClose={() => {
                setSelectedActor(undefined);
                handleFilterChange();
              }}
            >
              {interpolateMessage(t('catalogo.filterActorLabel'), { value: selectedActor })}
            </Tag>
          )}
          {yearFrom && yearTo && yearFrom === yearTo && (
            <Tag
              closable
              onClose={() => {
                setYearFrom(undefined);
                setYearTo(undefined);
                handleFilterChange();
              }}
            >
              {interpolateMessage(t('catalogo.filterYearLabel'), { year: String(yearFrom) })}
            </Tag>
          )}
          {selectedTags.length > 0 &&
            selectedTags.map((tagId) => {
              const tag = availableTags.find((t) => t.id === tagId);
              if (!tag) return null;
              return (
                <Tag
                  key={tagId}
                  closable
                  onClose={() => {
                    setSelectedTags((prev) =>
                      prev.filter((id) => id !== tagId)
                    );
                    handleFilterChange();
                  }}
                >
                  {interpolateMessage(t('catalogo.filterTagLabel'), { name: tag.name })}
                </Tag>
              );
            })}
        </div>
      )}

      {/* Panel de filtros colapsable */}
      {isMobile ? (
        <Drawer
          title={t('catalogo.drawerTitle')}
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
                interpolateMessage(t('catalogo.paginationTotal'), { from: String(range[0]), to: String(range[1]), total: String(total) })
              }
              size={isMobile ? 'small' : 'middle'}
            />
          </div>
        </>
      ) : (
        <Empty
          description={
            hasActiveFilters
              ? t('catalogo.emptyFiltered')
              : t('catalogo.emptyCatalog')
          }
        />
      )}
    </>
  );
}
