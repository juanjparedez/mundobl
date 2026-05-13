'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './BackToCatalogButton.css';

export function BackToCatalogButton() {
  const router = useRouter();
  const { t } = useLocale();

  // Si el usuario vino navegando desde /catalogo (mismo origen + path),
  // history.back() restaura la URL completa con su ?page=N preservada
  // (fix B en CatalogoClient). Si llego directo (link compartido, refresh
  // en /series/[id]), router.back() saldria del sitio — fallback a push.
  const handleClick = () => {
    if (typeof window === 'undefined') {
      router.push('/catalogo');
      return;
    }
    const ref = document.referrer;
    const sameOrigin = ref.startsWith(window.location.origin);
    const cameFromCatalog = sameOrigin && new URL(ref).pathname === '/catalogo';
    if (cameFromCatalog && window.history.length > 1) {
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
