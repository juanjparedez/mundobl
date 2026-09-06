'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  UserOutlined,
  CalendarOutlined,
  BulbOutlined,
  VideoCameraOutlined,
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
import { getSeriesUrl } from '@/lib/slug';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import type { TranslationKey } from '@/i18n/messages';
import './actor-profile.css';

/** Una entrada de filmografia ya deduplicada en el servidor. */
export interface FilmographyEntry {
  seriesId: number;
  title: string;
  year?: number | null;
  type: string;
  imageUrl?: string | null;
  imageThumbUrl?: string | null;
  countryName?: string | null;
  synopsis?: string | null;
  characters: string[];
  isMain: boolean;
}

export interface ActorProfileClientProps {
  actor: {
    id: number;
    name: string;
    stageName?: string | null;
    birthDate?: string | null;
    nationality?: string | null;
    imageUrl?: string | null;
    biography?: string | null;
    funFacts?: string[];
    aliases?: string[];
    imdbUrl?: string | null;
    mdlUrl?: string | null;
    wikiUrl?: string | null;
  };
  filmography: FilmographyEntry[];
  /** Si esta persona tambien figura como directora, su id para cross-link. */
  directorId?: number | null;
}

const TYPE_KEYS: Record<string, TranslationKey> = {
  serie: 'seriesHeader.typeSerie',
  pelicula: 'seriesHeader.typePelicula',
  corto: 'seriesHeader.typeCorto',
  especial: 'seriesHeader.typeEspecial',
  anime: 'seriesHeader.typeAnime',
  reality: 'seriesHeader.typeReality',
};

