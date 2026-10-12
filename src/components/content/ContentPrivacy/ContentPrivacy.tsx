'use client';
import Link from 'next/link';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './ContentPrivacy.css';
export function ContentPrivacy() {
  const { t } = useLocale();
  return (
    <section className="content-privacy">
      <h2>{t('editorial.preferences')}</h2>
      <p>{t('editorial.privacy')}</p>
      <Link href="/preferencias-contenido">{t('editorial.preferences')}</Link>
    </section>
  );
}
