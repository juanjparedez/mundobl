'use client';
import { useSession, signIn } from 'next-auth/react';
import { Button } from 'antd';
import type { ReactNode } from 'react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import {
  CommunityNavigation,
  type CommunityNavigationSection,
} from '../CommunityNavigation/CommunityNavigation';
import './CommunitySpace.css';

export function CommunitySpace({
  active,
  title,
  intro,
  actions,
  children,
}: {
  active: CommunityNavigationSection;
  title: string;
  intro?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useLocale();
  const { data: session } = useSession();
  return (
    <section className="community-space">
      <CommunityNavigation active={active} />
      <header className="community-space__header">
        <div>
          <span className="community-space__eyebrow">
            {t('communityHub.eyebrow')}
          </span>
          <h1>{title}</h1>
          {intro && <p>{intro}</p>}
        </div>
        <div className="community-space__actions">
          {actions}
          {!session?.user && (
            <Button
              onClick={() =>
                signIn('google', { callbackUrl: window.location.href })
              }
            >
              {t('communityHub.login')}
            </Button>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}
