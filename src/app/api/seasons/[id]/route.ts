import { revalidateSeries } from '@/lib/revalidate-series';
import { TrackingPreservationError } from '@/lib/tracking-preservation';
import { deleteUntrackedContent } from '@/lib/database';
import { trackingPreservationResponse } from '@/lib/tracking-preservation-response';
import { checkSeriesContentAccess } from '@/lib/content-access';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import { findOrCreateActor } from '@/lib/tag-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const seasonId = parseInt(resolvedParams.id, 10);

    if (isNaN(seasonId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        series: { select: { id: true, title: true } },
        actors: {
          include: {
            actor: true,
          },
        },
        episodes: true,
        ratings: true,
        comments: true,
      },
    });

    if (!season) {
      return NextResponse.json(
        { error: 'Temporada no encontrada' },
        { status: 404 }
      );
    }

    const blocked = await checkSeriesContentAccess(season.seriesId);
    if (blocked) return blocked;
    return NextResponse.json(season, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Error fetching season:', error);
    return NextResponse.json(
      { error: 'Error al obtener temporada' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const resolvedParams = await params;
    const seasonId = parseInt(resolvedParams.id, 10);

    if (isNaN(seasonId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { actors, ...seasonData } = body;

    const newImageUrl = seasonData.imageUrl || null;
    // Mismo criterio que /api/series/[id]: sin poster no hay thumb; con
    // poster, solo lo pisamos si el form mando uno nuevo (subida via
    // /api/upload) — si no, se omite del update y el existente sobrevive.
    const newThumbUrl =
      typeof seasonData.imageThumbUrl === 'string' &&
      seasonData.imageThumbUrl.trim()
        ? seasonData.imageThumbUrl.trim()
        : undefined;

    // Actualizar temporada
    await prisma.season.update({
      where: { id: seasonId },
      data: {
        seasonNumber: seasonData.seasonNumber,
        title: seasonData.title || null,
        episodeCount: seasonData.episodeCount || null,
        year: seasonData.year || null,
        synopsis: seasonData.synopsis || null,
        observations: seasonData.observations || null,
        imageUrl: newImageUrl,
        imageThumbUrl: newImageUrl ? newThumbUrl : null,
      },
    });

    // Actualizar actores de la temporada
    if (actors && Array.isArray(actors)) {
      // Eliminar actores existentes
      await prisma.seasonActor.deleteMany({
        where: { seasonId },
      });

      // Crear o conectar nuevos actores
      for (const actorData of actors) {
        const actor = await findOrCreateActor(prisma, actorData.name ?? '');
        if (!actor) continue;

        // Crear relación SeasonActor
        await prisma.seasonActor.create({
          data: {
            seasonId,
            actorId: actor.id,
            character: actorData.character || null,
            isMain: actorData.isMain || false,
          },
        });
      }
    }

    // Obtener temporada actualizada con relaciones
    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        actors: {
          include: {
            actor: true,
          },
        },
      },
    });

    return NextResponse.json(season);
  } catch (error) {
    console.error('Error updating season:', error);
    return NextResponse.json(
      { error: 'Error al actualizar temporada' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const resolvedParams = await params;
    const seasonId = parseInt(resolvedParams.id, 10);

    if (isNaN(seasonId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const changedSeries = await deleteUntrackedContent({ seasonId: seasonId });
    revalidateSeries(changedSeries);

    return NextResponse.json({ message: 'Temporada eliminada' });
  } catch (error) {
    if (error instanceof TrackingPreservationError)
      return trackingPreservationResponse();
    console.error('Error deleting season:', error);
    return NextResponse.json(
      { error: 'Error al eliminar temporada' },
      { status: 500 }
    );
  }
}
