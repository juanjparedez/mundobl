'use client';

import { BugOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { MyCasesSection } from '../../../MyCasesSection/MyCasesSection';

/** Wrapper del MyCasesSection existente para el sistema de dashboards. */
export function MyCasesWidget() {
  const { t } = useLocale();
  return (
    <Widget title={t('profileDashboard.widgetMyCases')} icon={<BugOutlined />}>
      <MyCasesSection />
    </Widget>
  );
}
