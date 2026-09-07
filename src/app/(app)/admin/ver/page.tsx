import type { Metadata } from 'next';
import { getVerAdminRows } from '@/lib/database';
import { VerAdminClient } from './VerAdminClient';

export const metadata: Metadata = {
  title: 'Administrar /ver',
};

// Es un panel de control: siempre datos frescos, nunca una copia cacheada.
export const dynamic = 'force-dynamic';

export default async function AdminVerPage() {
  const rows = await getVerAdminRows();
  return <VerAdminClient rows={rows} />;
}
