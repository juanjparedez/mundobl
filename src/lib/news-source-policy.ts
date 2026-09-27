/** Audited 2026-09-27. Keep directory entries; pause only automated ingestion. */
const PAUSED_FEEDS: Record<string, string> = {
  'mundoasia.es': 'Connection failed during source audit.',
  'cafebl.com': 'Connection failed during source audit.',
  'bltai.com': 'RSS responds HTTP 403; requires publisher access.',
  'twitter.com': 'Social profile has no public RSS feed.',
  'x.com': 'Social profile has no public RSS feed.',
};

export function newsSourcePauseReason(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return PAUSED_FEEDS[host] ?? null;
  } catch {
    return null; // Invalid URLs are failures, not silently skipped sources.
  }
}
