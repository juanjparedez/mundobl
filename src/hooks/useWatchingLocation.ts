'use client';

import { updateNavigationUrl } from '@/lib/navigation-history';

import { useSearchParams } from 'next/navigation';

/** Replace view state without adding a history entry for every filter change. */
export function useWatchingLocation() {
  const params = useSearchParams();
  const set = (key: string, value: string) => {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    if (key === 'historyQ') url.searchParams.delete('historyPages');
    updateNavigationUrl(url);
  };
  return { params, set };
}
