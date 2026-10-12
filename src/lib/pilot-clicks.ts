export const PILOT_PLACEMENTS = ['series', 'platforms'] as const;
export type PilotPlacement = (typeof PILOT_PLACEMENTS)[number];

export function isGagaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      ['gagaoolala.com', 'www.gagaoolala.com'].includes(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.port
    );
  } catch {
    return false;
  }
}

/** Measurement cannot interrupt navigation. No personal identifiers or tracking history. */
export function recordPilotClick(
  placement: PilotPlacement,
  watchLinkId?: number
) {
  try {
    // One timestamp per placement; never build a local per-title click history.
    const key = `mundobl-pilot:${placement}`;
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last < 30_000) return;
    sessionStorage.setItem(key, String(Date.now()));
    void fetch('/api/pilot-clicks', {
      method: 'POST',
      keepalive: true,
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placement, watchLinkId }),
    }).catch(() => undefined);
  } catch {
    /* Storage restrictions must not break the outgoing link. */
  }
}
