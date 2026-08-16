'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Tag, Tooltip, Alert, Empty, Avatar, Segmented } from 'antd';
import {
  StarFilled,
  StarOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
  UserOutlined,
  BankOutlined,
  PlayCircleOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { EmbedPlayer } from '@/components/common/EmbedPlayer/EmbedPlayer';
import { EmbedAttribution } from '@/components/common/EmbedAttribution/EmbedAttribution';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { ShareButton } from '@/components/common/ShareButton/ShareButton';
import { SeriesSubscribeButton } from '@/components/series/SeriesSubscribeButton/SeriesSubscribeButton';
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
  productionCompanyName: string | null;
  submittedByName: string | null;
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

export function parseEpisodeBadge(rawTitle: string | null, episodeNumber: number): {
  label: string;
  isExtra: boolean;
  tagColor?: string;
  badgeText?: string;
} {
  if (!rawTitle) return { label: `Episodio ${episodeNumber}`, isExtra: false };
  const lower = rawTitle.toLowerCase();

  // Extraer número de episodio explícito en el título (ej: "EP.6", "EP. 6", "EP6", "Episodio 6")
  const epMatch = rawTitle.match(/\b(?:ep|episodio|cap|capitulo)\.?\s*(\d{1,3})\b/i);
  const detectedEp = epMatch ? epMatch[1] : null;

  // Extraer parte (ej: [1/4], (1/4), 1/4, Part 1)
  const partMatch =
    rawTitle.match(/[\[\(](\d{1,2})\s*\/\s*(\d{1,2})[\]\)]/) ||
    rawTitle.match(/\b(?:part|parte|pt)\.?\s*(\d{1,2})(?:\s*\/\s*(\d{1,2}))?\b/i);

  // 1. Tráilers y Teasers
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
      isExtra: true,
      tagColor: 'orange',
      badgeText: 'Tráiler',
    };
  }

  // 2. Detrás de cámaras y especiales
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
      isExtra: true,
      tagColor: 'purple',
      badgeText: 'Extra',
    };
  }

  // 3. OST / Música
  if (lower.includes('ost') || lower.includes('mv') || lower.includes('music video')) {
    return {
      label: `OST · #${episodeNumber}`,
      isExtra: true,
      tagColor: 'cyan',
      badgeText: 'Música',
    };
  }

  // 4. Partes de capítulos (ej: Cap. 8 [1/4])
  if (partMatch) {
    const partNum = partMatch[1];
    const partTotal = partMatch[2] || '4';
    const epNum = detectedEp || episodeNumber;
    return {
      label: `Cap. ${epNum} [${partNum}/${partTotal}]`,
      isExtra: false,
    };
  }

  // 5. Solo capítulo
  if (detectedEp) {
    return { label: `Capítulo ${detectedEp}`, isExtra: false };
  }

  // 6. Si el título está solo en tailandés o caracteres no latinos, limpiar a Episodio legible
  const isAllThai = /^[\u0E00-\u0E7F\s\W\d]+$/.test(rawTitle);
  if (isAllThai) {
    return { label: `Episodio ${episodeNumber}`, isExtra: false };
  }

  return {
    label: rawTitle.length > 32 ? `${rawTitle.slice(0, 30)}...` : rawTitle,
    isExtra: false,
  };
}

