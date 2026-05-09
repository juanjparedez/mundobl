import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/series/info-blocks/[id] — editar label/body/sortOrder.
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRole(['ADMIN', 'MODERATOR']);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const blockId = parseInt(id, 10);
    if (isNaN(blockId)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    const body = (await req.json()) as {
      label?: unknown;
      body?: unknown;
      sortOrder?: unknown;
    };

    const data: { label?: string; body?: string; sortOrder?: number } = {};

    if (Object.prototype.hasOwnProperty.call(body, 'label')) {
      if (typeof body.label !== 'string') {
        return NextResponse.json(
          { error: 'label debe ser string' },
          { status: 400 }
        );
      }
      const trimmed = body.label.trim();
      if (!trimmed) {
        return NextResponse.json(
          { error: 'El label es requerido' },
          { status: 422 }
        );
      }
      if (trimmed.length > 60) {
        return NextResponse.json(
          { error: 'El label no puede tener mas de 60 caracteres' },
          { status: 422 }
        );
      }
      data.label = trimmed;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'body')) {
      if (typeof body.body !== 'string') {
        return NextResponse.json(
          { error: 'body debe ser string' },
          { status: 400 }
        );
      }
      const trimmed = body.body.trim();
      if (!trimmed) {
        return NextResponse.json(
          { error: 'El contenido es requerido' },
          { status: 422 }
        );
      }
      data.body = trimmed;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'sortOrder')) {
      if (
        typeof body.sortOrder !== 'number' ||
        !Number.isFinite(body.sortOrder)
      ) {
        return NextResponse.json(
          { error: 'sortOrder debe ser numero' },
          { status: 400 }
        );
      }
      data.sortOrder = body.sortOrder;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    const updated = await prisma.seriesInfoBlock.update({
      where: { id: blockId },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/series/info-blocks/[id]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRole(['ADMIN', 'MODERATOR']);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const blockId = parseInt(id, 10);
    if (isNaN(blockId)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }
    await prisma.seriesInfoBlock.delete({ where: { id: blockId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}
