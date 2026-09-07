import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSupportThreadsForUser } from '@/lib/database';
import { PanelCard, SectionHeader } from '@/components/design-system';
import { SupportThreadList } from '@/components/support/SupportThreadList/SupportThreadList';
import { ColaboradorNav } from '../ColaboradorNav';
import { NuevaConsultaForm } from './NuevaConsultaForm';
import '../colaborador.css';

export const metadata: Metadata = {
  title: 'Soporte | Mi panel de colaborador',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ColaboradorSoportePage() {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== 'COLLABORATOR' && session.user.role !== 'ADMIN')
  ) {
    redirect('/catalogo');
  }

  const threads = await getSupportThreadsForUser(session.user.id);

  return (
    <div className="colaborador-page">
      <ColaboradorNav />

      <PanelCard
        header={
          <SectionHeader
            as="h1"
            size="lg"
            title="Soporte"
            subtitle="Canal privado con curaduría. Nadie más que el equipo ve esto."
          />
        }
      >
        <NuevaConsultaForm />
      </PanelCard>

      <PanelCard header={<SectionHeader title="Tus consultas" />}>
        <SupportThreadList
          threads={threads}
          basePath="/admin/colaborador/soporte"
          emptyTitle="Todavía no abriste ninguna consulta"
          emptyDescription="Si algo no te cierra sobre cómo cargar, o necesitás que ajustemos algo de tu cuenta, escribinos acá."
        />
      </PanelCard>
    </div>
  );
}
