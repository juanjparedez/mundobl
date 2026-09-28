'use client';
import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Alert, Button } from 'antd';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { communityFetch } from '@/lib/community-client';
import { useCommunityAction } from '@/hooks/useCommunityAction';
import './SaveCommunityRecommendation.css';

export function SaveCommunityRecommendation({
  seriesId,
}: {
  seriesId: number;
}) {
  const { t } = useLocale();
  const { data: session, status } = useSession();
  const { busy, error, run } = useCommunityAction();
  const [result, setResult] = useState<'added' | 'existing' | null>(null);
  return (
    <div className="save-community-recommendation">
      {error && <Alert type="error" title={error} showIcon />}
      <Button
        loading={busy}
        disabled={result !== null || status === 'loading'}
        onClick={() => {
          if (!session?.user) {
            void signIn('google', { callbackUrl: window.location.href });
            return;
          }
          void run(async () => {
            const response = await communityFetch<{ added: boolean }>(
              '/api/community/recommendations',
              'POST',
              { seriesId }
            );
            setResult(response.added ? 'added' : 'existing');
          });
        }}
      >
        {t(
          result === 'added'
            ? 'communitySpace.pendingSaved'
            : result === 'existing'
              ? 'communitySpace.alreadySaved'
              : 'communitySpace.savePending'
        )}
      </Button>
    </div>
  );
}
