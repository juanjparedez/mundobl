import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import { extractVideoId, type Platform } from '@/lib/embed-helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') || undefined;
    const category = searchParams.get('category') || undefined;
    const featured = searchParams.get('featured');

    const items = await prisma.embeddableContent.findMany({
      where: {
        ...(platform ? { platform } : {}),
        ...(category ? { category } : {}),
        ...(featured === 'true' ? { featured: true } : {}),
      },
      include: {
        series: { select: { id: true, title: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching embeddable content:', error);
    return NextResponse.json(
      { error: 'Error al obtener el contenido' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

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

    const item = await prisma.embeddableContent.create({
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

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating embeddable content:', error);
    return NextResponse.json(
      { error: 'Error al crear el contenido' },
      { status: 500 }
    );
  }
}
