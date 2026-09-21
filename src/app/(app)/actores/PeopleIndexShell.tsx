'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SectionHeader, EmptyState } from '@/components/design-system';
import {
  PeopleFilters,
  type PeopleSort,
} from '@/components/people/PeopleFilters/PeopleFilters';
import { PersonCard } from '@/components/people/PersonCard/PersonCard';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import type { TranslationKey } from '@/i18n/messages';
import '@/components/people/people-grid.css';

/** Datos planos de una card. El shell les pone el texto traducido. */
export interface PeopleIndexItem {
  id: number;
  href: string;
  name: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  count: number;
  /** false => se marca la ficha como incompleta. */
  indexable: boolean;
  /** Solo para el filtro por nacionalidad; las productoras no lo usan. */
  nationality?: string | null;
}

export interface PeopleIndexShellProps {
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  /** 'peopleIndex.creditsCount' para personas, '...seriesCount' para estudios. */
  countKey: TranslationKey;
  /** TODAS las fichas, ya ordenadas por creditos desde el servidor. */
  items: PeopleIndexItem[];
  nationalities?: string[];
  current: '/actores' | '/directores' | '/productoras';
  avatarShape?: 'circle' | 'square';
}

const CROSSLINKS: { href: string; key: TranslationKey }[] = [
  { href: '/actores', key: 'peopleIndex.actorsTitle' },
  { href: '/directores', key: 'peopleIndex.directorsTitle' },
  { href: '/productoras', key: 'peopleIndex.companiesTitle' },
];

const SORTS: PeopleSort[] = ['credits', 'az', 'za'];

/**
 * Minusculas y sin diacriticos, para que "penpak" encuentre "Penpak". No se
 * usa `slugify` de lib/slug.ts porque ese colapsa todo lo no alfanumerico a
 * guiones, y eso rompe la busqueda por subcadena a mitad de palabra.
 */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Chrome + cards de los tres indices.
 *
 * Es cliente porque el locale vive en localStorage y solo se conoce despues de
 * hidratar: si el servidor armara los textos, todo quedaria en español fijo.
 * Por eso recibe DATOS planos (`items`) y no JSX ya renderizado — asi los
 * contadores ("6 titulos") se interpolan en el idioma activo.
 *
 * Recibe la lista COMPLETA y filtra/ordena en memoria. Antes paginaba y
 * filtraba en el servidor via searchParams, lo que volvia las tres rutas 100%
 * dinamicas: su `export const revalidate` no aplicaba y cada visita —incluida
 * la de cada crawler paginando el indice— pagaba un render y consultas con
 * subconsultas correlacionadas por fila. El motivo original de filtrar en el
 * servidor era no mandar ~1.200 personas al cliente, pero el row traia
 * `biography`; hoy no hay ni una bio ni una foto cargada, asi que la lista
 * entera son ~15KB gzip. Renderizarla completa ademas MEJORA el grafo interno
 * de links: el crawler llega a cada ficha en un hop en vez de 26 paginas.
 */
export function PeopleIndexShell({
  titleKey,
  subtitleKey,
  countKey,
  items,
  nationalities,
  current,
  avatarShape = 'circle',
}: PeopleIndexShellProps) {
  const { t } = useLocale();

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<PeopleSort>('credits');
  const [nationality, setNationality] = useState<string | undefined>();
  // Hasta que no leimos la URL no la reescribimos: los dos efectos de abajo
  // corren en el mismo commit y sin esta guarda el de escritura borraria los
  // filtros del link que el usuario acaba de abrir.
  const [hydrated, setHydrated] = useState(false);

  // Los filtros siguen viviendo en la URL para que un link con ?q= siga
  // siendo compartible, pero se leen y escriben en el cliente: con
  // useSearchParams() la pagina se caeria a render dinamico y volveriamos al
  // problema que este cambio viene a resolver.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get('q');
    const s = sp.get('sort');
    const nat = sp.get('nationality');
    // startTransition: esto corre una sola vez al montar y solo siembra el
    // estado inicial, pero sin el la regla de cascading renders marca el
    // setState sincronico dentro del efecto. Mismo patron que
    // src/hooks/useUnreadNotifications.ts.
    startTransition(() => {
      if (q) setQuery(q);
      if (s && SORTS.includes(s as PeopleSort)) setSort(s as PeopleSort);
      if (nat) setNationality(nat);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const sp = new URLSearchParams();
    if (query.trim()) sp.set('q', query.trim());
    if (sort !== 'credits') sp.set('sort', sort);
    if (nationality) sp.set('nationality', nationality);
    const qs = sp.toString();
    // replaceState y no router.replace: no queremos re-render del servidor ni
    // ensuciar el historial con una entrada por tecla.
    window.history.replaceState(
      null,
      '',
      qs ? `?${qs}` : window.location.pathname
    );
  }, [query, sort, nationality, hydrated]);

  // Se normaliza una sola vez por lista, no una vez por tecla.
  const haystacks = useMemo(
    () => items.map((i) => normalize(`${i.name} ${i.subtitle ?? ''}`)),
    [items]
  );

  const visible = useMemo(() => {
    const needle = normalize(query.trim());
    const filtered = items.filter((item, idx) => {
      if (nationality && item.nationality !== nationality) return false;
      if (needle && !haystacks[idx].includes(needle)) return false;
      return true;
    });

    // 'credits' es el orden en que ya vienen del servidor: no hace falta
    // reordenar, y asi el caso por defecto no paga un sort de ~1.200 items.
    if (sort === 'credits') return filtered;
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    return sort === 'za' ? sorted.reverse() : sorted;
  }, [items, haystacks, query, nationality, sort]);

  const hasFilters = Boolean(query.trim() || nationality || sort !== 'credits');

  return (
    <div className="people-page">
      <div className="people-page__header">
        <SectionHeader
          as="h1"
          size="lg"
          title={t(titleKey)}
          subtitle={t(subtitleKey)}
        />
      </div>

      <nav className="people-page__crosslinks" aria-label={t(titleKey)}>
        {CROSSLINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            prefetch={false}
            className={`people-page__crosslink${
              link.href === current ? ' people-page__crosslink--active' : ''
            }`}
            aria-current={link.href === current ? 'page' : undefined}
          >
            {t(link.key)}
          </Link>
        ))}
      </nav>

      <PeopleFilters
        nationalities={nationalities}
        query={query}
        onQueryChange={setQuery}
        sort={sort}
        onSortChange={setSort}
        nationality={nationality}
        onNationalityChange={setNationality}
        hasFilters={hasFilters}
        onClear={() => {
          setQuery('');
          setSort('credits');
          setNationality(undefined);
        }}
        resultsLabel={interpolateMessage(t('peopleIndex.resultsCount'), {
          n: String(visible.length),
        })}
      />

      {visible.length === 0 ? (
        <EmptyState
          title={t('peopleIndex.emptyTitle')}
          description={t('peopleIndex.emptyDescription')}
        />
      ) : (
        <div className="people-grid">
          {visible.map((item) => (
            <PersonCard
              key={item.id}
              href={item.href}
              name={item.name}
              subtitle={item.subtitle}
              imageUrl={item.imageUrl}
              shape={avatarShape}
              creditsLabel={interpolateMessage(t(countKey), {
                n: String(item.count),
              })}
              incompleteLabel={
                item.indexable ? undefined : t('peopleIndex.incompleteBadge')
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
