import { NextRequest, NextResponse, after } from 'next/server';
import {
  revalidateRelatedSeries,
  revalidateSeries,
  revalidateUniverse,
} from '@/lib/revalidate-series';
import { dedupeActorRows, type ActorRow } from '@/lib/series-relations';
import {
  prisma,
  saveSeriesInUniverse,
  resolveBasedOnValue,
} from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import { extractVideoId, type Platform } from '@/lib/embed-helpers';
import { getCountryCode } from '@/lib/country-codes';
import { downloadAndUploadExternalImage } from '@/lib/supabase';
import {
  findOrCreateTag,
  findOrCreateGenre,
  findOrCreateActor,
  findOrCreateDirector,
  findOrCreateProductionCompany,
} from '@/lib/tag-utils';

// GET /api/series - Picker de series para el admin (ver ContenidoClient.tsx,
// unico consumidor: arma un <Select> de {value: id, label: title}).
//
// Antes devolvia la tabla ENTERA sin auth ni select: country/universe/
// seasons completos + `viewStatus: true` — el estado de visualizacion de
// TODOS los usuarios, en un endpoint que cualquiera podia pegarle sin
// sesion. Ahora exige ADMIN/MODERATOR (como el POST de abajo) y selecciona
// solo lo que el picker usa.
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const title = request.nextUrl.searchParams.get('title')?.trim();
    const series = await prisma.series.findMany({
      where: {
        origin: 'CURATED',
        ...(title
          ? { title: { equals: title, mode: 'insensitive' as const } }
          : {}),
      },
      select: { id: true, title: true, catalogScope: true },
      orderBy: { title: 'asc' },
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
      featured,
      featuredOrder,
      countryName,
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
      infoBlocks,
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
        select: { id: true, title: true, catalogScope: true },
      });
      if (existing) {
        return NextResponse.json(
          {
            error: `Ya existe una serie "${existing.title}" en el catálogo`,
            existingSeriesId: existing.id,
            code: 'SERIES_EXISTS',
            existingSeries: existing,
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
        ? findOrCreateProductionCompany(prisma, productionCompanyName)
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
    // Si el poster se subio via el uploader (/api/upload), el form ya manda
    // la miniatura junto con la URL — no hace falta esperar al after().
    // Si el admin pego una URL externa a mano, esto viene vacio y lo llena
    // el after() de abajo cuando la migracion termine.
    const clientThumbUrl =
      typeof body.imageThumbUrl === 'string' && body.imageThumbUrl.trim()
        ? body.imageThumbUrl.trim()
        : null;

    // Crear la serie
    const targetUniverseId = body.universeId ? Number(body.universeId) : null;
    if (
      targetUniverseId !== null &&
      (!Number.isInteger(targetUniverseId) || targetUniverseId < 1)
    ) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    const isUniverseMain =
      targetUniverseId !== null && body.isUniverseMain === true;
    if (
      basedOn !== undefined &&
      basedOn !== null &&
      typeof basedOn !== 'string'
    )
      return NextResponse.json({ error: 'Invalid basedOn' }, { status: 400 });
    const normalizedBasedOn = await resolveBasedOnValue(basedOn);
    const serie = await saveSeriesInUniverse(
      targetUniverseId,
      isUniverseMain,
      (transaction) =>
        transaction.series.create({
          data: {
            isUniverseMain,
            title,
            originalTitle,
            year,
            type,
            // Solo para tipos de una sola pieza (pelicula, corto). El form ya
            // manda null cuando el tipo no la lleva; aca se normaliza el
            // string vacio o el undefined del payload.
            durationMinutes:
              body.durationMinutes === null ||
              body.durationMinutes === undefined
                ? null
                : Number(body.durationMinutes) || null,
            basedOn: normalizedBasedOn,
            format: format || 'regular',
            imageUrl: externalImageUrl,
            imageThumbUrl: clientThumbUrl,
            imagePosition: body.imagePosition || 'center',
            synopsis,
            soundtrack,
            overallRating,
            observations,
            review: review ?? null,
            notesPrivate: notesPrivate === true,
            featured: featured === true,
            featuredOrder:
              typeof featuredOrder === 'number' ? featuredOrder : 0,
            airDays: body.airDays || null,
            catalogScope:
              body.catalogScope === 'WATCHABLE_ONLY'
                ? 'WATCHABLE_ONLY'
                : 'PERSONAL',
            countryId: resolvedCountryId,
            universeId: targetUniverseId,
            productionCompanyId: resolvedProductionCompanyId,
            originalLanguageId: resolvedOriginalLanguageId,
          },
        })
    );

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
        const rows: ActorRow[] = [];
        for (const actorData of actors) {
          const actor = await findOrCreateActor(prisma, actorData.name ?? '');
          if (!actor) continue;
          rows.push({
            actorId: actor.id,
            character: actorData.character || '',
            isMain: actorData.isMain || false,
            pairingGroup: actorData.pairingGroup ?? null,
          });
        }
        // Mismo actor y personaje dos veces (o dos grafias del mismo nombre)
        // violaban el unique y dejaban la serie creada a medias.
        const unique = dedupeActorRows(rows);
        if (unique.length === 0) return;
        await prisma.seriesActor.createMany({
          data: unique.map((row) => ({ ...row, seriesId: serie.id })),
        });
      })(),
      // Directores
      (async () => {
        if (!directors || directors.length === 0) return;
        const ids = new Set<number>();
        for (const directorData of directors) {
          if (!directorData.name) continue;
          const director = await findOrCreateDirector(
            prisma,
            directorData.name
          );
          if (director) ids.add(director.id);
        }
        await prisma.seriesDirector.createMany({
          data: [...ids].map((directorId) => ({
            seriesId: serie.id,
            directorId,
          })),
        });
      })(),
      // Doblajes
      (async () => {
        if (!dubbingIds || dubbingIds.length === 0) return;
        await prisma.seriesDubbing.createMany({
          data: [...new Set<number>(dubbingIds)].map((languageId) => ({
            seriesId: serie.id,
            languageId,
          })),
        });
      })(),
      // Temporadas (serie, especial, anime, reality, etc.)
      (async () => {
        if (!seasons || seasons.length === 0) return;
        for (const seasonData of seasons) {
          const createdSeason = await prisma.season.create({
            data: {
              seriesId: serie.id,
              seasonNumber: seasonData.seasonNumber || 1,
              episodeCount: seasonData.episodeCount
                ? Number(seasonData.episodeCount)
                : null,
              year: seasonData.year || year,
            },
          });

          // Auto-generación de capítulos si se especificó episodeCount
          const episodeCount = seasonData.episodeCount
            ? Number(seasonData.episodeCount)
            : 0;
          if (episodeCount > 0) {
            const episodesToCreate = [];
            for (let i = 1; i <= episodeCount; i++) {
              episodesToCreate.push({
                seasonId: createdSeason.id,
                episodeNumber: i,
              });
            }
            await prisma.episode.createMany({
              data: episodesToCreate,
            });
          }
        }
      })(),
      // Tags
      (async () => {
        if (!tags || tags.length === 0) return;
        const ids = new Set<number>();
        for (const tagName of tags) {
          const tag = await findOrCreateTag(prisma, tagName);
          if (tag) ids.add(tag.id);
        }
        await prisma.seriesTag.createMany({
          data: [...ids].map((tagId) => ({ seriesId: serie.id, tagId })),
        });
      })(),
      // Géneros
      (async () => {
        if (!genres || genres.length === 0) return;
        const ids = new Set<number>();
        for (const genreName of genres) {
          const genre = await findOrCreateGenre(prisma, genreName);
          if (genre) ids.add(genre.id);
        }
        await prisma.seriesGenre.createMany({
          data: [...ids].map((genreId) => ({ seriesId: serie.id, genreId })),
        });
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
      // Bloques de informacion adicional (creados en el flujo de alta)
      (async () => {
        if (!infoBlocks || infoBlocks.length === 0) return;
        for (let i = 0; i < infoBlocks.length; i++) {
          const block = infoBlocks[i];
          if (!block?.label?.trim() || !block?.body?.trim()) continue;
          await prisma.seriesInfoBlock.create({
            data: {
              seriesId: serie.id,
              label: block.label.trim(),
              body: block.body.trim(),
              sortOrder: i,
            },
          });
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
          const updateData: { imageUrl?: string; imageThumbUrl?: string } = {};
          if (migrated.url !== externalImageUrl) {
            updateData.imageUrl = migrated.url;
          }
          // Solo pisa el thumb si esta llamada genero uno de verdad (URL
          // externa real). Si ya era de Supabase (subida via /api/upload,
          // clientThumbUrl ya seteado arriba), `migrated.thumbUrl` es null y
          // no tocamos nada.
          if (migrated.thumbUrl) {
            updateData.imageThumbUrl = migrated.thumbUrl;
          }
          if (Object.keys(updateData).length > 0) {
            await prisma.series.update({
              where: { id: serie.id },
              data: updateData,
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

    // Invalidar caches de las vistas que listan series y la ficha creada.
    revalidateSeries(serie);

    if (serie.universeId) {
      await revalidateUniverse(serie.universeId);
    }

    if (
      Array.isArray(body.relatedSeriesIds) &&
      body.relatedSeriesIds.length > 0
    ) {
      await revalidateRelatedSeries(
        body.relatedSeriesIds.map(Number).filter(Number.isInteger)
      );
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
