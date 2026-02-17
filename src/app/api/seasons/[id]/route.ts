import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

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
        series: true,
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

    return NextResponse.json(season);
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
        imageUrl: seasonData.imageUrl || null,
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
        if (!actorData.name || actorData.name.trim() === '') continue;

        // Buscar o crear actor
        const actor = await prisma.actor.upsert({
          where: { name: actorData.name.trim() },
          update: {},
          create: { name: actorData.name.trim() },
        });

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

    await prisma.season.delete({
      where: { id: seasonId },
    });

    return NextResponse.json({ message: 'Temporada eliminada' });
  } catch (error) {
    console.error('Error deleting season:', error);
    return NextResponse.json(
      { error: 'Error al eliminar temporada' },
      { status: 500 }
    );
  }
}
