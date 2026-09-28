'use client';
import { Button } from 'antd';
import { signIn } from 'next-auth/react';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './CommunityAccess.css';
export function CommunityAccess() {
  const { t } = useLocale();
  return (
    <div className="community-access">
      <EmptyState
        title={t('communitySpace.profile')}
        description={t('communitySpace.profileIntro')}
        action={
          <Button
            type="primary"
            onClick={() =>
              signIn('google', { callbackUrl: window.location.href })
            }
          >
            {t('communityHub.login')}
          </Button>
        }
      />
    </div>
  );
}
