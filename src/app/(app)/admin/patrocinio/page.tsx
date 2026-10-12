import { AdminNav } from '../AdminNav';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth-helpers';
import { getSupportAdmin } from '@/lib/database';
import { SupportError } from '@/lib/support-input';
import { SupportAdmin } from '@/components/support/SupportAdmin/SupportAdmin';
export const metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function SupportAdminRoute() {
  const auth = await requireRole(['ADMIN']);
  if (!auth.authorized) notFound();
  const initial = await getSupportAdmin(auth.userId).catch((error: unknown) => {
    if (error instanceof SupportError && error.status === 403) notFound();
    throw error;
  });
  return (
    <>
      <AdminNav />
      <SupportAdmin initial={initial} />
    </>
  );
}
