'use client';
import { Tag } from 'antd';
import Link from 'next/link';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { CONTENT_WARNINGS, type ContentWarning } from '@/lib/content-rating';
import './ContentNotice.css';
export function ContentNotice({
  warnings,
  rating = 'UNREVIEWED',
}: {
  warnings: string[];
  rating?: string;
}) {
  const { t } = useLocale();
  return (
    <aside className="content-gate__notice">
      <Tag>
        {t(
          `editorial.${rating === 'ADULT18' ? 'ADULT18' : rating === 'GENERAL' ? 'GENERAL' : 'UNREVIEWED'}`
        )}
      </Tag>
      {warnings
        .filter((w) => CONTENT_WARNINGS.includes(w as ContentWarning))
        .map((w) => (
          <Tag key={w}>{t(`editorial.${w as ContentWarning}`)}</Tag>
        ))}
      <Link href="/preferencias-contenido">{t('editorial.preferences')}</Link>
    </aside>
  );
}
