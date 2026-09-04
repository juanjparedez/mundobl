import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ImportarClient } from '../../series/importar/ImportarClient';
import '../../series/importar/importar.css';
import { ColaboradorNav } from '../ColaboradorNav';
import '../colaborador.css';

export const metadata: Metadata = {
  title: 'Importar desde YouTube | Mi panel de colaborador',
  robots: { index: false, follow: false },
};

export default async function ColaboradorImportarPage() {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== 'COLLABORATOR' && session.user.role !== 'ADMIN')
  ) {
    redirect('/catalogo');
  }

  return (
    <div className="colaborador-page">
      <ColaboradorNav />
      <div className="importar-page">
        <ImportarClient variant="collaborator" />
      </div>
    </div>
  );
}
