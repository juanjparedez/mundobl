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
import {
  getLocalSeriesProgress,
  subscribeToLocalProgress,
} from '@/lib/local-progress';

export interface SeriesUserStatusData {
  seriesStatus: string;
  seasonStatus: Record<number, string>;
  episodeStatus: Record<number, string>;
  subscribed: boolean;
  favorite: boolean;
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
  storage: 'account' | 'local';
}

const DEFAULT_STATE: SeriesUserStatusState = {
  seriesStatus: 'SIN_VER',
  seasonStatus: {},
  episodeStatus: {},
  subscribed: false,
  favorite: false,
  loaded: false,
  version: 0,
};

const DEFAULT_CONTEXT: SeriesUserStatusContextValue = {
  ...DEFAULT_STATE,
  seriesId: null,
  refetch: async () => {},
  storage: 'local',
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

  const loadLocal = useCallback(() => {
    const progress = getLocalSeriesProgress(seriesId);
    const episodeStatus = Object.fromEntries(
      progress.episodeIds.map((episodeId) => [episodeId, 'VISTA'])
    );
    setState((prev) => ({
      ...DEFAULT_STATE,
      seriesStatus: progress.episodeIds.length > 0 ? 'VIENDO' : 'SIN_VER',
      episodeStatus,
      loaded: true,
      version: prev.version + 1,
    }));
  }, [seriesId]);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  const load = useCallback(async () => {
    if (sessionStatus !== 'authenticated') {
      if (sessionStatus === 'unauthenticated') loadLocal();
      return;
    }

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
  }, [seriesId, sessionStatus, loadLocal]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus !== 'authenticated') {
      // Invalida cualquier fetch en vuelo y resetea (edge case: logout sin
      // recargar mientras se esta viendo la pagina; el mount inicial
      // anonimo ya arranca en DEFAULT_STATE).
      requestIdRef.current += 1;
      const localTimeoutId = window.setTimeout(loadLocal, 0);
      return () => window.clearTimeout(localTimeoutId);
    }
    const accountTimeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(accountTimeoutId);
  }, [sessionStatus, load, loadLocal]);

  useEffect(() => {
    if (sessionStatus !== 'unauthenticated') return;
    return subscribeToLocalProgress(loadLocal);
  }, [sessionStatus, loadLocal]);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;
    const reloadAccount = () => void load();
    window.addEventListener('mundobl:account-progress-imported', reloadAccount);
    return () =>
      window.removeEventListener(
        'mundobl:account-progress-imported',
        reloadAccount
      );
  }, [sessionStatus, load]);

  const contextValue = useMemo(
    () => ({
      ...state,
      seriesId,
      refetch: load,
      storage: (sessionStatus === 'authenticated' ? 'account' : 'local') as
        | 'account'
        | 'local',
    }),
    [state, seriesId, load, sessionStatus]
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
