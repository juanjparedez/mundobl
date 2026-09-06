'use client';

import { Avatar, Card, Tag, Row, Col, Empty, Tooltip } from 'antd';
import {
  UserOutlined,
  LinkOutlined,
  TrophyOutlined,
  CalendarOutlined,
  StarFilled,
} from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import { isSupabaseImageUrl, cardImageUrl } from '@/lib/image-helpers';
import { Chip } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import type { TranslationKey } from '@/i18n/messages';
import './director-profile.css';

interface DirectorSeries {
  id: number;
  title: string;
  year?: number | null;
  type: string;
  imageUrl?: string | null;
  imageThumbUrl?: string | null;
  overallRating?: number | null;
  country?: { name: string } | null;
}

interface DirectorData {
  id: number;
  name: string;
  nationality?: string | null;
  imageUrl?: string | null;
  biography?: string | null;
  aliases?: string[];
  imdbUrl?: string | null;
  mdlUrl?: string | null;
  wikiUrl?: string | null;
  birthYear?: number | null;
  awards?: string[];
  series: Array<{ series: DirectorSeries }>;
}

// Umbral minimo: solo mostramos "Obras destacadas" si al menos 2 series tienen
// overallRating cargado. Si no hay suficiente data, no inventamos un top.
const FEATURED_MIN_RATED = 2;
const FEATURED_TAKE = 3;

interface DirectorProfileClientProps {
  director: DirectorData;
  /** Si esta persona tambien figura como actriz/actor, su id para cross-link. */
  actorId?: number | null;
}

/** Tipo de contenido -> clave i18n ya existente en seriesHeader. Antes esto
 *  era un mapa a colores fijos de antd ('blue', 'purple'...), que ignoraban
 *  los tokens y rompian los skins. */
const TYPE_KEYS: Record<string, TranslationKey> = {
  serie: 'seriesHeader.typeSerie',
  pelicula: 'seriesHeader.typePelicula',
  corto: 'seriesHeader.typeCorto',
  especial: 'seriesHeader.typeEspecial',
  anime: 'seriesHeader.typeAnime',
  reality: 'seriesHeader.typeReality',
};

