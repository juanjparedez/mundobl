'use client';

import { HeartOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { Widget } from '@/components/dashboard';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { OverviewFollowedTitles } from '../../../overview/sections/FollowedTitles';
import type { ProfileData } from '../../../types';

export interface FollowedTitlesWidgetProps {
  favorites: ProfileData['favorites'];
}

/** Widget "Títulos seguidos". Strip horizontal de posters chicos con
 *  bell icon (suscripciones). */
export function FollowedTitlesWidget({ favorites }: FollowedTitlesWidgetProps) {
  const { t } = useLocale();
  return (
    <Widget
      title={t('profile.sectionFollowedTitles')}
      icon={<HeartOutlined />}
      noPadding
      actions={
        <Link href="/perfil/clasico" className="overview-followed__see-all">
          {t('profile.overviewViewAll')}
        </Link>
      }
    >
      <OverviewFollowedTitles favorites={favorites} />
    </Widget>
  );
}
