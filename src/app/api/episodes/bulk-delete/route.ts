import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de IDs' },
        { status: 400 }
      );
    }

    const result = await prisma.episode.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      deleted: result.count,
      message: `${result.count} episodio(s) eliminado(s)`,
    });
  } catch (error) {
    console.error('Error al eliminar episodios:', error);
    return NextResponse.json(
      { error: 'Error al eliminar los episodios' },
      { status: 500 }
    );
  }
}
