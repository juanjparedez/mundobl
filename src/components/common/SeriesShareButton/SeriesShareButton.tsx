'use client';
import { useSession } from 'next-auth/react';
import {
  ShareButton,
  type ShareButtonChannel,
} from '../ShareButton/ShareButton';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import './SeriesShareButton.css';
export function SeriesShareButton({
  seriesId,
  title,
  path,
}: {
  seriesId: number;
  title: string;
  path: string;
}) {
  const { t } = useLocale();
  const { status } = useSession();
  // Con sesion, anota la serie compartida para los logros de compartir. Es
  // best effort: si falla, el share ya ocurrio y no hay nada que mostrar.
  const recordShare = (channel: ShareButtonChannel) => {
    if (status !== 'authenticated') return;
    void fetch('/api/user/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesId, channel }),
      keepalive: true,
    }).catch(() => undefined);
  };
  return (
    <ShareButton
      title={title}
      path={path}
      text={interpolateMessage(t('qualitySupport.message'), { title })}
      labels={{
        share: t('qualitySupport.share'),
        copied: t('qualitySupport.copied'),
        copy: t('qualitySupport.copy'),
        copyError: t('qualitySupport.copyError'),
      }}
      onShared={recordShare}
    />
  );
}
