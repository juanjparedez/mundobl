'use client';

import Link from 'next/link';
import { SectionHeader, EmptyState } from '@/components/design-system';
import { PeopleFilters } from '@/components/people/PeopleFilters/PeopleFilters';
import { PersonCard } from '@/components/people/PersonCard/PersonCard';
import { PeoplePagination } from '@/components/people/PeoplePagination/PeoplePagination';
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
}

export interface PeopleIndexShellProps {
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  /** 'peopleIndex.creditsCount' para personas, '...seriesCount' para estudios. */
  countKey: TranslationKey;
  items: PeopleIndexItem[];
  total: number;
  page: number;
  totalPages: number;
  /** Hrefs de paginacion, ya calculados en el servidor. */
  prevHref: string;
  nextHref: string;
  nationalities?: string[];
  current: '/actores' | '/directores' | '/productoras';
  avatarShape?: 'circle' | 'square';
}

const CROSSLINKS: { href: string; key: TranslationKey }[] = [
  { href: '/actores', key: 'peopleIndex.actorsTitle' },
  { href: '/directores', key: 'peopleIndex.directorsTitle' },
  { href: '/productoras', key: 'peopleIndex.companiesTitle' },
];

/**
 * Chrome + cards de los tres indices.
 *
 * Es cliente porque el locale vive en localStorage y solo se conoce despues de
 * hidratar: si el servidor armara los textos, todo quedaria en español fijo.
 * Por eso recibe DATOS planos (`items`) y no JSX ya renderizado — asi los
 * contadores ("6 titulos") se interpolan en el idioma activo.
 */
export function PeopleIndexShell({
  titleKey,
  subtitleKey,
  countKey,
  items,
  total,
  page,
  totalPages,
  prevHref,
  nextHref,
  nationalities,
  current,
  avatarShape = 'circle',
}: PeopleIndexShellProps) {
  const { t } = useLocale();

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
        resultsLabel={interpolateMessage(t('peopleIndex.resultsCount'), {
          n: String(total),
        })}
      />

      {items.length === 0 ? (
        <EmptyState
          title={t('peopleIndex.emptyTitle')}
          description={t('peopleIndex.emptyDescription')}
        />
      ) : (
        <>
          <div className="people-grid">
            {items.map((item) => (
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

          <PeoplePagination
            page={page}
            totalPages={totalPages}
            prevHref={prevHref}
            nextHref={nextHref}
            prevLabel={t('peopleIndex.prevPage')}
            nextLabel={t('peopleIndex.nextPage')}
            indicatorLabel={interpolateMessage(t('peopleIndex.pageIndicator'), {
              current: String(page),
              total: String(totalPages),
            })}
          />
        </>
      )}
    </div>
  );
}
