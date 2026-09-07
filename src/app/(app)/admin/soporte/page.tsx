import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth-helpers';
import { getAllSupportThreads } from '@/lib/database';
import { PanelCard, SectionHeader } from '@/components/design-system';
import { SupportThreadList } from '@/components/support/SupportThreadList/SupportThreadList';
import { AdminNav } from '../AdminNav';
import '../admin.css';

export const metadata: Metadata = {
  title: 'Soporte de colaboradores | Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminSoportePage() {
  const authResult = await requireRole(['ADMIN', 'MODERATOR']);
  if (!authResult.authorized) redirect('/');

  const threads = await getAllSupportThreads();
  const pending = threads.filter((thread) => thread.status === 'OPEN').length;

  return (
    <>
      <AdminNav />
      <main className="admin-content">
        <PanelCard
          header={
            <SectionHeader
              as="h1"
              size="lg"
              title="Soporte de colaboradores"
              subtitle={
                pending > 0
                  ? `${pending} ${pending === 1 ? 'consulta espera' : 'consultas esperan'} respuesta.`
                  : 'No hay consultas esperando respuesta.'
              }
            />
          }
        >
          <SupportThreadList
            threads={threads}
            basePath="/admin/soporte"
            showAuthor
            emptyTitle="Sin consultas"
            emptyDescription="Cuando un colaborador escriba desde su panel, la conversación aparece acá."
          />
        </PanelCard>
      </main>
    </>
  );
}
