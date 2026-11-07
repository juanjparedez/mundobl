import { NextResponse } from 'next/server';
import { logAbuse } from '@/lib/access-log';
import {
  ADMIN_GATE_IP_HEADER,
  ADMIN_GATE_KEY_HEADER,
  ADMIN_GATE_PATH_HEADER,
} from '@/lib/admin-gate-headers';

/**
 * Destino interno de src/proxy.ts para los paths de scanners en /admin:
 * registra el intento (logAbuse) y responde 404. Solo anota si el request lo
 * reescribio el proxy (header con AUTH_SECRET); llamado directo, es un 404.
 */
async function handle(request: Request): Promise<NextResponse> {
  const secret = process.env.AUTH_SECRET;
  const fromProxy =
    !!secret && request.headers.get(ADMIN_GATE_KEY_HEADER) === secret;
  const ip = request.headers.get(ADMIN_GATE_IP_HEADER);
  const path = request.headers.get(ADMIN_GATE_PATH_HEADER);
  if (fromProxy && ip && path) await logAbuse(path, ip, 'scanner');
  return new NextResponse(null, { status: 404 });
}

export const GET = handle;
export const POST = handle;
export const HEAD = handle;
