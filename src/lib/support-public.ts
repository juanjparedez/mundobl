import { unstable_cache } from 'next/cache';
import { getSupportPublic } from './database';
export const SUPPORT_TAG = 'support-public';
export const getCachedSupport = unstable_cache(
  getSupportPublic,
  [SUPPORT_TAG],
  { tags: [SUPPORT_TAG], revalidate: false }
);
