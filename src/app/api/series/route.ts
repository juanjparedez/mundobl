import { NextRequest, NextResponse, after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import { extractVideoId, type Platform } from '@/lib/embed-helpers';
import { getCountryCode } from '@/lib/country-codes';
import { downloadAndUploadExternalImage } from '@/lib/supabase';

// GET /api/series - Obtener todas las series del catalogo curado (excluye USER_EMBED)
export async function GET() {
  try {
    const series = await prisma.series.findMany({
      where: { origin: 'CURATED' },
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
      review,
      notesPrivate,
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

    // Dedupe por título dentro del catálogo curado: sin unique constraint, dos
    // altas del mismo título creaban filas gemelas (que luego "no se borran":
    // se elimina una y queda la otra). Rechazar en vez de duplicar.
    if (title && typeof title === 'string' && title.trim()) {
      const existing = await prisma.series.findFirst({
        where: {
          origin: 'CURATED',
          title: { equals: title.trim(), mode: 'insensitive' },
        },
        select: { id: true, title: true },
      });
      if (existing) {
        return NextResponse.json(
          {
            error: `Ya existe una serie "${existing.title}" en el catálogo`,
            existingSeriesId: existing.id,
          },
          { status: 409 }
        );
      }
    }

    // País / productora / idioma son independientes entre sí: resolverlos
    // en paralelo (antes eran 3 round-trips secuenciales a la DB remota).
    const countryCode = countryName ? getCountryCode(countryName) : null;
    const needCompany = !!productionCompanyName && !productionCompanyId;
    const needLanguage = !!originalLanguageName && !originalLanguageId;
    const [countryRow, companyRow, languageRow] = await Promise.all([
      countryName
        ? prisma.country.upsert({
            where: { name: countryName },
            update: countryCode ? { code: countryCode } : {},
            create: {
              name: countryName,
              ...(countryCode ? { code: countryCode } : {}),
            },
          })
        : Promise.resolve(null),
      needCompany
        ? prisma.productionCompany.upsert({
            where: { name: productionCompanyName },
            update: {},
            create: { name: productionCompanyName },
          })
        : Promise.resolve(null),
      needLanguage
        ? prisma.language.upsert({
            where: { name: originalLanguageName },
            update: {},
            create: { name: originalLanguageName },
          })
        : Promise.resolve(null),
    ]);
    const resolvedCountryId = countryRow?.id ?? null;
    const resolvedProductionCompanyId =
      productionCompanyId || companyRow?.id || null;
    const resolvedOriginalLanguageId =
      originalLanguageId || languageRow?.id || null;

    // La serie se crea con la URL de imagen externa tal cual. La migración
    // a Supabase (fetch + sharp + upload, varios segundos en el peor caso)
    // se difiere a after() para NO bloquear el response del alta.
    const externalImageUrl = body.imageUrl || null;

    // Crear la serie
    const serie = await prisma.series.create({
      data: {
        title,
        originalTitle,
        year,
        type,
        basedOn,
        format: format || 'regular',
        imageUrl: externalImageUrl,
        imagePosition: body.imagePosition || 'center',
        synopsis,
        soundtrack,
        overallRating,
        observations,
        review: review ?? null,
        notesPrivate: notesPrivate === true,
        catalogScope:
          body.catalogScope === 'WATCHABLE_ONLY'
            ? 'WATCHABLE_ONLY'
            : 'PERSONAL',
        countryId: resolvedCountryId,
        universeId,
        productionCompanyId: resolvedProductionCompanyId,
        originalLanguageId: resolvedOriginalLanguageId,
      },
    });

    // Las entidades hijas solo dependen de serie.id y son independientes
    // entre sí (tablas distintas). Antes se creaban en ~9 cascadas
    // secuenciales (N+1 round-trips a la DB remota = el cuello de botella
    // del alta). Ahora los 9 grupos corren en paralelo; dentro de cada
    // grupo se mantiene el orden original (upsert→link) para no provocar
    // carreras de unique constraint sobre el mismo nombre.
    await Promise.all([
      // Actores
      (async () => {
        if (!actors || actors.length === 0) return;
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
      })(),
      // Directores
      (async () => {
        if (!directors || directors.length === 0) return;
        for (const directorData of directors) {
          if (!directorData.name) continue;
          const director = await prisma.director.upsert({
            where: { name: directorData.name },
            update: {},
            create: { name: directorData.name },
          });
          await prisma.seriesDirector.create({
            data: { seriesId: serie.id, directorId: director.id },
          });
        }
      })(),
      // Doblajes
      (async () => {
        if (!dubbingIds || dubbingIds.length === 0) return;
        for (const languageId of dubbingIds) {
          await prisma.seriesDubbing.create({
            data: { seriesId: serie.id, languageId },
          });
        }
      })(),
      // Temporadas (si es serie)
      (async () => {
        if (!seasons || seasons.length === 0 || type !== 'serie') return;
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
      })(),
      // Tags
      (async () => {
        if (!tags || tags.length === 0) return;
        for (const tagName of tags) {
          if (!tagName) continue;
          const tag = await prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName, category: 'trope' },
          });
          await prisma.seriesTag.create({
            data: { seriesId: serie.id, tagId: tag.id },
          });
        }
      })(),
      // Géneros
      (async () => {
        if (!genres || genres.length === 0) return;
        for (const genreName of genres) {
          if (!genreName) continue;
          const genre = await prisma.genre.upsert({
            where: { name: genreName },
            update: {},
            create: { name: genreName },
          });
          await prisma.seriesGenre.create({
            data: { seriesId: serie.id, genreId: genre.id },
          });
        }
      })(),
      // Watch links
      (async () => {
        if (!body.watchLinks || body.watchLinks.length === 0) return;
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
      })(),
      // Series relacionadas (bidireccional)
      (async () => {
        if (!body.relatedSeriesIds || body.relatedSeriesIds.length === 0)
          return;
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
      })(),
      // Contenido audiovisual asociado
      (async () => {
        if (!contentItems || contentItems.length === 0) return;
        for (const item of contentItems) {
          if (!item.title?.trim() || !item.url?.trim() || !item.platform) {
            console.warn('Skipping content item with missing data:', item);
            continue;
          }
          const videoId = extractVideoId(
            item.platform as Platform,
            item.url.trim()
          );
          try {
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
          } catch (contentError) {
            console.error(
              `Failed to create content "${item.title}":`,
              contentError
            );
          }
        }
      })(),
    ]);

    // Migración de imagen diferida: no bloquea el response. Si falla, la
    // serie queda con la URL externa original (mismo fallback que antes).
    if (externalImageUrl) {
      after(async () => {
        try {
          const migrated = await downloadAndUploadExternalImage(
            externalImageUrl,
            'series'
          );
          if (migrated && migrated !== externalImageUrl) {
            await prisma.series.update({
              where: { id: serie.id },
              data: { imageUrl: migrated },
            });
          }
        } catch (error) {
          console.warn(
            'No se pudo migrar imagen a Supabase, queda URL original:',
            error
          );
        }
      });
    }

    // Invalidar caches de las vistas que listan series (el listado admin es
    // dynamic pero el Router Cache del cliente sirve la lista vieja al volver
    // por navegación soft → la serie nueva "no aparece" hasta un hard reload).
    revalidatePath('/admin/series');
    revalidatePath('/catalogo');
    revalidatePath('/ver');

    return NextResponse.json(serie, { status: 201 });
  } catch (error) {
    console.error('Error creating series:', error);
    return NextResponse.json(
      { error: 'Failed to create series' },
      { status: 500 }
    );
  }
}
