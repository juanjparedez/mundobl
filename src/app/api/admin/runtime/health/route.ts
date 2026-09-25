import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { getRuntimeHealth } from '@/lib/runtime-health';

// GET /api/admin/runtime/health — crons y dependencias (admin only)
export async function GET() {
  const authResult = await requireRole(['ADMIN']);
  if (!authResult.authorized) return authResult.response;

  try {
    return NextResponse.json(await getRuntimeHealth());
  } catch (error) {
    console.error('Error fetching runtime health:', error);
    return NextResponse.json(
      { error: 'No se pudo obtener la salud del sistema' },
      { status: 500 }
    );
  }
}
