'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';

export interface SeriesUserStatusData {
  seriesStatus: string;
  seasonStatus: Record<number, string>;
  episodeStatus: Record<number, string>;
  subscribed: boolean;
}

interface SeriesUserStatusContextValue extends SeriesUserStatusData {
  /** true recien despues de que el fetch resuelve (para no confundir "sin
   *  datos todavia" con "sin sesion"/"nada visto"). */
  loaded: boolean;
}

const DEFAULT_STATUS: SeriesUserStatusContextValue = {
  seriesStatus: 'SIN_VER',
  seasonStatus: {},
  episodeStatus: {},
  subscribed: false,
  loaded: false,
};

const SeriesUserStatusContext =
  createContext<SeriesUserStatusContextValue>(DEFAULT_STATUS);

/**
 * Estado del usuario actual (viewStatus de serie/temporadas/episodios +
 * suscripcion) sobre la serie que se esta viendo, hidratado en un solo
 * fetch a GET /api/series/[id]/my-status.
 *
 * Por que existe: /series/[id] dejo de llamar `await auth()` del lado del
 * servidor (eso forzaba la ruta de mas trafico del sitio a renderizar
 * dinamico para todos los visitantes, matando el `revalidate` declarado).
 * Todo lo que antes llegaba ya resuelto como prop desde el servidor
 * (ViewStatusToggle, SeasonsList, EpisodesList, ReviewsSection,
 * SeriesSubscribeButton) ahora lee de aca — un solo request compartido en
 * vez de que cada componente pegue su propio fetch por separado.
 *
 * Los consumidores usan este valor SOLO para sembrar su estado local
 * inicial (via useEffect cuando `loaded` pasa a true); las actualizaciones
 * optimistas (marcar un episodio visto, etc.) siguen siendo locales a cada
 * componente, igual que antes de este cambio — este provider no expone
 * setters porque nada lo necesitaba.
 */
export function SeriesUserStatusProvider({
  seriesId,
  children,
}: {
  seriesId: number;
  children: ReactNode;
}) {
  const { status: sessionStatus } = useSession();
  const [value, setValue] =
    useState<SeriesUserStatusContextValue>(DEFAULT_STATUS);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') {
      // Reset si la sesion se cierra mientras se esta viendo la pagina
      // (edge case: logout sin recargar) — para el mount inicial anonimo
      // `value` ya arranca en DEFAULT_STATUS.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset al perder sesion, no un derive-on-render
      setValue(DEFAULT_STATUS);
      return;
    }

    let cancelled = false;
    fetch(`/api/series/${seriesId}/my-status`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SeriesUserStatusData | null) => {
        if (cancelled || !data) return;
        setValue({ ...data, loaded: true });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [seriesId, sessionStatus]);

  return (
    <SeriesUserStatusContext.Provider value={value}>
      {children}
    </SeriesUserStatusContext.Provider>
  );
}

export function useSeriesUserStatus(): SeriesUserStatusContextValue {
  return useContext(SeriesUserStatusContext);
}
