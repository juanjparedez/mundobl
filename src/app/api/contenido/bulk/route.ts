import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import { extractVideoId, type Platform } from '@/lib/embed-helpers';
import { notifySeriesSubscribers } from '@/lib/notifications';

interface BulkItem {
  title: string;
  url: string;
  platform: string;
  videoId?: string;
  description?: string;
  thumbnailUrl?: string;
  channelName?: string;
  channelUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const { items, category, language, seriesId } = body as {
      items: BulkItem[];
      category?: string;
      language?: string;
      seriesId?: number;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un item' },
        { status: 400 }
      );
    }

    const data = items.map((item) => {
      if (!item.title || !item.url || !item.platform) {
        throw new Error(`Item inválido: falta title, url o platform`);
      }

      const videoId =
        item.videoId ||
        extractVideoId(item.platform as Platform, item.url) ||
        undefined;

      return {
        title: item.title.trim(),
        url: item.url.trim(),
        platform: item.platform,
        videoId: videoId || null,
        description: item.description?.trim() || null,
        thumbnailUrl: item.thumbnailUrl?.trim() || null,
        channelName: item.channelName?.trim() || null,
        channelUrl: item.channelUrl?.trim() || null,
        category: category || 'other',
        language: language || null,
        seriesId: seriesId ? Number(seriesId) : null,
        official: true,
      };
    });

    const result = await prisma.embeddableContent.createMany({
      data,
      skipDuplicates: true,
    });

    if (seriesId && result.count > 0) {
      const sid = Number(seriesId);
      const serieMeta = await prisma.series.findUnique({
        where: { id: sid },
        select: { title: true },
      });
      const serieTitle = serieMeta?.title ?? 'una serie';
      await notifySeriesSubscribers({
        seriesId: sid,
        type: 'content_added',
        title: `Nuevo contenido en ${serieTitle}`,
        body:
          result.count === 1
            ? 'Se agrego un contenido nuevo'
            : `Se agregaron ${result.count} contenidos nuevos`,
        refType: 'embeddable_content_bulk',
        refId: `${sid}:${Date.now()}`,
      });
    }

    return NextResponse.json({ created: result.count }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al importar';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
