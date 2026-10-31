import { NextResponse } from 'next/server';
import { getAdminStatistics } from '@/lib/admin-statistics';
import { requireRole } from '@/lib/auth-helpers';

export async function GET() {
  const auth = await requireRole(['ADMIN', 'MODERATOR']);
  if (!auth.authorized) return auth.response;
  try {
    return NextResponse.json(await getAdminStatistics(), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
