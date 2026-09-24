import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { getRetentionStats } from '@/lib/retention-stats';

// GET /api/admin/stats/retention — admin only
export async function GET() {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const stats = await getRetentionStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching retention stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener las métricas de retención' },
      { status: 500 }
    );
  }
}
