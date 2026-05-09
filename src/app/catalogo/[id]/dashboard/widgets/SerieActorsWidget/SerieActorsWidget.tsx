'use client';

import { useMemo } from 'react';
import { UserOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import type { SerieDetailData } from '../../../types';
import './SerieActorsWidget.css';

export interface SerieActorsWidgetProps {
  serie: SerieDetailData;
}

interface UniqueActor {
  id: number;
  name: string;
  characters: string[];
}

export function SerieActorsWidget({ serie }: SerieActorsWidgetProps) {
  const { t } = useLocale();

  const uniqueActors = useMemo<UniqueActor[]>(() => {
    const map = new Map<number, UniqueActor>();
    const collect = (relations?: SerieDetailData['actors']) => {
      if (!relations) return;
      for (const rel of relations) {
        const existing = map.get(rel.actor.id);
        if (existing) {
          if (rel.character && !existing.characters.includes(rel.character)) {
            existing.characters.push(rel.character);
          }
        } else {
          map.set(rel.actor.id, {
            id: rel.actor.id,
            name: rel.actor.name,
            characters: rel.character ? [rel.character] : [],
          });
        }
      }
    };
    collect(serie.actors);
    serie.seasons?.forEach((s) => collect(s.actors));
    return Array.from(map.values());
  }, [serie]);

  if (uniqueActors.length === 0) {
    return (
      <Widget title={t('serieDetail.actorsLabel')} icon={<UserOutlined />}>
        <EmptyState
          title={t('serieDashboard.actorsEmpty')}
          variant="soft"
          fullHeight={false}
        />
      </Widget>
    );
  }

  return (
    <Widget
      title={interpolateMessage(t('serieDetail.actorsCountTitle'), {
        count: uniqueActors.length,
      })}
      icon={<UserOutlined />}
      noPadding
    >
      <ul className="mb-serie-actors-widget">
        {uniqueActors.map((actor) => (
          <li key={actor.id} className="mb-serie-actors-widget__item">
            <span className="mb-serie-actors-widget__name">{actor.name}</span>
            <span className="mb-serie-actors-widget__character">
              {actor.characters.length > 0
                ? actor.characters.join(', ')
                : t('serieDetail.characterNotSpecified')}
            </span>
          </li>
        ))}
      </ul>
    </Widget>
  );
}
