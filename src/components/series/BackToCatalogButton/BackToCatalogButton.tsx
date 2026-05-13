'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './BackToCatalogButton.css';

const HISTORY_INJECT_KEY = '__mb_back_injected';

export function BackToCatalogButton() {
  const router = useRouter();
  const { t } = useLocale();

  // Inyeccion sintetica de history: si el usuario llega a /series/[id] sin
  // referrer interno (link compartido, refresh, deep link desde Google),
  // el back nativo del browser saldria del sitio o iria al landing. Para
  // que el back/gesture mobile siempre tenga un destino consistente,
  // inyectamos /catalogo como entry anterior en el history.
  //
  // Si vino desde otra pagina del sitio (catalogo, perfil, ver, etc.) NO
  // tocamos — el back natural ya hace lo correcto (y con fix B el
  // catalogo restaura ?page=N).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Idempotente: si ya inyectamos en esta entrada, no repetir.
    const state = window.history.state as Record<string, unknown> | null;
    if (state?.[HISTORY_INJECT_KEY]) return;

    const ref = document.referrer;
    const sameOriginRef = ref && ref.startsWith(window.location.origin);
    if (sameOriginRef) return; // history util ya existe

    // Reemplaza la entrada actual con /catalogo (URL bar momentanea, pero
    // sin re-render porque no usamos router) y luego pushea /series/X de
    // vuelta. Resultado history: [..., /catalogo (sintetico), /series/X].
    const currentUrl = window.location.pathname + window.location.search;
    window.history.replaceState(null, '', '/catalogo');
    window.history.pushState({ [HISTORY_INJECT_KEY]: true }, '', currentUrl);
  }, []);

  // Si el usuario vino navegando desde /catalogo (mismo origen + path),
  // history.back() restaura la URL completa con su ?page=N preservada
  // (fix B en CatalogoClient). Si llego directo (link compartido, refresh
  // en /series/[id]), router.back() saldria del sitio salvo que la
  // inyeccion del useEffect haya corrido — fallback a push igual.
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
