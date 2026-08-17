import { startTransition, useEffect, useState } from 'react';

export interface ActiveAnnouncement {
  id: number;
  title: string;
  body: string;
  tone: 'INFO' | 'SUCCESS' | 'WARNING' | 'PROMO';
  surface: 'BANNER' | 'MODAL' | 'TOAST';
  template: 'SIMPLE' | 'FEATURE' | 'MAINTENANCE';
  dismissible: boolean;
  linkUrl: string | null;
  linkLabel: string | null;
}

/**
 * Trae los anuncios activos para una page key. Un solo fetch por cambio de
 * pagina (sin polling: los anuncios no cambian con la frecuencia suficiente
 * como para justificarlo, y la navegacion entre paginas ya retriggerea esto).
 * pageKey vacio ('') se interpreta como "no traer nada" (ej: rutas /admin,
 * donde el banner nunca se muestra).
 */
export function useActiveAnnouncements(pageKey: string): ActiveAnnouncement[] {
  const [items, setItems] = useState<ActiveAnnouncement[]>([]);

  useEffect(() => {
    if (!pageKey) {
      // startTransition: evita el warning de setState sincronico dentro de
      // un effect (mismo patron que useUnreadNotifications.ts).
      startTransition(() => setItems([]));
      return;
    }
    const controller = new AbortController();
    fetch(`/api/announcements/active?pageKey=${encodeURIComponent(pageKey)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ActiveAnnouncement[]) =>
        setItems(Array.isArray(data) ? data : [])
      )
      .catch(() => {
        /* errores silenciosos: el banner simplemente no aparece */
      });
    return () => controller.abort();
  }, [pageKey]);

  return items;
}
