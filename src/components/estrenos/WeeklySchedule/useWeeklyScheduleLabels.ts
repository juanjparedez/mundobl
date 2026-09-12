'use client';

import { useMemo } from 'react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { WeeklyScheduleLabels } from './WeeklySchedule';

/**
 * Etiquetas traducidas de la parrilla. Existe para que la landing y /estrenos no
 * repitan el mismo bloque de 10 claves, y para que `WeeklySchedule` siga siendo
 * un componente sin texto propio (convencion del design-system).
 *
 * El array de dias va indexado 0 = domingo .. 6 = sabado, que es lo que devuelve
 * `Date.getDay()` y lo que usa `AIR_DAY_MAP`.
 */
export function useWeeklyScheduleLabels(): WeeklyScheduleLabels {
  const { t } = useLocale();

  return useMemo(
    () => ({
      weekdays: [
        t('estrenos.daySunday'),
        t('estrenos.dayMonday'),
        t('estrenos.dayTuesday'),
        t('estrenos.dayWednesday'),
        t('estrenos.dayThursday'),
        t('estrenos.dayFriday'),
        t('estrenos.daySaturday'),
      ],
      today: t('estrenos.today'),
      moreCount: t('estrenos.moreCount'),
      emptyDay: t('estrenos.emptyDay'),
    }),
    [t]
  );
}
