import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { requireRole } from '@/lib/auth-helpers';
import { getSupportThreadDetail } from '@/lib/database';
import { SupportThreadView } from '@/components/support/SupportThreadView/SupportThreadView';
import { AdminNav } from '../../AdminNav';
import '../../admin.css';

export const metadata: Metadata = {
  title: 'Consulta de colaborador | Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminSoporteThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authResult = await requireRole(['ADMIN', 'MODERATOR']);
  if (!authResult.authorized) redirect('/');

  const id = Number.parseInt((await params).id, 10);
  if (Number.isNaN(id)) notFound();

  const thread = await getSupportThreadDetail(id);
  if (!thread) notFound();

  return (
    <>
      <AdminNav />
      <main className="admin-content">
        <Link href="/admin/soporte">← Volver a soporte</Link>
        <SupportThreadView thread={thread} viewerIsStaff />
      </main>
    </>
  );
}
