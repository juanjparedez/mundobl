'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './BackToCatalogButton.css';

// Marker que pone NavigationGuard al inyectar entry sintetica al history.
// Si esta presente, sabemos que back nos lleva a un destino interno safe.
const HISTORY_INJECT_KEY = '__mb_back_injected';

export function BackToCatalogButton() {
  const router = useRouter();
  const { t } = useLocale();

  // NavigationGuard global (montado en root layout) ya inyecta /catalogo
  // en el history cuando el referrer es externo. Aca solo decidimos si
  // invocar router.back() (que respeta el ?page=N via fix B) o
  // router.push como fallback.
  const handleClick = () => {
    if (typeof window === 'undefined') {
      router.push('/catalogo');
      return;
    }
    const ref = document.referrer;
    const sameOrigin = ref.startsWith(window.location.origin);
    const cameFromCatalog = sameOrigin && new URL(ref).pathname === '/catalogo';
    const state = window.history.state as Record<string, unknown> | null;
    const hasInjectedFallback = state?.[HISTORY_INJECT_KEY];
    if ((cameFromCatalog || hasInjectedFallback) && window.history.length > 1) {
      router.back();
    } else {
      router.push('/catalogo');
    }
  };

  return (
    <button
      type="button"
      className="mb-back-to-catalog"
      onClick={handleClick}
      aria-label={t('seriesDetail.backToCatalog')}
    >
      <ArrowLeftOutlined />
      <span>{t('seriesDetail.backToCatalog')}</span>
    </button>
  );
}
