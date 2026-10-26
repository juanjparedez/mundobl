'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import {
  aliasParts,
  formatAlias,
  getVisitorAliasSeed,
  isCommunityOptedIn,
  rerollVisitorAliasSeed,
  setCommunityOptIn as saveCommunityOptIn,
  type AliasParts,
} from '@/lib/community-alias';
import type { OwnRankingPosition } from '@/lib/community-ranking';

function subscribeStorage(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

const getServerSeed = () => 0;
const getServerOptIn = () => false;

export interface UseCommunityAliasResult {
  alias: AliasParts;
  aliasName: string;
  optedIn: boolean;
  isLoggedIn: boolean;
  rerolling: boolean;
  cooldown: boolean;
  setOptIn: (optIn: boolean) => void;
  reroll: () => Promise<void>;
}

/**
 * Hook unificado de gestión de Alias Seudónimo y Opt-In de Comunidad (Nivel 2).
 * Funciona para visitantes sin cuenta (localStorage) y usuarios autenticados (/api/community/alias).
 */
export function useCommunityAlias(): UseCommunityAliasResult {
  const { data: session, status } = useSession();
  const { t } = useLocale();

  const isLoggedIn = status === 'authenticated' && Boolean(session?.user?.id);

  // Opt-in sincronizado via localStorage (boolean primitivo)
  const optedIn = useSyncExternalStore(
    subscribeStorage,
    isCommunityOptedIn,
    getServerOptIn
  );

  // Semilla de visitante (number primitivo: Object.is(a, b) === true cuando no cambia)
  const visitorSeed = useSyncExternalStore(
    subscribeStorage,
    getVisitorAliasSeed,
    getServerSeed
  );

  const visitorAlias = useMemo(() => aliasParts(visitorSeed), [visitorSeed]);

  // Alias de cuenta si está logueado
  const [accountAlias, setAccountAlias] = useState<AliasParts | null>(null);
  const [rerolling, setRerolling] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    const controller = new AbortController();
    fetch('/api/user/ranking', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: OwnRankingPosition | null) => {
        if (data?.alias) setAccountAlias(data.alias);
      })
      .catch(() => null);
    return () => controller.abort();
  }, [isLoggedIn]);

  const activeParts = isLoggedIn && accountAlias ? accountAlias : visitorAlias;

  const aliasName = useMemo(
    () =>
      formatAlias(activeParts, {
        first: t('communityAlias.firstWords'),
        second: t('communityAlias.secondWords'),
        template: t('communityAlias.template'),
      }),
    [activeParts, t]
  );

  const setOptIn = useCallback((nextOptIn: boolean) => {
    saveCommunityOptIn(nextOptIn);
  }, []);

  const reroll = useCallback(async () => {
    if (rerolling || cooldown) return;
    setRerolling(true);
    try {
      if (isLoggedIn) {
        const res = await fetch('/api/community/alias', { method: 'POST' });
        if (res.status === 429) {
          setCooldown(true);
          return;
        }
        if (!res.ok) return;
        const data = (await res.json()) as { alias: AliasParts };
        if (data.alias) setAccountAlias(data.alias);
        setCooldown(true);
      } else {
        rerollVisitorAliasSeed();
      }
    } catch {
      /* ignore */
    } finally {
      setRerolling(false);
    }
  }, [isLoggedIn, rerolling, cooldown]);

  return {
    alias: activeParts,
    aliasName,
    optedIn,
    isLoggedIn,
    rerolling,
    cooldown,
    setOptIn,
    reroll,
  };
}
