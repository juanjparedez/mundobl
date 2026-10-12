import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';
import { PilotReport } from '@/components/content/PilotReport/PilotReport';
import { AdminNav } from '../AdminNav';
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };
export default async function PilotPage() {
  const auth = await requireRole(['ADMIN']);
  if (!auth.authorized) notFound();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - 59);
  from.setUTCHours(0, 0, 0, 0);
  const rows = await prisma.pilotClickDaily.findMany({
    where: { day: { gte: from } },
    orderBy: [{ day: 'desc' }, { placement: 'asc' }],
    take: 120,
  });
  return (
    <>
      <AdminNav />
      <PilotReport
        rows={rows.map((row) => ({
          ...row,
          day: row.day.toISOString().slice(0, 10),
        }))}
      />
    </>
  );
}
