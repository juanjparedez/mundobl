import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth-helpers';
import { getProducerReport } from '@/lib/producer-report';
import { isProducerReportWindow } from '@/lib/producer-report-shape';
import { ProducerReport } from '@/components/content/ProducerReport/ProducerReport';
import { AdminNav } from '../AdminNav';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function ProducerReportPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const auth = await requireRole(['ADMIN']);
  if (!auth.authorized) notFound();
  const requested = Number((await searchParams).dias);
  const report = await getProducerReport(
    isProducerReportWindow(requested) ? requested : 30
  );
  return (
    <>
      <AdminNav />
      <ProducerReport report={report} />
    </>
  );
}
