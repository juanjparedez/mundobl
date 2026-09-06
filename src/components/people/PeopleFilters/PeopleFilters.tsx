'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Input, Select, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './PeopleFilters.css';

export interface PeopleFiltersProps {
  /** Nacionalidades disponibles. Si viene vacio, no se muestra el filtro. */
  nationalities?: string[];
  /** Total de resultados, ya interpolado y traducido. */
  resultsLabel: string;
}

/**
 * Filtros de los indices de personas.
 *
 * La busqueda y el orden viven en la URL (?q=&sort=&nationality=&page=) y el
 * filtrado ocurre en el servidor, no en el navegador: son 1186 actores y
 * mandarlos todos al cliente para filtrar ahi es justo el problema que tiene
 * hoy /catalogo. Ademas asi cada busqueda es un link compartible.
 */
export function PeopleFilters({
  nationalities = [],
  resultsLabel,
}: PeopleFiltersProps) {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [term, setTerm] = useState(searchParams.get('q') ?? '');

  // Si el usuario navega con atras/adelante, el input tiene que seguir a la URL.
  useEffect(() => {
    setTerm(searchParams.get('q') ?? '');
  }, [searchParams]);

  const push = (next: URLSearchParams) => {
    // Cualquier cambio de filtro vuelve a la pagina 1: quedarse en la 7 con
    // otro filtro suele dar una pagina vacia.
    next.delete('page');
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    });
  };

  const setParam = (key: string, value?: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    push(next);
  };

  // Debounce: no disparamos una query por tecla.
  useEffect(() => {
    const current = searchParams.get('q') ?? '';
    if (term === current) return;
    const id = setTimeout(() => setParam('q', term.trim() || undefined), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const sort = searchParams.get('sort') ?? 'credits';
  const nationality = searchParams.get('nationality') ?? undefined;
  const hasFilters = Boolean(
    searchParams.get('q') || nationality || searchParams.get('sort')
  );

  return (
    <div className="people-filters" data-pending={isPending || undefined}>
      <Input
        allowClear
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        prefix={<SearchOutlined />}
        placeholder={t('peopleIndex.searchPlaceholder')}
        className="people-filters__search"
        aria-label={t('peopleIndex.searchPlaceholder')}
      />

      <Select
        value={sort}
        onChange={(v) => setParam('sort', v === 'credits' ? undefined : v)}
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
          onChange={(v) => setParam('nationality', v)}
          allowClear
          placeholder={t('peopleIndex.nationalityAll')}
          className="people-filters__nationality"
          options={nationalities.map((n) => ({ value: n, label: n }))}
        />
      )}

      {hasFilters && (
        <Button
          type="link"
          size="small"
          onClick={() => startTransition(() => router.push(pathname))}
        >
          {t('peopleIndex.clearFilters')}
        </Button>
      )}

      <span className="people-filters__count">{resultsLabel}</span>
    </div>
  );
}
