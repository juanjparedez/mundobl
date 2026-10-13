'use client';

import { useEffect } from 'react';

/** Restore list position only for the matching history entry and filters. */
export function useHistoryScroll(ready: boolean, query: string) {
  useEffect(() => {
    if (!ready) return;
    const url = window.location.pathname + window.location.search;
    const saved: unknown = window.history.state?.__mb_page_scroll;
    let frame = 0;
    const save = () => {
      if (window.location.pathname + window.location.search !== url) return;
      window.history.replaceState(
        {
          ...window.history.state,
          __mb_page_scroll: { url, y: window.scrollY },
        },
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
        saved &&
        typeof saved === 'object' &&
        'url' in saved &&
        saved.url === url &&
        'y' in saved &&
        typeof saved.y === 'number' &&
        Number.isFinite(saved.y) &&
        saved.y >= 0
      ) {
        window.scrollTo({ top: saved.y, behavior: 'instant' });
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
  }, [ready, query]);
}
