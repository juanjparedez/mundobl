import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';
import { ProgressNotFoundError, setEpisodesWatched } from '@/lib/tracking';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const MAX_EPISODES = 200;

function isEpisodeIdList(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= MAX_EPISODES &&
    value.every((id) => Number.isInteger(id))
  );
}

// POST /api/series/[id]/watched — { episodeIds, watched }: marca o desmarca
// varios episodios en un solo request (las partes de un capitulo en /ver).
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const seriesId = parseInt(id, 10);
    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const { episodeIds, watched } = (await request.json()) as {
      episodeIds?: unknown;
      watched?: unknown;
    };
    if (!isEpisodeIdList(episodeIds) || typeof watched !== 'boolean') {
      return NextResponse.json(
        { error: 'Body inválido: episodeIds (enteros) y watched (boolean)' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction((tx) =>
      setEpisodesWatched(tx, authResult.userId, seriesId, episodeIds, watched)
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ProgressNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error al marcar episodios:', error);
    return NextResponse.json(
      { error: 'Error al marcar episodios' },
      { status: 500 }
    );
  }
}
