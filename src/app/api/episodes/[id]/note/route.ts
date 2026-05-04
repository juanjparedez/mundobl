import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

const NOTE_MAX = 5000;

// GET /api/episodes/[id]/note — devuelve la nota propia (o null)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const episodeId = parseInt(id, 10);
    if (isNaN(episodeId)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    const note = await prisma.episodeNote.findUnique({
      where: {
        userId_episodeId: { userId: authResult.userId, episodeId },
      },
    });
    return NextResponse.json(note);
  } catch (error) {
    console.error('Error fetching episode note:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

// PUT /api/episodes/[id]/note — upsert
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const episodeId = parseInt(id, 10);
    if (isNaN(episodeId)) {
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

    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },
      select: { id: true },
    });
    if (!episode) {
      return NextResponse.json(
        { error: 'Episodio no encontrado' },
        { status: 404 }
      );
    }

    const note = await prisma.episodeNote.upsert({
      where: {
        userId_episodeId: { userId: authResult.userId, episodeId },
      },
      create: { userId: authResult.userId, episodeId, body },
      update: { body },
    });
    return NextResponse.json(note);
  } catch (error) {
    console.error('Error saving episode note:', error);
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }
}

// DELETE /api/episodes/[id]/note
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const episodeId = parseInt(id, 10);
    if (isNaN(episodeId)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    await prisma.episodeNote
      .delete({
        where: {
          userId_episodeId: { userId: authResult.userId, episodeId },
        },
      })
      .catch(() => null); // si no existe, ok igual

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting episode note:', error);
    return NextResponse.json({ error: 'Error al borrar' }, { status: 500 });
  }
}
