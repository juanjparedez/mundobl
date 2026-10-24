import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import {
  importLocalProgress,
  parseLocalImport,
} from '@/lib/local-progress-import';

const headers = { 'Cache-Control': 'private, no-store' };

// POST /api/user/local-progress — { items: [{ seriesId, episodeIds, intent? }] }
// Lo que se siguio sin cuenta en este navegador, al iniciar sesion.
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;
  const items = parseLocalImport(await request.json().catch(() => null));
  if (!items)
    return NextResponse.json(
      { error: 'Body inválido' },
      { status: 400, headers }
    );
  try {
    const result = await importLocalProgress(auth.userId, items);
    return NextResponse.json(result, { headers });
  } catch (error) {
    console.error('Error al importar progreso local:', error);
    return NextResponse.json(
      { error: 'No se pudo importar el progreso' },
      { status: 500, headers }
    );
  }
}