export function ActorProfileClient({
  actor,
  filmography,
  directorId,
}: ActorProfileClientProps) {
  const { t, locale } = useLocale();

  // Vista rapida de cada titulo de la filmografia: sinopsis, personaje y
  // pais sin tener que abrir la ficha de la serie y perder el lugar en la
  // lista. El chip de pais lleva al catalogo ya filtrado.
  const previewApi = useQuickPreviewController({
    labels: {
      close: t('quickPreview.close'),
      synopsis: t('quickPreview.synopsis'),
      noSynopsis: t('quickPreview.noSynopsis'),
      moreInfo: t('quickPreview.moreInfo'),
    },
    surface: 'actores',
  });

  const buildEntryPreview = (entry: FilmographyEntry): QuickPreviewData => ({
    id: String(entry.seriesId),
    title: entry.title,
    imageUrl: cardImageUrl(entry),
    coverAspect: '16:9',
    badges: [
      ...(TYPE_KEYS[entry.type]
        ? [
            {
              key: 'type',
              label: t(TYPE_KEYS[entry.type]),
              color: 'purple',
            },
          ]
        : []),
      ...(entry.isMain
        ? [
            {
              key: 'main',
              label: t('actorProfile.mainRole'),
              color: 'success',
            },
          ]
        : []),
    ],
    meta: (
      <>
        {entry.year && <span>{entry.year}</span>}
        {entry.countryName && <span>{entry.countryName}</span>}
      </>
    ),
    synopsis: entry.synopsis,
    facts:
      entry.characters.length > 0
        ? [
            {
              key: 'character',
              label: t('quickPreview.character'),
              value: entry.characters.join(', '),
            },
          ]
        : [],
    chipGroups: entry.countryName
      ? [
          {
            key: 'country',
            label: t('quickPreview.country'),
            chips: [
              {
                key: `country-${entry.countryName}`,
                label: entry.countryName,
                href: `/catalogo?country=${encodeURIComponent(entry.countryName)}`,
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
        href: getSeriesUrl(entry.seriesId, entry.title),
      },
    ],
  });

  // El formato de fecha sigue al locale activo, no a un 'es-ES' fijo.
  const birthDate = actor.birthDate
    ? new Date(actor.birthDate).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const links = [
    actor.imdbUrl && {
      url: actor.imdbUrl,
      label: t('directorProfile.linkImdb'),
    },
    actor.mdlUrl && { url: actor.mdlUrl, label: t('directorProfile.linkMdl') },
    actor.wikiUrl && {
      url: actor.wikiUrl,
      label: t('directorProfile.linkWiki'),
    },
  ].filter((x): x is { url: string; label: string } => Boolean(x));

  const aliases = actor.aliases ?? [];
  const funFacts = actor.funFacts ?? [];

  return (
    <div className="actor-profile">
      <PanelCard padding="md">
        <div className="actor-profile__header">
          <span className="actor-profile__avatar" aria-hidden="true">
            {actor.imageUrl ? (
              <Image
                src={actor.imageUrl}
                alt=""
                fill
                sizes="120px"
                unoptimized={isSupabaseImageUrl(actor.imageUrl)}
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <UserOutlined />
            )}
          </span>

          <div className="actor-profile__info">
            <h1 className="actor-profile__name">{actor.name}</h1>
            {actor.stageName && (
              <p className="actor-profile__stage-name">{actor.stageName}</p>
            )}

            <div className="actor-profile__meta">
              {actor.nationality && (
                <Chip size="sm" tone="info">
                  {actor.nationality}
                </Chip>
              )}
              {birthDate && (
                <Chip size="sm" tone="neutral" icon={<CalendarOutlined />}>
                  {birthDate}
                </Chip>
              )}
              <Chip size="sm" tone="neutral">
                {interpolateMessage(t('actorProfile.participations'), {
                  n: String(filmography.length),
                })}
              </Chip>
            </div>

            {aliases.length > 0 && (
              <p className="actor-profile__aliases">
                <span className="actor-profile__label">
                  {t('actorProfile.aliasesTitle')}:
                </span>{' '}
                {aliases.join(' · ')}
              </p>
            )}

            {links.length > 0 && (
              <nav
                className="actor-profile__links"
                aria-label={t('actorProfile.externalLinksTitle')}
              >
                {links.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="actor-profile__link"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
            )}

            {directorId && (
              <p className="actor-profile__crosslink">
                <Link href={`/directores/${directorId}`} prefetch={false}>
                  <VideoCameraOutlined /> {t('actorProfile.alsoDirected')}
                </Link>
              </p>
            )}
          </div>
        </div>

        {actor.biography && (
          <div className="actor-profile__biography">
            <h2 className="actor-profile__section-title">
              {t('actorProfile.biographyTitle')}
            </h2>
            <p>{actor.biography}</p>
          </div>
        )}
      </PanelCard>

      {funFacts.length > 0 && (
        <PanelCard padding="md">
          <SectionHeader as="h2" title={t('actorProfile.funFactsTitle')} />
          <ul className="actor-profile__fun-facts-list">
            {funFacts.map((fact, idx) => (
              <li key={idx}>
                <BulbOutlined className="actor-profile__fun-fact-icon" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </PanelCard>
      )}

      <PanelCard padding="md">
        <SectionHeader
          as="h2"
          title={t('actorProfile.filmographyTitle')}
          subtitle={interpolateMessage(t('actorProfile.participations'), {
            n: String(filmography.length),
          })}
        />

        {filmography.length === 0 ? (
          <EmptyState
            title={t('actorProfile.filmographyTitle')}
            description={t('actorProfile.filmographyEmpty')}
            fullHeight={false}
          />
        ) : (
          <div className="actor-profile__grid">
            {filmography.map((entry) => (
              <MediaCard
                key={entry.seriesId}
                href={getSeriesUrl(entry.seriesId, entry.title)}
                imageUrl={cardImageUrl(entry)}
                imageAlt={entry.title}
                unoptimizedImage={isSupabaseImageUrl(cardImageUrl(entry))}
                preview={{
                  api: previewApi,
                  getData: () => buildEntryPreview(entry),
                  openLabel: t('quickPreview.open'),
                }}
                title={entry.title}
                subtitle={
                  [entry.year ? String(entry.year) : null, entry.countryName]
                    .filter(Boolean)
                    .join(' · ') || undefined
                }
                description={
                  entry.characters.length > 0
                    ? entry.characters.join(', ')
                    : undefined
                }
                overlayTags={
                  <>
                    {TYPE_KEYS[entry.type] && (
                      <Chip size="sm" tone="accent">
                        {t(TYPE_KEYS[entry.type])}
                      </Chip>
                    )}
                    {entry.isMain && (
                      <Chip size="sm" tone="success">
                        {t('actorProfile.mainRole')}
                      </Chip>
                    )}
                  </>
                }
              />
            ))}
          </div>
        )}
      </PanelCard>

      <div className="actor-profile__back">
        <Link href="/actores" prefetch={false}>
          {t('actorProfile.backToIndex')}
        </Link>
      </div>

      {previewApi.overlays}
    </div>
  );
}
