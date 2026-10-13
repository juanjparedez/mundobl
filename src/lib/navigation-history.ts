/** Keep app metadata without passing Next's private router state to its History API. */
export function getAppHistoryState(
  state: unknown,
  mode: 'replace' | 'push' = 'replace'
): Record<string, unknown> {
  const metadata =
    state && typeof state === 'object'
      ? Object.fromEntries(
          Object.entries(state).filter(([key]) => key.startsWith('__mb_'))
        )
      : {};
  if (mode === 'push') {
    delete metadata.__mb_fallback_entry;
    delete metadata.__mb_watching_scroll;
    delete metadata.__mb_page_scroll;
    metadata.__mb_internal_back = true;
  }
  return metadata;
}

/** URL-only updates preserve the route back to the user's work. */
export function updateNavigationUrl(
  url: string | URL,
  mode: 'replace' | 'push' = 'replace'
) {
  const state = getAppHistoryState(window.history.state, mode);
  if (mode === 'push') window.history.pushState(state, '', url);
  else window.history.replaceState(state, '', url);
}
