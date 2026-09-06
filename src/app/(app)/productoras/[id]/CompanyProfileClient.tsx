'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  VideoCameraOutlined,
  GlobalOutlined,
  YoutubeOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import {
  PanelCard,
  SectionHeader,
  Chip,
  EmptyState,
  MediaCard,
  useQuickPreviewController,
} from '@/components/design-system';
import type { QuickPreviewData } from '@/components/design-system';
import { isSupabaseImageUrl, cardImageUrl } from '@/lib/image-helpers';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import type { TranslationKey } from '@/i18n/messages';
import './company-profile.css';

interface CompanySeries {
  id: number;
  title: string;
  year?: number | null;
  type: string;
  imageUrl?: string | null;
  imageThumbUrl?: string | null;
  synopsis?: string | null;
  country?: { name: string; code?: string | null } | null;
}

export interface CompanyProfileClientProps {
  company: {
    id: number;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    websiteUrl?: string | null;
    youtubeUrl?: string | null;
    foundedYear?: number | null;
    countryName?: string | null;
    series: CompanySeries[];
  };
}

/** Tipo de contenido -> clave i18n ya existente en seriesHeader. */
const TYPE_KEYS: Record<string, TranslationKey> = {
  serie: 'seriesHeader.typeSerie',
  pelicula: 'seriesHeader.typePelicula',
  corto: 'seriesHeader.typeCorto',
  especial: 'seriesHeader.typeEspecial',
  anime: 'seriesHeader.typeAnime',
  reality: 'seriesHeader.typeReality',
};

export function CompanyProfileClient({ company }: CompanyProfileClientProps) {
  const { t } = useLocale();

  // Vista rapida de cada titulo del catalogo de la productora: sinopsis y
  // datos sin abandonar la ficha. El chip de pais salta al catalogo ya
  // filtrado por ese pais.
  const previewApi = useQuickPreviewController({
    labels: {
      close: t('quickPreview.close'),
      synopsis: t('quickPreview.synopsis'),
      noSynopsis: t('quickPreview.noSynopsis'),
      moreInfo: t('quickPreview.moreInfo'),
    },
  });

  const buildSeriesPreview = (serie: CompanySeries): QuickPreviewData => ({
    id: String(serie.id),
    title: serie.title,
    imageUrl: cardImageUrl(serie),
    coverAspect: '16:9',
    badges: TYPE_KEYS[serie.type]
      ? [
          {
            key: 'type',
            label: t(TYPE_KEYS[serie.type]),
            color: 'purple',
          },
        ]
      : [],
    meta: (
      <>
        {serie.year && <span>{serie.year}</span>}
        {serie.country?.name && <span>{serie.country.name}</span>}
        <span>{company.name}</span>
      </>
    ),
    synopsis: serie.synopsis,
    facts: [
      ...(serie.year
        ? [{ key: 'year', label: t('quickPreview.year'), value: serie.year }]
        : []),
      {
        key: 'company',
        label: t('quickPreview.company'),
        value: company.name,
      },
    ],
    chipGroups: serie.country?.name
      ? [
          {
            key: 'country',
            label: t('quickPreview.country'),
            chips: [
              {
                key: `country-${serie.country.name}`,
                label: serie.country.name,
                href: `/catalogo?country=${encodeURIComponent(serie.country.name)}`,
              },
            ],
          },
        ]
      : [],
    actions: [
      {
        key: 'detail',
        label: t('quickPreview.fullDetail'),
        variant: 'primary' as const,
        href: `/series/${serie.id}`,
      },
    ],
  });

  const filmography = [...company.series].sort((a, b) => {
    if (a.year && b.year) return b.year - a.year;
    if (a.year) return -1;
    if (b.year) return 1;
    return a.title.localeCompare(b.title);
  });

  const links = [
    company.websiteUrl && {
      url: company.websiteUrl,
      label: t('companyProfile.websiteLabel'),
      icon: <GlobalOutlined />,
    },
    company.youtubeUrl && {
      url: company.youtubeUrl,
      label: t('companyProfile.youtubeLabel'),
      icon: <YoutubeOutlined />,
    },
  ].filter(Boolean) as {
    url: string;
    label: string;
    icon: ReactNode;
  }[];

  return (
    <div className="company-profile">
      <PanelCard padding="md">
        <div className="company-profile__header">
          <span className="company-profile__logo" aria-hidden="true">
            {company.imageUrl ? (
              <Image
                src={company.imageUrl}
                alt=""
                fill
                sizes="96px"
                unoptimized={isSupabaseImageUrl(company.imageUrl)}
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <VideoCameraOutlined />
            )}
          </span>

          <div className="company-profile__info">
            <h1 className="company-profile__name">{company.name}</h1>
            <div className="company-profile__meta">
              {company.countryName && (
                <Chip size="sm" tone="info">
                  {company.countryName}
                </Chip>
              )}
              {company.foundedYear && (
                <Chip size="sm" tone="neutral" icon={<CalendarOutlined />}>
                  {`${t('companyProfile.foundedLabel')} ${company.foundedYear}`}
                </Chip>
              )}
              <Chip size="sm" tone="neutral">
                {interpolateMessage(t('companyProfile.seriesCount'), {
                  n: String(filmography.length),
                })}
              </Chip>
            </div>

            {links.length > 0 && (
              <nav className="company-profile__links">
                {links.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="company-profile__link"
                  >
                    {l.icon} {l.label}
                  </a>
                ))}
              </nav>
            )}
          </div>
        </div>

        {company.description && (
          <p className="company-profile__description">{company.description}</p>
        )}
      </PanelCard>

      <PanelCard padding="md" className="company-profile__catalog">
        <SectionHeader
          as="h2"
          title={t('companyProfile.catalogTitle')}
          subtitle={interpolateMessage(t('companyProfile.seriesCount'), {
            n: String(filmography.length),
          })}
        />

        {filmography.length === 0 ? (
          <EmptyState
            title={t('companyProfile.catalogTitle')}
            description={t('companyProfile.catalogEmpty')}
            fullHeight={false}
          />
        ) : (
          <div className="company-profile__grid">
            {filmography.map((s) => (
              <MediaCard
                key={s.id}
                href={`/series/${s.id}`}
                imageUrl={cardImageUrl(s)}
                imageAlt={s.title}
                unoptimizedImage={isSupabaseImageUrl(cardImageUrl(s))}
                preview={{
                  api: previewApi,
                  getData: () => buildSeriesPreview(s),
                  openLabel: t('quickPreview.open'),
                }}
                title={s.title}
                subtitle={
                  [s.year ? String(s.year) : null, s.country?.name]
                    .filter(Boolean)
                    .join(' · ') || undefined
                }
                overlayTags={
                  TYPE_KEYS[s.type] ? (
                    <Chip size="sm" tone="accent">
                      {t(TYPE_KEYS[s.type])}
                    </Chip>
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </PanelCard>

      <div className="company-profile__back">
        <Link href="/productoras" prefetch={false}>
          {t('companyProfile.backToIndex')}
        </Link>
      </div>

      {previewApi.overlays}
    </div>
  );
}
