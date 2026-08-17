'use client';

import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { resolvePageKey } from '@/constants/announcements';
import { useActiveAnnouncements } from '@/hooks/useActiveAnnouncements';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { BannerSurface } from './surfaces/BannerSurface';
import { ModalSurface } from './surfaces/ModalSurface';
import { ToastSurface } from './surfaces/ToastSurface';

const STORAGE_KEY = 'announcements-dismissed';

// useSyncExternalStore exige que getSnapshot devuelva la MISMA referencia
// si el valor subyacente no cambio (usa Object.is para decidir si hay que
// re-renderizar). JSON.parse crea un array nuevo en cada llamada -> sin este
// cache, React ve "cambios" en cada render y entra en loop infinito
// ("Maximum update depth exceeded"), lo que tira la app entera para abajo
// via el error boundary (bug real que paso a produccion — no tocar esto sin
// mantener el cache). Cacheamos por el string crudo: solo re-parseamos (y
// devolvemos una referencia nueva) cuando localStorage realmente cambio.
let cachedRaw: string | null = null;
let cachedIds: number[] = [];

function getDismissedIds(): number[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return cachedIds;
  }
  if (raw === cachedRaw) return cachedIds;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedIds = Array.isArray(parsed) ? parsed : [];
  } catch {
    cachedIds = [];
  }
  return cachedIds;
}

const EMPTY_IDS: number[] = [];
function getServerSnapshot(): number[] {
  return EMPTY_IDS;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function dismissAnnouncement(id: number): void {
  const current = getDismissedIds();
  if (current.includes(id)) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, id]));
  window.dispatchEvent(new StorageEvent('storage'));
}

/**
 * Punto de montaje unico (en AppLayout). Resuelve que anuncio corresponde a
 * la pagina actual + el dismiss por dispositivo, y delega el render a la
 * superficie que haya elegido el admin (banner/modal/toast) — cada una es
 * un wrapper fino sobre AnnouncementContent, el render de markdown/CTA vive
 * en un solo lugar.
 */
export function AnnouncementDisplay() {
  const pathname = usePathname();
  const { t } = useLocale();
  const dismissedIds = useSyncExternalStore(
    subscribe,
    getDismissedIds,
    getServerSnapshot
  );

  const isAdminRoute = pathname?.startsWith('/admin');
  const pageKey = resolvePageKey(pathname ?? '/');
  const items = useActiveAnnouncements(isAdminRoute ? '' : pageKey);

  if (isAdminRoute) return null;

  const announcement = items.find((a) => !dismissedIds.includes(a.id));
  if (!announcement) return null;

  const handleDismiss = () => dismissAnnouncement(announcement.id);
  const dismissLabel = t('announcementBanner.dismiss');

  switch (announcement.surface) {
    case 'MODAL':
      return (
        <ModalSurface announcement={announcement} onDismiss={handleDismiss} />
      );
    case 'TOAST':
      return (
        <ToastSurface
          announcement={announcement}
          onDismiss={handleDismiss}
          dismissLabel={dismissLabel}
        />
      );
    case 'BANNER':
    default:
      return (
        <BannerSurface
          announcement={announcement}
          onDismiss={handleDismiss}
          dismissLabel={dismissLabel}
        />
      );
  }
}
