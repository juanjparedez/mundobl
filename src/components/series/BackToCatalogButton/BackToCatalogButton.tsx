'use client';

import { useBackNavigation } from '@/hooks/useBackNavigation';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './BackToCatalogButton.css';

export function BackToCatalogButton({ fallback }: { fallback?: string }) {
  const { t } = useLocale();
  const handleClick = useBackNavigation(fallback);

  return (
    <button
      type="button"
      className="mb-back-to-catalog"
      onClick={handleClick}
      aria-label={t('common.goBack')}
    >
      <ArrowLeftOutlined />
      <span>{t('common.goBack')}</span>
    </button>
  );
}
