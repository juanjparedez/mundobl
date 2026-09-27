'use client';

import { useSearchParams } from 'next/navigation';

/** Replace view state without adding a history entry for every filter change. */
export function useWatchingLocation() {
  const params = useSearchParams();
  const set = (key: string, value: string) => {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    if (key === 'historyQ') url.searchParams.delete('historyPages');
    // Let Next copy its own router state and notify useSearchParams. Passing
    // __NA back would bypass its public History API integration.
    const state = window.history.state as Record<string, unknown> | null;
    window.history.replaceState(
      {
        __mb_internal_back: state?.__mb_internal_back,
        __mb_back_injected: state?.__mb_back_injected,
        __mb_watching_scroll: state?.__mb_watching_scroll,
      },
      '',
      url
    );
  };
  return { params, set };
}
