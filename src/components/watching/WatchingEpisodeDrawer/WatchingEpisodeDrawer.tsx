'use client';

import { Drawer, Tabs } from 'antd';
import { SeriesUserStatusProvider } from '@/components/series/SeriesUserStatusProvider';
import { TrackingPanel } from '@/components/series/TrackingPanel/TrackingPanel';
import { EpisodeChapterList } from '@/components/series/EpisodeChapterList/EpisodeChapterList';
import { isAiringNow } from '@/lib/airing-schedule';
import type { WatchingItem } from '@/lib/watching-collection';
import './WatchingEpisodeDrawer.css';

interface WatchingEpisodeDrawerProps {
  item: WatchingItem | null;
  onClose: () => void;
  labels: {
    privacy: string;
    comments: string;
    note: string;
    season: (number: number) => string;
  };
}

export function WatchingEpisodeDrawer({
  item,
  onClose,
  labels,
}: WatchingEpisodeDrawerProps) {
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
          <TrackingPanel
            seriesId={item.series.id}
            seriesTitle={item.series.title}
            seasons={item.series.seasons}
            airing={isAiringNow(item.series)}
          />
          <Tabs
            items={item.series.seasons.map((season) => ({
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
        </SeriesUserStatusProvider>
      )}
    </Drawer>
  );
}
