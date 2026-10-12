import { notFound } from 'next/navigation';
import { getCachedSupport } from '@/lib/support-public';
import { SupportPublic } from '@/components/support/SupportPublic/SupportPublic';
export default async function SupportRoute() {
  const content = await getCachedSupport();
  if (!content) notFound();
  return <SupportPublic content={content} />;
}
