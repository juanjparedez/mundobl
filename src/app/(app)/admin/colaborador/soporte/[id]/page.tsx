import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getSupportThreadDetail } from '@/lib/database';
import { SupportThreadView } from '@/components/support/SupportThreadView/SupportThreadView';
import { ColaboradorNav } from '../../ColaboradorNav';
import '../../colaborador.css';

export const metadata: Metadata = {
  title: 'Consulta | Mi panel de colaborador',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ColaboradorSoporteThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== 'COLLABORATOR' && session.user.role !== 'ADMIN')
  ) {
    redirect('/catalogo');
  }

  const id = Number.parseInt((await params).id, 10);
  if (Number.isNaN(id)) notFound();

  const thread = await getSupportThreadDetail(id);
  // Un colaborador solo ve lo suyo. 404 y no 403 a proposito: que ni
  // siquiera pueda deducir cuantos hilos ajenos existen.
  if (!thread || thread.userId !== session.user.id) notFound();

  return (
    <div className="colaborador-page">
      <ColaboradorNav />
      <Link href="/admin/colaborador/soporte">← Volver a soporte</Link>
      <SupportThreadView thread={thread} viewerIsStaff={false} />
    </div>
  );
}
