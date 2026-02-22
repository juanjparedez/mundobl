import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import { extractVideoId, type Platform } from '@/lib/embed-helpers';
import { getCountryCode } from '@/lib/country-codes';
import { downloadAndUploadExternalImage } from '@/lib/supabase';

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

// POST /api/series - Crear nueva serie (Admin + Moderator)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

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
      genres,
      productionCompanyName,
      originalLanguageName,
      productionCompanyId,
      originalLanguageId,
      dubbingIds,
      contentItems,
    } = body;

    // Crear o encontrar país (con código ISO automático)
    let resolvedCountryId = null;
    if (countryName) {
      const code = getCountryCode(countryName);
      const country = await prisma.country.upsert({
        where: { name: countryName },
        update: code ? { code } : {},
        create: { name: countryName, ...(code ? { code } : {}) },
      });
      resolvedCountryId = country.id;
    }

    // Crear o encontrar productora
    let resolvedProductionCompanyId = productionCompanyId || null;
    if (productionCompanyName && !resolvedProductionCompanyId) {
      const company = await prisma.productionCompany.upsert({
        where: { name: productionCompanyName },
        update: {},
        create: { name: productionCompanyName },
      });
      resolvedProductionCompanyId = company.id;
    }

    // Crear o encontrar idioma original
    let resolvedOriginalLanguageId = originalLanguageId || null;
    if (originalLanguageName && !resolvedOriginalLanguageId) {
      const language = await prisma.language.upsert({
        where: { name: originalLanguageName },
        update: {},
        create: { name: originalLanguageName },
      });
      resolvedOriginalLanguageId = language.id;
    }

    // Procesar imagen externa → subir a Supabase si es URL externa
    let resolvedImageUrl = body.imageUrl || null;
    if (resolvedImageUrl) {
      try {
        resolvedImageUrl = await downloadAndUploadExternalImage(
          resolvedImageUrl,
          'series'
        );
      } catch (error) {
        console.warn(
          `No se pudo migrar imagen a Supabase, manteniendo URL original:`,
          error
        );
      }
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
        imageUrl: resolvedImageUrl,
        imagePosition: body.imagePosition || 'center',
        synopsis,
        soundtrack,
        overallRating,
        observations,
        countryId: resolvedCountryId,
        universeId,
        productionCompanyId: resolvedProductionCompanyId,
        originalLanguageId: resolvedOriginalLanguageId,
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
            pairingGroup: actorData.pairingGroup ?? null,
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

        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName, category: 'trope' },
        });

        await prisma.seriesTag.create({
          data: {
            seriesId: serie.id,
            tagId: tag.id,
          },
        });
      }
    }

    // Crear géneros y vincularlos
    if (genres && genres.length > 0) {
      for (const genreName of genres) {
        if (!genreName) continue;

        const genre = await prisma.genre.upsert({
          where: { name: genreName },
          update: {},
          create: { name: genreName },
        });

        await prisma.seriesGenre.create({
          data: {
            seriesId: serie.id,
            genreId: genre.id,
          },
        });
      }
    }

    // Crear watch links
    if (body.watchLinks && body.watchLinks.length > 0) {
      for (const link of body.watchLinks) {
        if (!link.platform || !link.url) continue;

        await prisma.watchLink.create({
          data: {
            seriesId: serie.id,
            platform: link.platform,
            url: link.url,
            official: link.official ?? true,
          },
        });
      }
    }

    // Crear series relacionadas (bidireccional)
    if (body.relatedSeriesIds && body.relatedSeriesIds.length > 0) {
      for (const relatedId of body.relatedSeriesIds) {
        if (!relatedId || relatedId === serie.id) continue;
        await prisma.relatedSeries.createMany({
          data: [
            { mainSeriesId: serie.id, relatedSeriesId: relatedId },
            { mainSeriesId: relatedId, relatedSeriesId: serie.id },
          ],
          skipDuplicates: true,
        });
      }
    }

    // Crear contenido audiovisual asociado
    if (contentItems && contentItems.length > 0) {
      for (const item of contentItems) {
        if (!item.title?.trim() || !item.url?.trim() || !item.platform)
          continue;

        const videoId = extractVideoId(
          item.platform as Platform,
          item.url.trim()
        );

        await prisma.embeddableContent.create({
          data: {
            seriesId: serie.id,
            title: item.title.trim(),
            description: item.description?.trim() || null,
            platform: item.platform,
            url: item.url.trim(),
            videoId: videoId || null,
            category: item.category || 'other',
            thumbnailUrl: item.thumbnailUrl?.trim() || null,
            channelName: item.channelName?.trim() || null,
            official: item.official ?? true,
            sortOrder: item.sortOrder ?? 0,
            featured: item.featured ?? false,
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
