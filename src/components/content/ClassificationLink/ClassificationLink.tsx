'use client';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './ClassificationLink.css';
export function ClassificationLink({ id }: { id: number }) {
  const { t } = useLocale();
  return (
    <div className="classification-link">
      <a
        href={`/admin/series/${id}/clasificacion`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('editorial.classification')}
      </a>
    </div>
  );
}