export function DirectorProfileClient({
  director,
  actorId,
}: DirectorProfileClientProps) {
  const { t } = useLocale();
  const filmography = director.series
    .map((entry) => entry.series)
    .sort((a, b) => {
      if (a.year && b.year) return b.year - a.year;
      if (a.year) return -1;
      if (b.year) return 1;
      return a.title.localeCompare(b.title);
    });

  const externalLinks = [
    director.imdbUrl && {
      url: director.imdbUrl,
      label: t('directorProfile.linkImdb'),
    },
    director.mdlUrl && {
      url: director.mdlUrl,
      label: t('directorProfile.linkMdl'),
    },
    director.wikiUrl && {
      url: director.wikiUrl,
      label: t('directorProfile.linkWiki'),
    },
  ].filter((x): x is { url: string; label: string } => !!x);

  const aliases = director.aliases ?? [];
  const awards = director.awards ?? [];

  const ratedSeries = filmography.filter(
    (s): s is DirectorSeries & { overallRating: number } =>
      typeof s.overallRating === 'number'
  );
  const featuredWorks =
    ratedSeries.length >= FEATURED_MIN_RATED
      ? [...ratedSeries]
          .sort((a, b) => b.overallRating - a.overallRating)
          .slice(0, FEATURED_TAKE)
      : [];

  return (
    <div className="director-profile">
      <Card>
        <div className="director-profile__header">
          {director.imageUrl ? (
            <Avatar
              src={director.imageUrl}
              size={120}
              className="director-profile__avatar"
            />
          ) : (
            <Avatar
              icon={<UserOutlined />}
              size={120}
              className="director-profile__avatar"
            />
          )}
          <div className="director-profile__info">
            <h1 className="director-profile__name">{director.name}</h1>
            {aliases.length > 0 && (
              <div
                className="director-profile__aliases"
                aria-label={t('directorProfile.aliasesLabel')}
              >
                {aliases.map((alias) => (
                  <Chip key={alias} tone="neutral" size="sm">
                    {alias}
                  </Chip>
                ))}
              </div>
            )}
            <div className="director-profile__meta">
              {director.nationality && (
                <Chip tone="info" size="sm">
                  {director.nationality}
                </Chip>
              )}
              {director.birthYear && (
                <Tag icon={<CalendarOutlined />}>
                  {interpolateMessage(t('directorProfile.birthYear'), {
                    year: director.birthYear,
                  })}
                </Tag>
              )}
              <Chip tone="neutral" size="sm">
                {interpolateMessage(t('directorProfile.seriesDirected'), {
                  n: String(filmography.length),
                })}
              </Chip>
            </div>
            {externalLinks.length > 0 && (
              <nav
                className="director-profile__links"
                aria-label={t('directorProfile.linksLabel')}
              >
                {externalLinks.map((link) => (
                  <Tooltip key={link.url} title={link.label}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="director-profile__link"
                      aria-label={link.label}
                    >
                      <LinkOutlined /> <span>{link.label}</span>
                    </a>
                  </Tooltip>
                ))}
              </nav>
            )}

            {actorId && (
              <p className="director-profile__crosslink">
                <Link href={`/actores/${actorId}`} prefetch={false}>
                  {t('directorProfile.alsoActed')}
                </Link>
              </p>
            )}
          </div>
        </div>

        {director.biography && (
          <div className="director-profile__biography">
            <h3>{t('directorProfile.biographyTitle')}</h3>
            <p>{director.biography}</p>
          </div>
        )}

        {awards.length > 0 && (
          <div className="director-profile__awards">
            <h3>
              <TrophyOutlined /> {t('directorProfile.awardsTitle')}
            </h3>
            <ul className="director-profile__awards-list">
              {awards.map((award) => (
                <li key={award}>{award}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {featuredWorks.length > 0 && (
        <Card
          title={
            <>
              <StarFilled className="director-profile__featured-icon" />{' '}
              {t('directorProfile.featuredWorksTitle')}
            </>
          }
          className="director-profile__featured"
        >
          <Row gutter={[16, 16]}>
            {featuredWorks.map((entry) => (
              <Col xs={24} sm={12} md={8} key={entry.id}>
                <Link href={`/series/${entry.id}`}>
                  <Card
                    hoverable
                    size="small"
                    className="director-profile__film-card director-profile__featured-card"
                    cover={
                      cardImageUrl(entry) ? (
                        <Image
                          alt={entry.title}
                          src={cardImageUrl(entry)!}
                          width={300}
                          height={180}
                          quality={75}
                          unoptimized={isSupabaseImageUrl(cardImageUrl(entry))}
                          className="director-profile__film-image"
                          style={{
                            objectFit: 'cover',
                            width: '100%',
                            height: 'auto',
                          }}
                        />
                      ) : undefined
                    }
                  >
                    <Card.Meta
                      title={entry.title}
                      description={
                        <div className="director-profile__film-tags">
                          <Tag
                            color="gold"
                            icon={<StarFilled />}
                            className="director-profile__rating-tag"
                          >
                            {(entry.overallRating / 10).toFixed(1)}
                          </Tag>
                          {entry.year && <Tag>{entry.year}</Tag>}
                          {entry.country && (
                            <span className="director-profile__country">
                              {entry.country.name}
                            </span>
                          )}
                        </div>
                      }
                    />
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Card
        title={`${t('directorProfile.filmographyTitle')} (${filmography.length})`}
        className="director-profile__filmography"
      >
        {filmography.length === 0 ? (
          <Empty description={t('directorProfile.filmographyEmpty')} />
        ) : (
          <Row gutter={[16, 16]}>
            {filmography.map((entry) => (
              <Col xs={24} sm={12} md={8} lg={6} key={entry.id}>
                <Link href={`/series/${entry.id}`}>
                  <Card
                    hoverable
                    size="small"
                    className="director-profile__film-card"
                    cover={
                      cardImageUrl(entry) ? (
                        <Image
                          alt={entry.title}
                          src={cardImageUrl(entry)!}
                          width={300}
                          height={180}
                          quality={70}
                          unoptimized={isSupabaseImageUrl(cardImageUrl(entry))}
                          className="director-profile__film-image"
                          style={{
                            objectFit: 'cover',
                            width: '100%',
                            height: 'auto',
                          }}
                        />
                      ) : undefined
                    }
                  >
                    <Card.Meta
                      title={entry.title}
                      description={
                        <div className="director-profile__film-tags">
                          {TYPE_KEYS[entry.type] && (
                            <Chip tone="accent" size="sm">
                              {t(TYPE_KEYS[entry.type])}
                            </Chip>
                          )}
                          {entry.year && <Tag>{entry.year}</Tag>}
                          {entry.country && (
                            <span className="director-profile__country">
                              {entry.country.name}
                            </span>
                          )}
                        </div>
                      }
                    />
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <div className="director-profile__back">
        <Link href="/directores" prefetch={false}>
          {t('directorProfile.backToIndex')}
        </Link>
      </div>
    </div>
  );
}
