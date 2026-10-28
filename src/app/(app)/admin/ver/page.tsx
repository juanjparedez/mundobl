import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getVerAdminRows } from '@/lib/database';
import { viewerCountryFromHeaders } from '@/lib/viewer-country';
import { VerAdminClient } from './VerAdminClient';

export const metadata: Metadata = {
  title: 'Administrar /ver',
};

// Es un panel de control: siempre datos frescos, nunca una copia cacheada.
export const dynamic = 'force-dynamic';

export default async function AdminVerPage() {
  // "Reproducibles" se cuenta desde el pais de quien mira el panel, igual
  // que /ver para cualquier visitante.
  const rows = await getVerAdminRows(viewerCountryFromHeaders(await headers()));
  return <VerAdminClient rows={rows} />;
}
