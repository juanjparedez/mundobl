'use client';
import { useState } from 'react';
import { Alert, Button } from 'antd';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useCommunityAction } from '@/hooks/useCommunityAction';
import './CommunityShareLink.css';

export function CommunityShareLink({ path }: { path: string }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const { busy, error, run } = useCommunityAction();
  return (
    <div className="community-share-link">
      <Button
        disabled={busy}
        onClick={() =>
          void run(async () => {
            await navigator.clipboard.writeText(
              `${window.location.origin}${path}`
            );
            setCopied(true);
          })
        }
      >
        {t(copied ? 'communitySpace.copied' : 'communitySpace.copyLink')}
      </Button>
      {error && <Alert type="error" title={error} showIcon />}
    </div>
  );
}
