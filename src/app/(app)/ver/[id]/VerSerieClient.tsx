'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Button,
  Tag,
  Tooltip,
  Alert,
  Empty,
  Avatar,
  Segmented,
  Input,
} from 'antd';
import {
  StarFilled,
  StarOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
  UserOutlined,
  BankOutlined,
  PlayCircleOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  LockOutlined,
  CopyOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { EmbedPlayer } from '@/components/common/EmbedPlayer/EmbedPlayer';
import { EmbedAttribution } from '@/components/common/EmbedAttribution/EmbedAttribution';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { ShareButton } from '@/components/common/ShareButton/ShareButton';
import { SeriesSubscribeButton } from '@/components/series/SeriesSubscribeButton/SeriesSubscribeButton';
import { RatingSection } from '@/components/series/RatingSection';
import { ReviewsSection } from '@/components/series/ReviewsSection/ReviewsSection';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';

interface Episode {
  id: number;
  episodeNumber: number;
  title: string | null;
  synopsis: string | null;
  duration: number | null;
  embedUrl: string | null;
  embedPlatform: string | null;
  embedVideoId: string | null;
  embedChannelName: string | null;
  embedChannelUrl: string | null;
}

interface Season {
  id: number;
  seasonNumber: number;
  title: string | null;
  episodes: Episode[];
}

interface SeriesInfo {
  id: number;
  title: string;
  originalTitle: string | null;
  year: number | null;
  synopsis: string | null;
  imageUrl: string | null;
  catalogScope: string;
  origin: string;
  geoRestrictedCore: boolean;
  productionCompanyName: string | null;
  submittedByName: string | null;
  // true si quien aporto es un colaborador externo (rol COLLABORATOR,
  // ej. una productora asociada) en vez de un user comun via /ver/agregar.
  submittedByIsCollaborator: boolean;
  country: { name: string; code: string | null } | null;
  tags: string[];
  genres: string[];
  directors: string[];
  actors: Array<{
    id: number;
    name: string;
    stageName?: string | null;
    imageUrl?: string | null;
  }>;
  linkedSeries: {
    id: number;
    title: string;
    imageUrl?: string | null;
  } | null;
}

interface VerSerieClientProps {
  series: SeriesInfo;
  seasons: Season[];
}

export interface ParsedBadge {
  label: string;
  shortLabel: string;
  isExtra: boolean;
  isPrivate: boolean;
  chapterNumber: number;
  partNumber: number | null;
  partTotal: number | null;
  tagColor?: string;
  badgeText?: string;
}

export function parseEpisodeBadge(
  rawTitle: string | null,
  episodeNumber: number,
  totalEpisodesInSeason: number,
  seriesTitle?: string
): ParsedBadge {
  if (!rawTitle) {
    return {
      label: `Episodio ${episodeNumber}`,
      shortLabel: `E${episodeNumber}`,
      isExtra: false,
      isPrivate: false,
      chapterNumber: episodeNumber,
      partNumber: null,
      partTotal: null,
    };
  }

  const lower = rawTitle.toLowerCase();

  // 1. Private / Deleted videos
  if (
    lower.includes('private video') ||
    lower.includes('deleted video') ||
    lower.includes('video privado') ||
    lower.includes('private')
  ) {
    return {
      label: `Video Privado #${episodeNumber}`,
      shortLabel: `Privado #${episodeNumber}`,
      isExtra: true,
      isPrivate: true,
      chapterNumber: episodeNumber,
      partNumber: null,
      partTotal: null,
      tagColor: 'default',
      badgeText: 'Privado',
    };
  }

  // Extraer número de episodio explícito en el título (ej: "EP.6", "EP. 6", "EP6", "Episodio 6")
  const epMatch = rawTitle.match(
    /\b(?:ep|episodio|cap|capitulo)\.?\s*(\d{1,3})\b/i
  );
  const detectedEp = epMatch ? parseInt(epMatch[1], 10) : null;

  // Extraer parte (ej: [1/4], (1/4), 1/4, Part 1)
  const partMatch =
    rawTitle.match(/[\[\(](\d{1,2})\s*\/\s*(\d{1,2})[\]\)]/) ||
    rawTitle.match(
      /\b(?:part|parte|pt)\.?\s*(\d{1,2})(?:\s*\/\s*(\d{1,2}))?\b/i
    );

  // 2. Tráilers y Teasers
  if (
    lower.includes('trailer') ||
    lower.includes('teaser') ||
    rawTitle.includes('ตัวอย่าง')
  ) {
    const trailerLabel = detectedEp
      ? `Tráiler · Ep. ${detectedEp}`
      : `Tráiler #${episodeNumber}`;
    return {
      label: trailerLabel,
      shortLabel: trailerLabel,
      isExtra: true,
      isPrivate: false,
      chapterNumber: detectedEp || episodeNumber,
      partNumber: null,
      partTotal: null,
      tagColor: 'orange',
      badgeText: 'Tráiler',
    };
  }

  // 3. Detrás de cámaras y especiales
  if (
    lower.includes('behind') ||
    lower.includes('special') ||
    lower.includes('beginning') ||
    lower.includes('highlight') ||
    lower.includes('interview') ||
    lower.includes('recap')
  ) {
    return {
      label: `Extra · #${detectedEp || episodeNumber}`,
      shortLabel: `Extra #${detectedEp || episodeNumber}`,
      isExtra: true,
      isPrivate: false,
      chapterNumber: detectedEp || episodeNumber,
      partNumber: null,
      partTotal: null,
      tagColor: 'purple',
      badgeText: 'Extra',
    };
  }

  // 4. OST / Música
  if (
    lower.includes('ost') ||
    lower.includes('mv') ||
    lower.includes('music video')
  ) {
    return {
      label: `OST · #${episodeNumber}`,
      shortLabel: `OST #${episodeNumber}`,
      isExtra: true,
      isPrivate: false,
      chapterNumber: episodeNumber,
      partNumber: null,
      partTotal: null,
      tagColor: 'cyan',
      badgeText: 'Música',
    };
  }

  // 5. Partes explícitas de capítulos (ej: Cap. 8 [1/4])
  if (partMatch) {
    const partNum = parseInt(partMatch[1], 10);
    const partTotal = parseInt(partMatch[2] || '4', 10);
    const epNum = detectedEp || episodeNumber;
    return {
      label: `Capítulo ${epNum} · Parte ${partNum}/${partTotal}`,
      shortLabel: `Parte ${partNum}/${partTotal}`,
      isExtra: false,
      isPrivate: false,
      chapterNumber: epNum,
      partNumber: partNum,
      partTotal: partTotal,
    };
  }

  // 6. Si no hay parte explícita en título, pero la temporada tiene estructura secuencial de 4 partes (ej: GMMTV)
  if (totalEpisodesInSeason >= 16 && !detectedEp) {
    const derivedChapter = Math.floor((episodeNumber - 1) / 4) + 1;
    const derivedPart = ((episodeNumber - 1) % 4) + 1;
    return {
      label: `Capítulo ${derivedChapter} · Parte ${derivedPart}/4`,
      shortLabel: `Parte ${derivedPart}/4`,
      isExtra: false,
      isPrivate: false,
      chapterNumber: derivedChapter,
      partNumber: derivedPart,
      partTotal: 4,
    };
  }

  // 7. Solo capítulo
  if (detectedEp) {
    return {
      label: `Capítulo ${detectedEp}`,
      shortLabel: `Capítulo ${detectedEp}`,
      isExtra: false,
      isPrivate: false,
      chapterNumber: detectedEp,
      partNumber: null,
      partTotal: null,
    };
  }

  // 8. Limpieza de títulos repetitivos con el nombre de la serie o solo tailandés
  const isAllThai = /^[\u0E00-\u0E7F\s\W\d]+$/.test(rawTitle);
  const isRepeatedSeriesTitle =
    seriesTitle &&
    rawTitle.toLowerCase().includes(seriesTitle.toLowerCase().slice(0, 8));

  if (isAllThai || isRepeatedSeriesTitle) {
    return {
      label: `Capítulo ${episodeNumber}`,
      shortLabel: `Capítulo ${episodeNumber}`,
      isExtra: false,
      isPrivate: false,
      chapterNumber: episodeNumber,
      partNumber: null,
      partTotal: null,
    };
  }

  return {
    label: rawTitle.length > 35 ? `${rawTitle.slice(0, 32)}...` : rawTitle,
    shortLabel: rawTitle.length > 22 ? `${rawTitle.slice(0, 20)}...` : rawTitle,
    isExtra: false,
    isPrivate: false,
    chapterNumber: episodeNumber,
    partNumber: null,
    partTotal: null,
  };
}

function getYouTubeThumbnail(
  videoId: string | null | undefined
): string | null {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

export function VerSerieClient({ series, seasons }: VerSerieClientProps) {
  const { t } = useLocale();
  const { data: session, status } = useSession();
  const message = useMessage();
  const isAuthed = status === 'authenticated';
  const isAdmin = isAuthed && session?.user?.role === 'ADMIN';
  const isUserEmbed = series.origin === 'USER_EMBED';

  const flatEpisodes = useMemo(() => {
    const totalCount = seasons.reduce((acc, s) => acc + s.episodes.length, 0);
    return seasons.flatMap((s) =>
      s.episodes.map((e) => ({
        ...e,
        seasonId: s.id,
        seasonNumber: s.seasonNumber,
        parsed: parseEpisodeBadge(
          e.title,
          e.episodeNumber,
          totalCount,
          series.title
        ),
      }))
    );
  }, [seasons, series.title]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [filterMode, setFilterMode] = useState<'all' | 'episodes' | 'extras'>(
    'all'
  );
  const [scope, setScope] = useState(series.catalogScope);
  const [movingScope, setMovingScope] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Copiar el link directo del episodio activo — pedido real de usuario:
  // si el embed esta geo-bloqueado, el link crudo sirve igual para abrirlo
  // manual con VPN/otro navegador. No cuesta nada exponerlo copiable.
  const handleCopyEmbedLink = async (url: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setLinkCopied(true);
      message.success(t('verSerie.linkCopiedSuccess'));
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      message.error(t('verSerie.linkCopyError'));
    }
  };

  const active = flatEpisodes[activeIdx];
  const hasPrev = activeIdx > 0;
  const hasNext = activeIdx < flatEpisodes.length - 1;

  // Agrupación inteligente por Capítulo con miniaturas
  const { chapterGroups, extraEpisodes, privateEpisodes } = useMemo(() => {
    const map = new Map<
      number,
      Array<{
        flatIndex: number;
        episode: (typeof flatEpisodes)[0];
      }>
    >();

    const extras: Array<{
      flatIndex: number;
      episode: (typeof flatEpisodes)[0];
    }> = [];

    const privates: Array<{
      flatIndex: number;
      episode: (typeof flatEpisodes)[0];
    }> = [];

    flatEpisodes.forEach((ep, index) => {
      if (ep.parsed.isPrivate) {
        privates.push({ flatIndex: index, episode: ep });
        return;
      }

      if (ep.parsed.isExtra) {
        extras.push({ flatIndex: index, episode: ep });
        return;
      }

      const chapter = ep.parsed.chapterNumber;
      if (!map.has(chapter)) {
        map.set(chapter, []);
      }
      map.get(chapter)!.push({ flatIndex: index, episode: ep });
    });

    const chapters = Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([chapterNum, items]) => {
        // Thumbnail de la primera parte del capítulo
        const firstEp = items[0]?.episode;
        const thumbnail =
          getYouTubeThumbnail(firstEp?.embedVideoId) || series.imageUrl;
        return {
          chapterNumber: chapterNum,
          thumbnail,
          items,
        };
      });

    return {
      chapterGroups: chapters,
      extraEpisodes: extras,
      privateEpisodes: privates,
    };
  }, [flatEpisodes, series.imageUrl]);

  const handleMoveToCatalog = async () => {
    setMovingScope(true);
    try {
      const res = await fetch(`/api/series/${series.id}/scope`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catalogScope: 'PERSONAL' }),
      });
      if (!res.ok)
        throw new Error(t('verSerie.couldNotMoveSeriesToCatalogError'));
      setScope('PERSONAL');
      message.success(t('verSerie.seriesMovedToPersonalCatalogSuccess'));
    } catch {
      message.error(t('verSerie.couldNotMoveSeriesToCatalogError'));
    } finally {
      setMovingScope(false);
    }
  };

  if (!active) {
    return <Empty description={t('verSerie.noEpisodesAvailable')} />;
  }

  const extrasCount = extraEpisodes.length + privateEpisodes.length;
  const mainEpisodesCount = flatEpisodes.length - extrasCount;

  return (
    <div className="ver-serie">
      {/* Cabecera de la serie */}
      <header className="ver-serie__header">
        <div className="ver-serie__title-wrap">
          <h1 className="ver-serie__title">
            {series.country?.code && <CountryFlag code={series.country.code} />}{' '}
            {series.title}
            {series.year && (
              <span className="ver-serie__year">({series.year})</span>
            )}
          </h1>
          {series.originalTitle && (
            <p className="ver-serie__original-title">{series.originalTitle}</p>
          )}
          {series.productionCompanyName && (
            <Tag
              icon={<BankOutlined />}
              color="cyan"
              className="ver-serie__company-tag"
            >
              {series.productionCompanyName}
            </Tag>
          )}
        </div>
        <div className="ver-serie__header-actions">
          {isUserEmbed ? (
            series.submittedByIsCollaborator ? (
              <Tag color="gold">
                Contenido de {series.submittedByName ?? 'colaborador'}
              </Tag>
            ) : (
              <Tag color="purple">
                Aporte de @{series.submittedByName ?? 'usuario'}
              </Tag>
            )
          ) : scope === 'PERSONAL' ? (
            <Tooltip title={t('verSerie.inMyPersonalCatalogTooltip')}>
              <Tag icon={<StarFilled />} color="gold">
                {t('verSerie.inMyCatalogTag')}
              </Tag>
            </Tooltip>
          ) : (
            <Tag icon={<StarOutlined />} color="default">
              {t('verSerie.watchableOnlyTag')}
            </Tag>
          )}
          {!isUserEmbed && (
            <Link href={`/series/${series.id}`} prefetch={false}>
              <Button icon={<PlayCircleOutlined />}>
                {t('verSerie.viewFullDetailsButton')}
              </Button>
            </Link>
          )}
          {series.linkedSeries && (
            <Link href={`/series/${series.linkedSeries.id}`} prefetch={false}>
              <Button type="primary" ghost>
                Ficha completa en catálogo
              </Button>
            </Link>
          )}
          {isAdmin && !isUserEmbed && scope === 'WATCHABLE_ONLY' && (
            <Button
              type="primary"
              icon={<StarFilled />}
              loading={movingScope}
              onClick={handleMoveToCatalog}
            >
              {t('verSerie.moveToMyCatalogButton')}
            </Button>
          )}
          {isAdmin && isUserEmbed && (
            <Link href="/admin/series/user-submitted" prefetch={false}>
              <Button>Linkear con curada (admin)</Button>
            </Link>
          )}
          <ShareButton
            title={series.title}
            text={series.synopsis ?? undefined}
            path={`/ver/${series.id}`}
          />
          <SeriesSubscribeButton
            seriesId={series.id}
            initialSubscribed={false}
          />
        </div>
      </header>

      {/* Reproductor grande */}
      <div className="ver-serie__player-wrap">
        <EmbedPlayer
          platform={active.embedPlatform || 'YouTube'}
          url={active.embedUrl || ''}
          videoId={active.embedVideoId}
          title={active.title || series.title}
        />
      </div>

      {/* Tip de subtítulos en español */}
      <div className="ver-serie__subtitles-tip">
        <span className="ver-serie__subtitles-icon">💬</span>
        <div className="ver-serie__subtitles-text">
          <strong>Subtítulos en español:</strong> Se solicitan automáticamente
          si la plataforma oficial los tiene disponibles. Podés cambiar el
          idioma o ajustar la sincronización desde el botón{' '}
          <strong>[CC]</strong> del reproductor.
        </div>
      </div>

      {/* Tip de bloqueo regional / VPN — encabezado mas contundente cuando
       *  YA sabemos (geoRestrictedCore) que esta bloqueada en el mercado
       *  core, en vez del generico "¿el video dice...?" condicional. */}
      <div className="ver-serie__geoblock-tip">
        <span className="ver-serie__geoblock-icon">🌍</span>
        <div className="ver-serie__geoblock-text">
          {series.geoRestrictedCore ? (
            <strong>Esta serie está bloqueada en tu región.</strong>
          ) : (
            <strong>
              ¿El video dice &quot;No disponible en tu país&quot;?
            </strong>
          )}{' '}
          Algunas productoras limitan la emisión gratuita de YouTube si
          vendieron la licencia exclusiva a plataformas locales. Podés verlo con
          VPN (Tailandia, Taiwán o EE.UU.) o consultar las opciones en{' '}
          <Link
            href="/plataformas"
            style={{
              color: 'var(--primary-color)',
              textDecoration: 'underline',
            }}
          >
            Plataformas & Planes
          </Link>
          .
          {active.embedUrl && (
            <Input
              readOnly
              value={active.embedUrl}
              className="ver-serie__geoblock-link-input"
              onFocus={(e) => e.target.select()}
              addonAfter={
                <Button
                  type="text"
                  size="small"
                  icon={
                    linkCopied ? (
                      <CheckOutlined
                        style={{ color: 'var(--success-color)' }}
                      />
                    ) : (
                      <CopyOutlined />
                    )
                  }
                  onClick={() => handleCopyEmbedLink(active.embedUrl!)}
                >
                  {linkCopied
                    ? t('verSerie.linkCopiedLabel')
                    : t('verSerie.copyLinkButton')}
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Atribución de origen */}
      <div className="ver-serie__attribution-row">
        <EmbedAttribution
          platform={active.embedPlatform}
          channelName={active.embedChannelName}
          channelUrl={active.embedChannelUrl}
          originalUrl={active.embedUrl}
        />
        <Alert
          type="info"
          showIcon
          title={
            <span>
              {t('verSerie.officialPlaybackNote')}{' '}
              <Link href="/creditos">{t('verSerie.creditsLink')}</Link> ·{' '}
              <Link href="/legal">{t('verSerie.legalNoticeLink')}</Link>
            </span>
          }
          className="ver-serie__legal-note"
        />
      </div>

      {/* Controles siguiente/anterior */}
      <div className="ver-serie__nav">
        <Button
          icon={<ArrowLeftOutlined />}
          disabled={!hasPrev}
          onClick={() => setActiveIdx((i) => i - 1)}
        >
          {t('verSerie.previousButton')}
        </Button>
        <span className="ver-serie__current-label">
          <strong>
            T{active.seasonNumber} · {active.parsed.label}
          </strong>
        </span>
        <Button
          icon={<ArrowRightOutlined />}
          iconPosition="end"
          disabled={!hasNext}
          onClick={() => setActiveIdx((i) => i + 1)}
        >
          {t('verSerie.nextButton')}
        </Button>
      </div>

      {/* Sinopsis del episodio */}
      {active.synopsis && (
        <div className="ver-serie__episode-synopsis">
          <h3>{t('verSerie.episodeSynopsisTitle')}</h3>
          <p>{active.synopsis}</p>
        </div>
      )}

      {/* Sinopsis general & Reparto */}
      <div className="ver-serie__info-grid">
        {series.synopsis && (
          <div className="ver-serie__series-synopsis">
            <h3>{t('verSerie.aboutTheSeriesTitle')}</h3>
            <p>{series.synopsis}</p>
            {(series.genres.length > 0 || series.tags.length > 0) && (
              <div className="ver-serie__chips">
                {series.genres.map((g) => (
                  <Tag key={`g-${g}`} color="blue">
                    {g}
                  </Tag>
                ))}
                {series.tags.map((t) => (
                  <Tag key={`t-${t}`}>{t}</Tag>
                ))}
              </div>
            )}
          </div>
        )}

        {series.actors && series.actors.length > 0 && (
          <div className="ver-serie__cast-card">
            <h3>Reparto</h3>
            <div className="ver-serie__cast-list">
              {series.actors.map((a) => (
                <Link
                  key={a.id}
                  href={`/actores/${a.id}`}
                  className="ver-serie__cast-item"
                >
                  <Avatar
                    src={a.imageUrl || undefined}
                    icon={<UserOutlined />}
                    size={36}
                  />
                  <div className="ver-serie__cast-info">
                    <span className="ver-serie__cast-name">{a.name}</span>
                    {a.stageName && (
                      <span className="ver-serie__cast-stage">
                        {a.stageName}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lista de episodios enriquecida con Miniaturas y Capítulos */}
      <div className="ver-serie__episodes">
        <div className="ver-serie__episodes-header">
          <h2>
            {t('verSerie.episodesTitle')} ({flatEpisodes.length})
          </h2>
          {extrasCount > 0 && (
            <Segmented
              value={filterMode}
              onChange={(val) =>
                setFilterMode(val as 'all' | 'episodes' | 'extras')
              }
              options={[
                { label: `Todos (${flatEpisodes.length})`, value: 'all' },
                {
                  label: `Capítulos (${mainEpisodesCount})`,
                  value: 'episodes',
                },
                {
                  label: `Extras / Tráilers (${extrasCount})`,
                  value: 'extras',
                },
              ]}
            />
          )}
        </div>

        {/* 1. Capítulos principales con preview visual */}
        {filterMode !== 'extras' && (
          <div className="ver-serie__chapters-container">
            {chapterGroups.map(({ chapterNumber, thumbnail, items }) => {
              const isChapterActive = items.some(
                (it) => it.flatIndex === activeIdx
              );
              const isMultiPart = items.length > 1;
              const firstEpisode = items[0]?.episode;

              return (
                <div
                  key={`chap-${chapterNumber}`}
                  className={`ver-serie__chapter-card${
                    isChapterActive ? ' ver-serie__chapter-card--active' : ''
                  }`}
                >
                  {/* Preview de miniatura */}
                  {thumbnail && (
                    <div
                      className="ver-serie__chapter-thumb-wrap"
                      onClick={() =>
                        !isMultiPart && setActiveIdx(items[0].flatIndex)
                      }
                    >
                      {/* thumbnail = thumb de YouTube (whitelisteado) o fallback
                       * a series.imageUrl, que puede ser una URL externa
                       * arbitraria no whitelisteada en remotePatterns. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbnail}
                        alt={`Capítulo ${chapterNumber}`}
                        className="ver-serie__chapter-thumb"
                        loading="lazy"
                      />
                      <div className="ver-serie__chapter-thumb-overlay">
                        {isMultiPart ? (
                          <span className="ver-serie__part-count-badge">
                            {items.length} Partes
                          </span>
                        ) : (
                          <PlayCircleOutlined className="ver-serie__play-icon-overlay" />
                        )}
                        {firstEpisode?.duration && (
                          <span className="ver-serie__duration-badge">
                            <ClockCircleOutlined /> {firstEpisode.duration} min
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="ver-serie__chapter-body">
                    <div className="ver-serie__chapter-head">
                      <span className="ver-serie__chapter-title">
                        <PlayCircleOutlined /> Capítulo {chapterNumber}
                      </span>
                      {isMultiPart && (
                        <span className="ver-serie__chapter-parts-hint">
                          Dividido en {items.length} partes
                        </span>
                      )}
                    </div>

                    {/* Selector de partes o botón directo */}
                    <div className="ver-serie__parts-row">
                      {items.map(({ flatIndex, episode }) => {
                        const isActive = flatIndex === activeIdx;
                        const partLabel = isMultiPart
                          ? episode.parsed.partNumber
                            ? `Parte ${episode.parsed.partNumber}/${episode.parsed.partTotal || 4}`
                            : `Parte ${items.indexOf({ flatIndex, episode }) + 1}`
                          : `Reproducir`;

                        return (
                          <button
                            key={episode.id}
                            type="button"
                            className={`ver-serie__part-btn${
                              isActive ? ' ver-serie__part-btn--active' : ''
                            }`}
                            onClick={() => setActiveIdx(flatIndex)}
                          >
                            {isActive && <CheckCircleFilled />}
                            {partLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. Extras y Tráilers con miniatura */}
        {filterMode !== 'episodes' && extraEpisodes.length > 0 && (
          <div className="ver-serie__extras-section">
            <h3 className="ver-serie__section-subtitle">
              <VideoCameraOutlined /> Tráilers y Material Adicional
            </h3>
            <div className="ver-serie__extras-grid">
              {extraEpisodes.map(({ flatIndex, episode }) => {
                const isActive = flatIndex === activeIdx;
                const badge = episode.parsed;
                const thumb = getYouTubeThumbnail(episode.embedVideoId);

                return (
                  <button
                    key={episode.id}
                    type="button"
                    className={`ver-serie__extra-card${
                      isActive ? ' ver-serie__extra-card--active' : ''
                    }`}
                    onClick={() => setActiveIdx(flatIndex)}
                  >
                    {thumb && (
                      <div className="ver-serie__extra-thumb-wrap">
                        {/* thumb siempre viene de getYouTubeThumbnail(), dominio
                         * ya whitelisteado en next.config.ts remotePatterns. */}
                        <Image
                          src={thumb}
                          alt={badge.label}
                          fill
                          sizes="80px"
                          className="ver-serie__extra-thumb"
                        />
                        <PlayCircleOutlined className="ver-serie__play-icon-overlay" />
                      </div>
                    )}
                    <div className="ver-serie__extra-info">
                      <span className="ver-serie__extra-name">
                        {badge.label}
                      </span>
                      {badge.tagColor && (
                        <Tag
                          color={badge.tagColor}
                          style={{ alignSelf: 'flex-start' }}
                        >
                          {badge.badgeText}
                        </Tag>
                      )}
                    </div>
                    {isActive && (
                      <CheckCircleFilled className="ver-serie__episode-active-icon" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Videos Privados no disponibles */}
        {privateEpisodes.length > 0 && filterMode === 'all' && (
          <div className="ver-serie__private-notice">
            <Tag color="default">
              <LockOutlined /> {privateEpisodes.length} video(s) privados o
              retirados en YouTube por la productora oficial
            </Tag>
          </div>
        )}
      </div>

      {/* Rating + reseñas: solo para USER_EMBED — para CURATED+WATCHABLE_ONLY
       * ya existe en /series/[id] via "Ver ficha completa" mas arriba, asi
       * que evitamos duplicar el mismo widget en dos paginas. */}
      {isUserEmbed && (
        <div className="ver-serie__ratings-reviews">
          <RatingSection seriesId={series.id} existingRatings={[]} />
          <ReviewsSection seriesId={series.id} />
        </div>
      )}
    </div>
  );
}
