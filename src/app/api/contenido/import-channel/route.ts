import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import { detectPlatform } from '@/lib/embed-helpers';
import { fetchYouTubeChannel, fetchVimeoChannel } from '@/lib/channel-fetcher';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const { channelUrl, pageToken } = body as {
      channelUrl: string;
      pageToken?: string;
    };

    if (!channelUrl) {
      return NextResponse.json(
        { error: 'La URL del canal es requerida' },
        { status: 400 }
      );
    }

    const platform = detectPlatform(channelUrl);

    let result;

    if (platform === 'YouTube') {
      result = await fetchYouTubeChannel(channelUrl, pageToken);
    } else if (platform === 'Vimeo') {
      result = await fetchVimeoChannel(channelUrl, pageToken);
    } else {
      return NextResponse.json(
        { error: 'Plataforma no soportada. Usá una URL de YouTube o Vimeo.' },
        { status: 400 }
      );
    }

    // Check which videos are already imported
    const videoIds = result.videos.map((v) => v.videoId).filter(Boolean);

    const existing = await prisma.embeddableContent.findMany({
      where: {
        platform: platform,
        videoId: { in: videoIds },
      },
      select: { videoId: true },
    });

    const alreadyImported = existing
      .map((e) => e.videoId)
      .filter((id): id is string => id !== null);

    return NextResponse.json({
      ...result,
      alreadyImported,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al buscar videos';
    const status = message.includes('no configurad') ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
