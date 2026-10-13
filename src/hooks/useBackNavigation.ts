'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { getNavigationFallback } from '@/lib/navigation-fallback';

/** Return to the actual in-app entry; direct visits use the section fallback. */
export function useBackNavigation(fallback?: string) {
  const router = useRouter();
  return useCallback(() => {
    const destination =
      fallback ?? getNavigationFallback(window.location.pathname) ?? '/';
    const referrer = document.referrer ? new URL(document.referrer) : null;
    // A reload can set referrer to this very page; it proves no prior route.
    const fromInternalPage =
      referrer?.origin === window.location.origin &&
      referrer.pathname !== window.location.pathname;
    const state = window.history.state as Record<string, unknown> | null;
    if (
      (fromInternalPage ||
        state?.__mb_back_injected ||
        state?.__mb_internal_back) &&
      window.history.length > 1
    ) {
      router.back();
    } else {
      router.replace(destination);
    }
  }, [fallback, router]);
}
