'use client';

import { SettingOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { OverviewSettingsRow } from '../../../overview/sections/SettingsRow';

/** Widget "Configuración y preferencias" — 6 cards horizontales (Apariencia
 *  / Sesión / Privacidad / Datos / Suscripciones / Zona de peligro)
 *  clickables que llevan al panel correspondiente. */
export function SettingsRowWidget() {
  const { t } = useLocale();
  return (
    <Widget
      title={t('profile.sectionSettings')}
      icon={<SettingOutlined />}
      noPadding
    >
      <OverviewSettingsRow />
    </Widget>
  );
}
