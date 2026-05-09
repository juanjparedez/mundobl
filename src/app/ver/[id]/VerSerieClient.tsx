'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Tag, Tooltip, Alert, Empty } from 'antd';
import {
  StarFilled,
  StarOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { EmbedPlayer } from '@/components/common/EmbedPlayer/EmbedPlayer';
import { EmbedAttribution } from '@/components/common/EmbedAttribution/EmbedAttribution';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
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
  country: { name: string; code: string | null } | null;
  tags: string[];
  genres: string[];
}

interface VerSerieClientProps {
  series: SeriesInfo;
  seasons: Season[];
}

export function VerSerieClient({ series, seasons }: VerSerieClientProps) {
  const { t } = useLocale();
  const { data: session } = useSession();
  const message = useMessage();
  const isAdmin = session?.user?.role === 'ADMIN';

  // Aplanado de todos los episodios (con su season) para navegacion siguiente/anterior.
  const flatEpisodes = useMemo(
    () =>
      seasons.flatMap((s) =>
        s.episodes.map((e) => ({
          ...e,
          seasonId: s.id,
          seasonNumber: s.seasonNumber,
        }))
      ),
    [seasons]
  );

  const [activeIdx, setActiveIdx] = useState(0);
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
      if (!res.ok) throw new Error(t('verSerie.couldNotMoveSeriesToCatalogError'));
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
        </div>
        <div className="ver-serie__header-actions">
          {scope === 'PERSONAL' ? (
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
          <Link href={`/series/${series.id}`} prefetch={false}>
            <Button>{t('verSerie.viewFullDetailsButton')}</Button>
          </Link>
          {isAdmin && scope === 'WATCHABLE_ONLY' && (
            <Button
              type="primary"
              icon={<StarFilled />}
              loading={movingScope}
              onClick={handleMoveToCatalog}
            >
              {t('verSerie.moveToMyCatalogButton')}
            </Button>
          )}
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

      {/* Sinopsis general */}
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

      {/* Lista de episodios */}
      <div className="ver-serie__episodes">
        <h2>{t('verSerie.episodesTitle')}</h2>
        {seasons.map((season) => (
          <div key={season.id} className="ver-serie__season">
            <h3 className="ver-serie__season-title">
              {t('verSerie.seasonTitle', { seasonNumber: season.seasonNumber })}
              {season.title ? ` — ${season.title}` : ''}
            </h3>
            <div className="ver-serie__episode-grid">
              {season.episodes.map((ep) => {
                const flatIndex = flatEpisodes.findIndex(
                  (fe) => fe.id === ep.id
                );
                const isActive = flatIndex === activeIdx;
                return (
                  <button
                    key={ep.id}
                    type="button"
                    className={`ver-serie__episode-btn${
                      isActive ? ' ver-serie__episode-btn--active' : ''
                    }`}
                    onClick={() => setActiveIdx(flatIndex)}
                  >
                    <span className="ver-serie__episode-num">
                      E{ep.episodeNumber}
                    </span>
                    <span className="ver-serie__episode-name">
                      {ep.title || t('verSerie.episodeDefaultTitle', { episodeNumber: ep.episodeNumber })}
                    </span>
                    {isActive && (
                      <CheckCircleFilled className="ver-serie__episode-active-icon" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}