import { after } from 'next/server';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { logPageView } from '@/lib/access-log';
import { isIpBanned } from '@/lib/database';
import {
  ADMIN_GATE_IP_HEADER,
  ADMIN_GATE_LOG_HEADER,
  ADMIN_GATE_PATH_HEADER,
} from '@/lib/admin-gate-headers';

/**
 * Lo de /admin que necesita base: ban por IP y log de visita. Vivia en
 * src/proxy.ts, que ya no importa Prisma (ver ahi por que). El proxy sigue
 * resolviendo sesion y rol antes de llegar aca.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const ip = requestHeaders.get(ADMIN_GATE_IP_HEADER);
  if (ip && (await isIpBanned(ip))) notFound();

  const path = requestHeaders.get(ADMIN_GATE_PATH_HEADER);
  if (path && requestHeaders.get(ADMIN_GATE_LOG_HEADER) === '1') {
    // after(): en Workers una promesa suelta se corta al responder.
    after(() => logPageView(path));
  }
  return children;
}
