'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Drawer, Spin, Tabs } from 'antd';
import { SeriesUserStatusProvider } from '@/components/series/SeriesUserStatusProvider';
import { TrackingPanel } from '@/components/series/TrackingPanel/TrackingPanel';
import { EpisodeChapterList } from '@/components/series/EpisodeChapterList/EpisodeChapterList';
import { isAiringNow } from '@/lib/airing-schedule';
import type { WatchingItem } from '@/lib/watching-collection';
import './WatchingEpisodeDrawer.css';

interface DrawerSeason {
  id: number;
  seasonNumber: number;
  episodes: Array<{ id: number; episodeNumber: number; title: string | null }>;
}

interface WatchingEpisodeDrawerProps {
  item: WatchingItem | null;
  onClose: () => void;
  labels: {
    privacy: string;
    comments: string;
    note: string;
    season: (number: number) => string;
    loadError: string;
    retry: string;
  };
}

/**
 * Cajon de una serie de "Mi seguimiento". Sus capitulos se piden al abrirlo:
 * la biblioteca trae solo el resumen de cada serie, porque con cientos de
 * series los capitulos de todas no entran en la memoria del Worker.
 */
export function WatchingEpisodeDrawer({
  item,
  onClose,
  labels,
}: WatchingEpisodeDrawerProps) {
  const seriesId = item?.series.id ?? null;
  // Resultado del ultimo pedido, atado a su serie: al cambiar de serie lo
  // anterior deja de valer sin resetear estado dentro del efecto.
  const [result, setResult] = useState<{
    seriesId: number;
    seasons: DrawerSeason[] | null;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (seriesId === null) return;
    const controller = new AbortController();
    fetch(`/api/user/library/${seriesId}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error();
        setResult({ seriesId, seasons: data as DrawerSeason[] });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ seriesId, seasons: null });
      });
    return () => controller.abort();
  }, [seriesId, attempt]);

  const current = result?.seriesId === seriesId ? result : null;
  const seasons = current?.seasons ?? null;
  const failed = current !== null && current.seasons === null;
  const retry = useCallback(() => {
    setResult(null);
    setAttempt((n) => n + 1);
  }, []);

  return (
    <Drawer
      open={item !== null}
      onClose={onClose}
      title={item?.series.title}
      size={720}
      destroyOnHidden
      className="watching-episode-drawer"
    >
      {item && (
        <SeriesUserStatusProvider
          key={item.series.id}
          seriesId={item.series.id}
        >
          <p className="watching-episode-drawer__privacy">{labels.privacy}</p>
          {failed ? (
            <Alert
              type="error"
              showIcon
              title={labels.loadError}
              action={
                <Button size="small" onClick={retry}>
                  {labels.retry}
                </Button>
              }
            />
          ) : seasons === null ? (
            <div className="watching-episode-drawer__loading">
              <Spin />
            </div>
          ) : (
            <>
              <TrackingPanel
                seriesId={item.series.id}
                seriesTitle={item.series.title}
                seasons={seasons}
                airing={isAiringNow(item.series)}
              />
              <Tabs
                items={seasons.map((season) => ({
                  key: String(season.id),
                  label: labels.season(season.seasonNumber),
                  children: (
                    <EpisodeChapterList
                      seasonNumber={season.seasonNumber}
                      episodes={season.episodes}
                      actionLabels={{
                        comments: labels.comments,
                        note: labels.note,
                      }}
                    />
                  ),
                }))}
              />
            </>
          )}
        </SeriesUserStatusProvider>
      )}
    </Drawer>
  );
}
