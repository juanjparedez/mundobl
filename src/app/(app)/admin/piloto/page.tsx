import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth-helpers';
import { getPilotReport } from '@/lib/pilot-report';
import { PilotReport } from '@/components/content/PilotReport/PilotReport';
import { AdminNav } from '../AdminNav';
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };
export default async function PilotPage() {
  const auth = await requireRole(['ADMIN']);
  if (!auth.authorized) notFound();
  const report = await getPilotReport();
  return (
    <>
      <AdminNav />
      <PilotReport {...report} />
    </>
  );
}
