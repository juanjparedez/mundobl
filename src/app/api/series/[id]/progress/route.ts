import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';
import {
  setProgress,
  ProgressNotFoundError,
  type ProgressTarget,
  type ProgressOptions,
} from '@/lib/tracking';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ProgressRequestBody {
  upToEpisodeId?: unknown;
  seasonNumber?: unknown;
  episodeNumber?: unknown;
  direction?: unknown;
  inclusive?: unknown;
  completeIfAll?: unknown;
}

// POST - "Voy por el episodio N": marca ese episodio y los anteriores como
// vistos (o desmarca los posteriores con direction: 'unmark') en una sola
// llamada.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const seriesId = parseInt(id, 10);
    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
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

    const body = (await request.json()) as ProgressRequestBody;

    const target: ProgressTarget = {};
    if (typeof body.upToEpisodeId === 'number') {
      target.upToEpisodeId = body.upToEpisodeId;
    } else if (
      typeof body.seasonNumber === 'number' &&
      typeof body.episodeNumber === 'number'
    ) {
      target.seasonNumber = body.seasonNumber;
      target.episodeNumber = body.episodeNumber;
    } else {
      return NextResponse.json(
        {
          error:
            'Body inválido: se requiere upToEpisodeId o seasonNumber + episodeNumber',
        },
        { status: 400 }
      );
    }

    if (body.direction !== undefined && body.direction !== 'unmark') {
      return NextResponse.json(
        { error: "direction inválido: solo se admite 'unmark'" },
        { status: 400 }
      );
    }
    if (
      body.completeIfAll !== undefined &&
      typeof body.completeIfAll !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'completeIfAll debe ser boolean' },
        { status: 400 }
      );
    }
    if (body.inclusive !== undefined && typeof body.inclusive !== 'boolean') {
      return NextResponse.json(
        { error: 'inclusive debe ser boolean' },
        { status: 400 }
      );
    }

    const options: ProgressOptions = {
      direction: body.direction === 'unmark' ? 'unmark' : undefined,
      inclusive: body.inclusive === true,
      completeIfAll: body.completeIfAll === true,
    };

    const result = await prisma.$transaction((tx) =>
      setProgress(tx, authResult.userId, seriesId, target, options)
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ProgressNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error al actualizar el progreso:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el progreso' },
      { status: 500 }
    );
  }
}
