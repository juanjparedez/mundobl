import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { getRuntimeFreezeState } from '@/lib/runtime-freeze';

export const runtime = 'nodejs';

export async function GET() {
  const authResult = await requireRole(['ADMIN']);
  if (!authResult.authorized) return authResult.response;

  return NextResponse.json({
    ok: true,
    state: getRuntimeFreezeState(),
    serverTime: Date.now(),
  });
}
