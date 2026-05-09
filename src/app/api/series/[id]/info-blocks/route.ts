import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/series/[id]/info-blocks — lista publica, ordenada por sortOrder.
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const seriesId = parseInt(id, 10);
    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }
    const blocks = await prisma.seriesInfoBlock.findMany({
      where: { seriesId },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return NextResponse.json(blocks);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}

// POST /api/series/[id]/info-blocks — crear nuevo bloque (admin/moderator).
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRole(['ADMIN', 'MODERATOR']);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const seriesId = parseInt(id, 10);
    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    const body = (await req.json()) as {
      label?: unknown;
      body?: unknown;
      sortOrder?: unknown;
    };

    const label = typeof body.label === 'string' ? body.label.trim() : '';
    const blockBody = typeof body.body === 'string' ? body.body.trim() : '';

    if (!label) {
      return NextResponse.json(
        { error: 'El label es requerido' },
        { status: 422 }
      );
    }
    if (label.length > 60) {
      return NextResponse.json(
        { error: 'El label no puede tener mas de 60 caracteres' },
        { status: 422 }
      );
    }
    if (!blockBody) {
      return NextResponse.json(
        { error: 'El contenido es requerido' },
        { status: 422 }
      );
    }

    // Si no se especifica sortOrder, lo poneposo al final.
    let sortOrder: number;
    if (typeof body.sortOrder === 'number' && Number.isFinite(body.sortOrder)) {
      sortOrder = body.sortOrder;
    } else {
      const max = await prisma.seriesInfoBlock.findFirst({
        where: { seriesId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
      sortOrder = (max?.sortOrder ?? -1) + 1;
    }

    const created = await prisma.seriesInfoBlock.create({
      data: { seriesId, label, body: blockBody, sortOrder },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}
