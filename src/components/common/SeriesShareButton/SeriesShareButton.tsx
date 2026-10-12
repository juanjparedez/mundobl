'use client';
import { ShareButton } from '../ShareButton/ShareButton';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import './SeriesShareButton.css';
export function SeriesShareButton({
  title,
  path,
}: {
  title: string;
  path: string;
}) {
  const { t } = useLocale();
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
    />
  );
}
