import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// GET /api/series - Obtener todas las series
export async function GET() {
  try {
    const series = await prisma.series.findMany({
      include: {
        country: true,
        universe: true,
        seasons: {
          select: {
            id: true,
            seasonNumber: true,
            episodeCount: true,
          },
        },
        viewStatus: true,
      },
      orderBy: {
        title: 'asc',
      },
    });

    return NextResponse.json(series);
  } catch (error) {
    console.error('Error fetching series:', error);
    return NextResponse.json(
      { error: 'Failed to fetch series' },
      { status: 500 }
    );
  }
}

// POST /api/series - Crear nueva serie
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      originalTitle,
      year,
      type,
      basedOn,
      format,
      synopsis,
      soundtrack,
      overallRating,
      observations,
      countryName,
      universeId,
      actors,
      directors,
      seasons,
      tags,
      productionCompanyId,
      originalLanguageId,
      dubbingIds,
    } = body;

    // Crear o encontrar país
    let countryId = null;
    if (countryName) {
      const country = await prisma.country.upsert({
        where: { name: countryName },
        update: {},
        create: { name: countryName },
      });
      countryId = country.id;
    }

    // Crear la serie
    const serie = await prisma.series.create({
      data: {
        title,
        originalTitle,
        year,
        type,
        basedOn,
        format: format || 'regular',
        synopsis,
        soundtrack,
        overallRating,
        observations,
        countryId,
        universeId,
        productionCompanyId: productionCompanyId || null,
        originalLanguageId: originalLanguageId || null,
      },
    });

    // Crear actores y vincularlos
    if (actors && actors.length > 0) {
      for (const actorData of actors) {
        if (!actorData.name) continue;

        const actor = await prisma.actor.upsert({
          where: { name: actorData.name },
          update: {},
          create: { name: actorData.name },
        });

        await prisma.seriesActor.create({
          data: {
            seriesId: serie.id,
            actorId: actor.id,
            character: actorData.character || '',
            isMain: actorData.isMain || false,
          },
        });
      }
    }

    // Crear directores y vincularlos
    if (directors && directors.length > 0) {
      for (const directorData of directors) {
        if (!directorData.name) continue;

        const director = await prisma.director.upsert({
          where: { name: directorData.name },
          update: {},
          create: { name: directorData.name },
        });

        await prisma.seriesDirector.create({
          data: {
            seriesId: serie.id,
            directorId: director.id,
          },
        });
      }
    }

    // Crear doblajes
    if (dubbingIds && dubbingIds.length > 0) {
      for (const languageId of dubbingIds) {
        await prisma.seriesDubbing.create({
          data: { seriesId: serie.id, languageId },
        });
      }
    }

    // Crear temporadas (si es serie)
    if (seasons && seasons.length > 0 && type === 'serie') {
      for (const seasonData of seasons) {
        await prisma.season.create({
          data: {
            seriesId: serie.id,
            seasonNumber: seasonData.seasonNumber,
            episodeCount: seasonData.episodeCount,
            year: seasonData.year || year,
          },
        });
      }
    }

    // Crear tags y vincularlos
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        if (!tagName) continue;

        // Crear o encontrar el tag
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName, category: 'trope' },
        });

        // Vincular tag a la serie
        await prisma.seriesTag.create({
          data: {
            seriesId: serie.id,
            tagId: tag.id,
          },
        });
      }
    }

    return NextResponse.json(serie, { status: 201 });
  } catch (error) {
    console.error('Error creating series:', error);
    return NextResponse.json(
      { error: 'Failed to create series' },
      { status: 500 }
    );
  }
}
