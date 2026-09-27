'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { getNavigationFallback } from '@/lib/navigation-fallback';
import './BackToCatalogButton.css';

// Marker que pone NavigationGuard al inyectar entry sintetica al history.
// Si esta presente, sabemos que back nos lleva a un destino interno safe.
const HISTORY_INJECT_KEY = '__mb_back_injected';

export function BackToCatalogButton({
  fallback,
}: {
  fallback?: '/catalogo' | '/ver' | '/';
}) {
  const router = useRouter();
  const { t } = useLocale();

  // Prefer the actual in-app entry; direct links use the section fallback.
  const handleClick = () => {
    const destination =
      fallback ?? getNavigationFallback(window.location.pathname) ?? '/';
    const ref = document.referrer;
    const sameOrigin = ref && new URL(ref).origin === window.location.origin;
    const state = window.history.state as Record<string, unknown> | null;
    const hasInjectedFallback = state?.[HISTORY_INJECT_KEY];
    if (
      (sameOrigin || hasInjectedFallback || state?.__mb_internal_back) &&
      window.history.length > 1
    ) {
      router.back();
    } else {
      router.replace(destination);
    }
  };

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
