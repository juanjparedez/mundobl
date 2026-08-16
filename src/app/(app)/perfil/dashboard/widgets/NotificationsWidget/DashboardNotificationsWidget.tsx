'use client';

import { BellOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { NotificationsWidget as NotificationsContent } from '../../../NotificationsWidget/NotificationsWidget';

/** Wrapper del NotificationsWidget existente para el sistema de dashboards. */
export function DashboardNotificationsWidget() {
  const { t } = useLocale();
  return (
    <Widget
      title={t('profileDashboard.widgetNotifications')}
      icon={<BellOutlined />}
      fade
    >
      <NotificationsContent />
    </Widget>
  );
}
