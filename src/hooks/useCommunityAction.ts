'use client';
import { useState } from 'react';
import { CommunityRequestError } from '@/lib/community-client';
import { useLocale } from '@/lib/providers/LocaleProvider';

export function useCommunityAction() {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (failure) {
      setError(
        t(
          failure instanceof CommunityRequestError && failure.code === 'paused'
            ? 'communitySpace.paused'
            : failure instanceof CommunityRequestError && failure.status === 409
              ? 'communitySpace.conflict'
              : failure instanceof CommunityRequestError &&
                  failure.status === 429
                ? 'communityHub.rateLimit'
                : 'communityHub.error'
        )
      );
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}