export function VerSerieClient({ series, seasons }: VerSerieClientProps) {
  const { t } = useLocale();
  const { data: session, status } = useSession();
  const message = useMessage();
  const isAuthed = status === 'authenticated';
  const isAdmin = isAuthed && session?.user?.role === 'ADMIN';
  const isUserEmbed = series.origin === 'USER_EMBED';

  const flatEpisodes = useMemo(
    () =>
      seasons.flatMap((s) =>
        s.episodes.map((e) => ({
          ...e,
          seasonId: s.id,
          seasonNumber: s.seasonNumber,
          parsed: parseEpisodeBadge(e.title, e.episodeNumber),
        }))
      ),
    [seasons]
  );

  const [activeIdx, setActiveIdx] = useState(0);
  const [filterMode, setFilterMode] = useState<'all' | 'episodes' | 'extras'>('all');
  const [scope, setScope] = useState(series.catalogScope);
  const [movingScope, setMovingScope] = useState(false);

  const active = flatEpisodes[activeIdx];
  const hasPrev = activeIdx > 0;
  const hasNext = activeIdx < flatEpisodes.length - 1;

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

  const extrasCount = flatEpisodes.filter((e) => e.parsed.isExtra).length;
  const mainEpisodesCount = flatEpisodes.length - extrasCount;

  const displayEpisodes = flatEpisodes.filter((e) => {
    if (filterMode === 'episodes') return !e.parsed.isExtra;
    if (filterMode === 'extras') return e.parsed.isExtra;
    return true;
  });

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
            <Tag icon={<BankOutlined />} color="cyan" className="ver-serie__company-tag">
              {series.productionCompanyName}
            </Tag>
          )}
        </div>
        <div className="ver-serie__header-actions">
          {isUserEmbed ? (
            <Tag color="purple">
              Aporte de @{series.submittedByName ?? 'usuario'}
            </Tag>
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
              <Button icon={<PlayCircleOutlined />}>{t('verSerie.viewFullDetailsButton')}</Button>
            </Link>
          )}
          {series.linkedSeries && (
            <Link href={`/series/${series.linkedSeries.id}`} prefetch={false}>
              <Button type="primary" ghost>Ficha completa en catálogo</Button>
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
          title={`${series.title} — E${active.episodeNumber}${
            active.title ? ` · ${active.title}` : ''
          }`}
        />
      </div>

      {/* Helper de subtítulos automáticos */}
      <div className="ver-serie__subtitles-tip">
        <TranslationOutlined className="ver-serie__subtitles-icon" />
        <div className="ver-serie__subtitles-text">
          <strong>Subtítulos en español:</strong> Se solicitan automáticamente si la plataforma oficial los tiene disponibles. Podés cambiar el idioma o ajustar la sincronización desde el botón <strong>[CC]</strong> del reproductor.
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
          {flatEpisodes.length > 1 && (
            <>
              T{active.seasonNumber} · E{active.episodeNumber}
              {active.title ? ` — ${active.title}` : ''}
            </>
          )}
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
                      <span className="ver-serie__cast-stage">{a.stageName}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lista de episodios y filtros */}
      <div className="ver-serie__episodes">
        <div className="ver-serie__episodes-header">
          <h2>{t('verSerie.episodesTitle')} ({flatEpisodes.length})</h2>
          {extrasCount > 0 && (
            <Segmented
              value={filterMode}
              onChange={(val) => setFilterMode(val as 'all' | 'episodes' | 'extras')}
              options={[
                { label: `Todos (${flatEpisodes.length})`, value: 'all' },
                { label: `Capítulos (${mainEpisodesCount})`, value: 'episodes' },
                { label: `Extras / Tráilers (${extrasCount})`, value: 'extras' },
              ]}
            />
          )}
        </div>

        <div className="ver-serie__episode-grid">
          {displayEpisodes.map((ep) => {
            const flatIndex = flatEpisodes.findIndex((fe) => fe.id === ep.id);
            const isActive = flatIndex === activeIdx;
            const badge = ep.parsed;

            return (
              <button
                key={ep.id}
                type="button"
                className={`ver-serie__episode-btn${
                  isActive ? ' ver-serie__episode-btn--active' : ''
                }${badge.isExtra ? ' ver-serie__episode-btn--extra' : ''}`}
                onClick={() => setActiveIdx(flatIndex)}
              >
                <span className="ver-serie__episode-num">
                  E{ep.episodeNumber}
                </span>
                <span className="ver-serie__episode-name" title={ep.title || ''}>
                  {badge.label}
                </span>
                {badge.tagColor && (
                  <Tag color={badge.tagColor} style={{ marginLeft: 4, marginInlineEnd: 0 }}>
                    {badge.badgeText}
                  </Tag>
                )}
                {isActive && (
                  <CheckCircleFilled className="ver-serie__episode-active-icon" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
