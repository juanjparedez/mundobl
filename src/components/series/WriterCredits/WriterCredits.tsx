'use client';

import Link from 'next/link';
import { PanelCard } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './WriterCredits.css';

export function WriterCredits({
  credits,
}: {
  credits: { writer: { id: number; name: string } }[];
}) {
  const { t } = useLocale();
  if (credits.length === 0) return null;
  return (
    <PanelCard className="writer-credits">
      <h2>{t('writerProfile.role')}</h2>
      <ul>
        {credits.map(({ writer }) => (
          <li key={writer.id}>
            <Link href={`/guionistas/${writer.id}`}>{writer.name}</Link>
          </li>
        ))}
      </ul>
    </PanelCard>
  );
}
