import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Obtener una serie por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const serieId = parseInt(id, 10);

    if (isNaN(serieId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const serie = await prisma.series.findUnique({
      where: { id: serieId },
      include: {
        country: true,
        universe: true,
        seasons: true,
        actors: {
          include: {
            actor: true,
          },
        },
        directors: {
          include: {
            director: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        productionCompany: true,
        originalLanguage: true,
        dubbings: {
          include: {
            language: true,
          },
        },
      },
    });

    if (!serie) {
      return NextResponse.json(
        { error: 'Serie no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(serie);
  } catch (error) {
    console.error('Error al obtener serie:', error);
    return NextResponse.json(
      { error: 'Error al obtener la serie' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una serie
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const serieId = parseInt(id, 10);

    if (isNaN(serieId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();

    // Validación básica
    if (!body.title) {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      );
    }

    // Manejar país
    let countryId = body.countryId ? parseInt(body.countryId, 10) : null;
    if (body.countryName && !countryId) {
      const country = await prisma.country.upsert({
        where: { name: body.countryName },
        update: {},
        create: { name: body.countryName },
      });
      countryId = country.id;
    }

    // Actualizar la serie
    const updatedSerie = await prisma.series.update({
      where: { id: serieId },
      data: {
        title: body.title,
        originalTitle: body.originalTitle || null,
        year: body.year ? parseInt(body.year, 10) : null,
        type: body.type || 'serie',
        basedOn: body.basedOn || null,
        format: body.format || 'regular',
        imageUrl: body.imageUrl || null,
        synopsis: body.synopsis || null,
        review: body.review || null,
        soundtrack: body.soundtrack || null,
        overallRating: body.overallRating
          ? parseInt(body.overallRating, 10)
          : null,
        observations: body.observations || null,
        countryId,
        universeId: body.universeId ? parseInt(body.universeId, 10) : null,
        productionCompanyId: body.productionCompanyId || null,
        originalLanguageId: body.originalLanguageId || null,
      },
    });

    // Actualizar actores (eliminar y volver a crear)
    if (body.actors) {
      await prisma.seriesActor.deleteMany({
        where: { seriesId: serieId },
      });

      for (const actorData of body.actors) {
        if (!actorData.name) continue;

        const actor = await prisma.actor.upsert({
          where: { name: actorData.name },
          update: {},
          create: { name: actorData.name },
        });

        await prisma.seriesActor.create({
          data: {
            seriesId: serieId,
            actorId: actor.id,
            character: actorData.character || '',
            isMain: actorData.isMain || false,
          },
        });
      }
    }

    // Actualizar directores (eliminar y volver a crear)
    if (body.directors) {
      await prisma.seriesDirector.deleteMany({
        where: { seriesId: serieId },
      });

      for (const directorData of body.directors) {
        if (!directorData.name) continue;

        const director = await prisma.director.upsert({
          where: { name: directorData.name },
          update: {},
          create: { name: directorData.name },
        });

        await prisma.seriesDirector.create({
          data: {
            seriesId: serieId,
            directorId: director.id,
          },
        });
      }
    }

    // Actualizar doblajes
    if (body.dubbingIds !== undefined) {
      await prisma.seriesDubbing.deleteMany({
        where: { seriesId: serieId },
      });

      if (body.dubbingIds && body.dubbingIds.length > 0) {
        for (const languageId of body.dubbingIds) {
          await prisma.seriesDubbing.create({
            data: { seriesId: serieId, languageId },
          });
        }
      }
    }

    // Actualizar temporadas (solo para series)
    if (body.type === 'serie' && body.seasons) {
      await prisma.season.deleteMany({
        where: { seriesId: serieId },
      });

      for (const seasonData of body.seasons) {
        await prisma.season.create({
          data: {
            seriesId: serieId,
            seasonNumber: seasonData.seasonNumber,
            episodeCount: seasonData.episodeCount,
            year: seasonData.year || body.year,
          },
        });
      }
    }

    // Actualizar tags (eliminar y volver a crear)
    if (body.tags !== undefined) {
      await prisma.seriesTag.deleteMany({
        where: { seriesId: serieId },
      });

      if (body.tags && body.tags.length > 0) {
        for (const tagName of body.tags) {
          if (!tagName) continue;

          const tag = await prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName, category: 'trope' },
          });

          await prisma.seriesTag.create({
            data: {
              seriesId: serieId,
              tagId: tag.id,
            },
          });
        }
      }
    }

    return NextResponse.json(updatedSerie);
  } catch (error) {
    console.error('Error al actualizar serie:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la serie' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una serie
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const serieId = parseInt(id, 10);

    if (isNaN(serieId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verificar que la serie existe
    const serie = await prisma.series.findUnique({
      where: { id: serieId },
    });

    if (!serie) {
      return NextResponse.json(
        { error: 'Serie no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar la serie (cascade eliminará relaciones)
    await prisma.series.delete({
      where: { id: serieId },
    });

    return NextResponse.json({ message: 'Serie eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar serie:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la serie' },
      { status: 500 }
    );
  }
}
