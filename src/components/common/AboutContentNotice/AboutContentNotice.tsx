'use client';

import { InfoCircleOutlined } from '@ant-design/icons';
import { DismissibleNotice } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';

/**
 * El catalogo es mucho mas grande que lo que se ve en el sitio. Se explica
 * una vez, en /catalogo y en /ver (mismo id: cerrado en una, cerrado en las dos).
 */
export function AboutContentNotice() {
  const { t } = useLocale();
  return (
    <DismissibleNotice
      id="about-content"
      icon={<InfoCircleOutlined />}
      title={t('aboutContentNotice.title')}
      closeLabel={t('aboutContentNotice.close')}
    >
      <p>{t('aboutContentNotice.body')}</p>
    </DismissibleNotice>
  );
}
