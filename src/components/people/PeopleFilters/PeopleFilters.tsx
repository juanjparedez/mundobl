'use client';

import { Input, Select, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './PeopleFilters.css';

export type PeopleSort = 'credits' | 'az' | 'za';

export interface PeopleFiltersProps {
  /** Nacionalidades disponibles. Si viene vacio, no se muestra el filtro. */
  nationalities?: string[];
  query: string;
  onQueryChange: (value: string) => void;
  sort: PeopleSort;
  onSortChange: (value: PeopleSort) => void;
  nationality?: string;
  onNationalityChange: (value: string | undefined) => void;
  /** Si hay algo que limpiar; decide si se muestra el boton. */
  hasFilters: boolean;
  onClear: () => void;
  /** Total de resultados, ya interpolado y traducido. */
  resultsLabel: string;
}

/**
 * Filtros de los indices de personas.
 *
 * Controlado por PeopleIndexShell, que tiene la lista completa en memoria y
 * filtra ahi. Antes este componente empujaba ?q=&sort=&nationality=&page= al
 * router y el filtrado ocurria en el servidor; eso hacia dinamicas las tres
 * rutas y era el motivo de que cada visita costara un render y varias
 * consultas. Sin round-trip tampoco hace falta el debounce que habia aca: el
 * filtro corre sobre un array ya cargado. El shell sigue reflejando el estado
 * en la URL con replaceState, asi que los links con ?q= siguen andando.
 */
export function PeopleFilters({
  nationalities = [],
  query,
  onQueryChange,
  sort,
  onSortChange,
  nationality,
  onNationalityChange,
  hasFilters,
  onClear,
  resultsLabel,
}: PeopleFiltersProps) {
  const { t } = useLocale();

  return (
    <div className="people-filters">
      <Input
        allowClear
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        prefix={<SearchOutlined />}
        placeholder={t('peopleIndex.searchPlaceholder')}
        className="people-filters__search"
        aria-label={t('peopleIndex.searchPlaceholder')}
      />

      <Select
        value={sort}
        onChange={onSortChange}
        aria-label={t('peopleIndex.sortLabel')}
        className="people-filters__sort"
        options={[
          { value: 'credits', label: t('peopleIndex.sortCredits') },
          { value: 'az', label: t('peopleIndex.sortAZ') },
          { value: 'za', label: t('peopleIndex.sortZA') },
        ]}
      />

      {nationalities.length > 0 && (
        <Select
          value={nationality}
          onChange={(v) => onNationalityChange(v ?? undefined)}
          allowClear
          placeholder={t('peopleIndex.nationalityAll')}
          className="people-filters__nationality"
          options={nationalities.map((n) => ({ value: n, label: n }))}
        />
      )}

      {hasFilters && (
        <Button type="link" size="small" onClick={onClear}>
          {t('peopleIndex.clearFilters')}
        </Button>
      )}

      <span className="people-filters__count">{resultsLabel}</span>
    </div>
  );
}
