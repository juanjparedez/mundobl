'use client';
import { SupportPage } from '../SupportPage/SupportPage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { SupportContent } from '@/lib/support-input';
import { useSupportLabels } from '../useSupportLabels';
import './SupportPublic.css';
export function SupportPublic({ content }: { content: SupportContent }) {
  const { t } = useLocale();
  const labels = useSupportLabels(t);
  return <SupportPage content={content} labels={labels} />;
}
