'use client';

import { Widget } from '@/components/dashboard';
import { OverviewSettingsRow } from '../../../overview/sections/SettingsRow';

/** Widget wrapper de "Configuración y preferencias" del mock — 6 cards
 *  horizontales (Apariencia / Sesión / Privacidad / Datos / Suscripciones
 *  / Zona de peligro) clickables que llevan al panel correspondiente. */
export function SettingsRowWidget() {
  return (
    <Widget noPadding>
      <OverviewSettingsRow />
    </Widget>
  );
}
