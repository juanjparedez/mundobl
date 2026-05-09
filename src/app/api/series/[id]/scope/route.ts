import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Cambiar el alcance de la serie en el catalogo (PERSONAL | WATCHABLE_ONLY)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const seriesId = parseInt(id, 10);
    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const newScope =
      body.catalogScope === 'WATCHABLE_ONLY' ? 'WATCHABLE_ONLY' : 'PERSONAL';

    const updated = await prisma.series.update({
      where: { id: seriesId },
      data: { catalogScope: newScope },
      select: { id: true, catalogScope: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error al cambiar scope:', error);
    return NextResponse.json(
      { error: 'Error al cambiar el alcance' },
      { status: 500 }
    );
  }
}
