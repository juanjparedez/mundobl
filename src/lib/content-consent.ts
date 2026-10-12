import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const CONTENT_COOKIE = 'mundobl-content-consent';
export const CONTENT_COOKIE_AGE = 60 * 60 * 24 * 30;

export function signContentConsent(expires: number, secret: string): string {
  return `${expires}.${createHmac('sha256', secret).update(`content18:${expires}`).digest('hex')}`;
}

export function verifyContentConsent(
  value: string | undefined,
  secret: string,
  now = Date.now()
): boolean {
  if (!value || !secret || !/^\d+\.[a-f0-9]{64}$/.test(value)) return false;
  const expires = Number(value.split('.')[0]);
  if (expires <= now || expires > now + CONTENT_COOKIE_AGE * 1000 + 1000)
    return false;
  const expected = signContentConsent(expires, secret);
  return (
    value.length === expected.length &&
    timingSafeEqual(Buffer.from(value), Buffer.from(expected))
  );
}

/** Self-declaration, not identity or age verification. Never call inside shared data caches. */
export async function hasContentConsent(): Promise<boolean> {
  return verifyContentConsent(
    (await cookies()).get(CONTENT_COOKIE)?.value,
    process.env.AUTH_SECRET || ''
  );
}
