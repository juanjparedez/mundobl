'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const KEY = '__mb_watching_scroll';

/** Keep position on this history entry, scoped to the signed-in account. */
export function useWatchingScroll(userId: string, ready: boolean) {
  const params = useSearchParams();
  const query = params.toString();
  useEffect(() => {
    if (!ready) return;
    const url = window.location.pathname + window.location.search;
    const saved: unknown = window.history.state?.[KEY];
    const position =
      saved && typeof saved === 'object'
        ? (saved as Record<string, unknown>)
        : null;
    let frame = 0;
    const save = () => {
      if (window.location.pathname + window.location.search !== url) return;
      window.history.replaceState(
        { ...window.history.state, [KEY]: { userId, url, y: window.scrollY } },
        '',
        window.location.href
      );
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(save);
    };
    const restore = requestAnimationFrame(() => {
      if (
        position?.userId === userId &&
        position.url === url &&
        typeof position.y === 'number' &&
        Number.isFinite(position.y) &&
        position.y >= 0
      ) {
        window.scrollTo({ top: position.y, behavior: 'instant' });
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('pagehide', save);
      document.addEventListener('click', save, true);
    });
    return () => {
      cancelAnimationFrame(restore);
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', save);
      document.removeEventListener('click', save, true);
    };
  }, [userId, ready, query]);
}
