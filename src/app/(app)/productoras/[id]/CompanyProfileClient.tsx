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
} from '@/components/design-system';
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
    </div>
  );
}
