'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

interface SeriesUserStatusState extends SeriesUserStatusData {
  /** true recien despues de que el fetch resuelve (para no confundir "sin
   *  datos todavia" con "sin sesion"/"nada visto"). */
  loaded: boolean;
  /** Se incrementa en cada carga exitosa (inicial o via refetch). Los
   *  consumidores que siembran estado local lo usan como dependencia de
   *  efecto en vez de `loaded`, para volver a sembrar tras un refetch. */
  version: number;
}

interface SeriesUserStatusContextValue extends SeriesUserStatusState {
  /** La serie de este provider; null fuera de uno. */
  seriesId: number | null;
  /** Vuelve a pedir /my-status y reemplaza el valor. No-op sin sesion. Si
   *  se llama dos veces seguidas, solo la respuesta mas reciente aplica. */
  refetch: () => Promise<void>;
}

const DEFAULT_STATE: SeriesUserStatusState = {
  seriesStatus: 'SIN_VER',
  seasonStatus: {},
  episodeStatus: {},
  subscribed: false,
  loaded: false,
  version: 0,
};

const DEFAULT_CONTEXT: SeriesUserStatusContextValue = {
  ...DEFAULT_STATE,
  seriesId: null,
  refetch: async () => {},
};

const SeriesUserStatusContext =
  createContext<SeriesUserStatusContextValue>(DEFAULT_CONTEXT);

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
 * inicial (via useEffect sobre `version`, ver mas abajo); las
 * actualizaciones optimistas (marcar un episodio visto, etc.) siguen siendo
 * locales a cada componente. `refetch()` existe para el caso en que un
 * cambio masivo (stepper, intencion pendiente, onboarding) necesita que
 * todos los consumidores se re-siembren sin recargar la pagina.
 */
export function SeriesUserStatusProvider({
  seriesId,
  children,
}: {
  seriesId: number;
  children: ReactNode;
}) {
  const { status: sessionStatus } = useSession();
  const [state, setState] = useState<SeriesUserStatusState>(DEFAULT_STATE);
  // Identifica cada fetch para poder descartar una respuesta vieja si dos
  // cargas quedan en vuelo a la vez (mount + refetch manual, dos refetch
  // seguidos, etc.).
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  const load = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;

    const requestId = ++requestIdRef.current;
    try {
      const res = await fetch(`/api/series/${seriesId}/my-status`);
      if (!res.ok) return;
      const data = (await res.json()) as SeriesUserStatusData;
      if (!mountedRef.current || requestIdRef.current !== requestId) return;
      setState((prev) => ({
        ...data,
        loaded: true,
        version: prev.version + 1,
      }));
    } catch {
      // La hidratacion nunca puede romper la ficha.
    }
  }, [seriesId, sessionStatus]);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') {
      // Invalida cualquier fetch en vuelo y resetea (edge case: logout sin
      // recargar mientras se esta viendo la pagina; el mount inicial
      // anonimo ya arranca en DEFAULT_STATE).
      requestIdRef.current += 1;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset al perder sesion, no un derive-on-render
      setState(DEFAULT_STATE);
      return;
    }
    void load();
  }, [sessionStatus, load]);

  const contextValue = useMemo(
    () => ({ ...state, seriesId, refetch: load }),
    [state, seriesId, load]
  );

  return (
    <SeriesUserStatusContext.Provider value={contextValue}>
      {children}
    </SeriesUserStatusContext.Provider>
  );
}

export function useSeriesUserStatus(): SeriesUserStatusContextValue {
  return useContext(SeriesUserStatusContext);
}
