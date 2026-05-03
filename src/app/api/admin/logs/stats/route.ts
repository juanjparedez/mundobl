import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { getLogStats } from '@/lib/access-log';

// GET /api/admin/logs/stats — admin only, retorna estadisticas agregadas
export async function GET() {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const stats = await getLogStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching log stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadisticas' },
      { status: 500 }
    );
  }
}
