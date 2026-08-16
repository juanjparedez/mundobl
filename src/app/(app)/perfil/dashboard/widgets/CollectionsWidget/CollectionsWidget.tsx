'use client';

import { AppstoreOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { OverviewCollections } from '../../../overview/sections/Collections';
import type { ProfileData } from '../../../types';

export interface CollectionsWidgetProps {
  stats: ProfileData['stats'];
}

/** Widget wrapper de la section "Mis listas" (favoritos, rewatch,
 *  watching, abandoned). El title viene del Widget canonico — la
 *  section ya no tiene header propio (iter 14). */
export function CollectionsWidget({ stats }: CollectionsWidgetProps) {
  const { t } = useLocale();
  return (
    <Widget
      title={t('profile.sectionCollections')}
      icon={<AppstoreOutlined />}
      noPadding
    >
      <OverviewCollections stats={stats} />
    </Widget>
  );
}
