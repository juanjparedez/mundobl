import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCachedSupport } from '@/lib/support-public';
import { SupportPublic } from '@/components/support/SupportPublic/SupportPublic';
export const metadata: Metadata = {
  alternates: { canonical: '/apoyar' },
};

export default async function SupportRoute() {
  const content = await getCachedSupport();
  if (!content) notFound();
  return <SupportPublic content={content} />;
}
