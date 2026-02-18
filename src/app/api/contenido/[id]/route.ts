import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import { extractVideoId, type Platform } from '@/lib/embed-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();

    if (!body.title?.trim() || !body.url?.trim() || !body.platform) {
      return NextResponse.json(
        { error: 'El título, URL y plataforma son requeridos' },
        { status: 400 }
      );
    }

    const videoId =
      body.videoId?.trim() ||
      extractVideoId(body.platform as Platform, body.url.trim()) ||
      null;

    const item = await prisma.embeddableContent.update({
      where: { id: itemId },
      data: {
        title: body.title.trim(),
        description: body.description?.trim() || null,
        platform: body.platform,
        url: body.url.trim(),
        videoId,
        category: body.category || 'other',
        language: body.language || null,
        thumbnailUrl: body.thumbnailUrl?.trim() || null,
        channelName: body.channelName?.trim() || null,
        channelUrl: body.channelUrl?.trim() || null,
        official: body.official ?? true,
        sortOrder: body.sortOrder ?? 0,
        featured: body.featured ?? false,
        seriesId: body.seriesId ? Number(body.seriesId) : null,
      },
      include: {
        series: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating embeddable content:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el contenido' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await prisma.embeddableContent.delete({ where: { id: itemId } });

    return NextResponse.json({ message: 'Contenido eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting embeddable content:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el contenido' },
      { status: 500 }
    );
  }
}
