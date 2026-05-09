import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/series/[id]/info-blocks/reorder
// Body: { orderedIds: number[] }
// Reordena los bloques de la serie segun el orden recibido. Mas robusto
// que enviar PATCH por cada bloque cuando el admin draggea.
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRole(['ADMIN', 'MODERATOR']);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const seriesId = parseInt(id, 10);
    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    const body = (await req.json()) as { orderedIds?: unknown };
    if (
      !Array.isArray(body.orderedIds) ||
      !body.orderedIds.every((x) => typeof x === 'number')
    ) {
      return NextResponse.json(
        { error: 'orderedIds debe ser un array de numeros' },
        { status: 400 }
      );
    }

    // Validar que todos los ids pertenezcan a esta serie (evitar mover
    // bloques de otra serie por error/atacante).
    const existing = await prisma.seriesInfoBlock.findMany({
      where: { seriesId },
      select: { id: true },
    });
    const validIds = new Set(existing.map((b) => b.id));
    const invalid = body.orderedIds.filter((id) => !validIds.has(id));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Bloques no pertenecen a esta serie: ${invalid.join(', ')}` },
        { status: 422 }
      );
    }

    await prisma.$transaction(
      body.orderedIds.map((blockId, idx) =>
        prisma.seriesInfoBlock.update({
          where: { id: blockId },
          data: { sortOrder: idx },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}
