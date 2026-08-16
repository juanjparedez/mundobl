import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

const NOTE_MAX = 5000;

// GET /api/series/[id]/note — devuelve la nota propia (o null)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const seriesId = parseInt(id, 10);
    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    const note = await prisma.seriesNote.findUnique({
      where: {
        userId_seriesId: { userId: authResult.userId, seriesId },
      },
    });
    return NextResponse.json(note);
  } catch (error) {
    console.error('Error fetching series note:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

// PUT /api/series/[id]/note — upsert
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const seriesId = parseInt(id, 10);
    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    const json = (await request.json()) as { body?: string };
    const body = json.body?.trim();
    if (!body) {
      return NextResponse.json(
        { error: 'El cuerpo de la nota es requerido' },
        { status: 400 }
      );
    }
    if (body.length > NOTE_MAX) {
      return NextResponse.json(
        { error: `Maximo ${NOTE_MAX} caracteres` },
        { status: 400 }
      );
    }

    const series = await prisma.series.findUnique({
      where: { id: seriesId },
      select: { id: true },
    });
    if (!series) {
      return NextResponse.json(
        { error: 'Serie no encontrada' },
        { status: 404 }
      );
    }

    const note = await prisma.seriesNote.upsert({
      where: {
        userId_seriesId: { userId: authResult.userId, seriesId },
      },
      create: { userId: authResult.userId, seriesId, body },
      update: { body },
    });
    return NextResponse.json(note);
  } catch (error) {
    console.error('Error saving series note:', error);
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }
}

// DELETE /api/series/[id]/note
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const seriesId = parseInt(id, 10);
    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    await prisma.seriesNote
      .delete({
        where: {
          userId_seriesId: { userId: authResult.userId, seriesId },
        },
      })
      .catch(() => null); // si no existe, ok igual

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting series note:', error);
    return NextResponse.json({ error: 'Error al borrar' }, { status: 500 });
  }
}
