'use client';

import Link from 'next/link';
import type { ProfileData } from '../../types';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import {
  sortAchievementsForDisplay,
  summarizeAchievements,
} from '@/lib/achievements';
import { AutoFitList } from '@/components/design-system';
import { AchievementItem } from '../../achievements/AchievementItem/AchievementItem';
import './Achievements.css';

interface Props {
  stats: ProfileData['stats'];
  /** Destino del link "Ver todos los logros" (pestaña Logros). */
  boardHref?: string;
}

/** Cuerpo del widget "Logros y hitos": obtenidos primero y despues los mas
 *  cerca de la meta. El tablero completo, con categorias y parches de
 *  plataforma, vive en la pestaña Logros (AchievementsBoard). */
export function OverviewAchievements({ stats, boardHref }: Props) {
  const { t } = useLocale();
  const ordered = sortAchievementsForDisplay(
    summarizeAchievements(stats).items
  );

  // Header (title + counter) lo provee el Widget wrapper. AutoFitList mide
  // cuantos items entran en el alto disponible del widget.
  return (
    <section className="overview-achievements">
      <AutoFitList
        as="ul"
        collapsedCount={4}
        listClassName="overview-achievements__list"
        wrapClassName="overview-achievements__wrap"
        viewLessLabel={t('profile.overviewViewLess')}
        viewMoreLabel={(count) =>
          interpolateMessage(t('profile.overviewViewAllCount'), {
            count: String(count),
          })
        }
      >
        {ordered.map((item) => (
          <AchievementItem key={item.key} item={item} />
        ))}
      </AutoFitList>
      {boardHref && (
        <Link href={boardHref} className="overview-achievements__board-link">
          {t('achievements.viewAll')}
        </Link>
      )}
    </section>
  );
}
