import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import { findOrCreateTag, findOrCreateGenre } from '@/lib/tag-utils';
import { Prisma } from '@/generated/prisma';

// GET - Listar series con sus tags y géneros con filtros de auditoría
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim().toLowerCase() || '';
    const filter = searchParams.get('filter') || 'all';
    const origin = searchParams.get('origin') || 'CURATED';
    const tagId = searchParams.get('tagId')
      ? parseInt(searchParams.get('tagId')!, 10)
      : null;
    const genreId = searchParams.get('genreId')
      ? parseInt(searchParams.get('genreId')!, 10)
      : null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(
      100,
      Math.max(10, parseInt(searchParams.get('pageSize') || '30', 10))
    );

    const where: Prisma.SeriesWhereInput = {};

    if (origin !== 'ALL') {
      where.origin = origin;
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { originalTitle: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (tagId && !isNaN(tagId)) {
      where.tags = { some: { tagId } };
    }

    if (genreId && !isNaN(genreId)) {
      where.genres = { some: { genreId } };
    }

    if (filter === 'missing_tags') {
      where.tags = { none: {} };
    } else if (filter === 'missing_genres') {
      where.genres = { none: {} };
    }

    // Para "few_tags" (< 3 tags) se evalúa post-consulta si se solicita,
    // o filtramos directamente todas las series y calculamos el total
    if (filter === 'few_tags') {
      // Obtenemos candidatos del scope actual
      const allCandidates = await prisma.series.findMany({
        where,
        select: {
          id: true,
          title: true,
          originalTitle: true,
          year: true,
          type: true,
          imageUrl: true,
          imageThumbUrl: true,
          origin: true,
          country: { select: { name: true } },
          tags: {
            select: {
              tag: { select: { id: true, name: true, category: true } },
            },
          },
          genres: { select: { genre: { select: { id: true, name: true } } } },
        },
        orderBy: { title: 'asc' },
      });

      const filtered = allCandidates.filter(
        (s) => s.tags.length > 0 && s.tags.length < 3
      );
      const total = filtered.length;
      const start = (page - 1) * pageSize;
      const paged = filtered.slice(start, start + pageSize);

      return NextResponse.json({
        series: paged.map((s) => ({
          id: s.id,
          title: s.title,
          originalTitle: s.originalTitle,
          year: s.year,
          type: s.type,
          imageUrl: s.imageUrl,
          imageThumbUrl: s.imageThumbUrl,
          origin: s.origin,
          countryName: s.country?.name ?? null,
          tags: s.tags.map((st) => st.tag),
          genres: s.genres.map((sg) => sg.genre),
        })),
        total,
        page,
        pageSize,
      });
    }

    const [series, total] = await Promise.all([
      prisma.series.findMany({
        where,
        select: {
          id: true,
          title: true,
          originalTitle: true,
          year: true,
          type: true,
          imageUrl: true,
          imageThumbUrl: true,
          origin: true,
          country: { select: { name: true } },
          tags: {
            select: {
              tag: { select: { id: true, name: true, category: true } },
            },
            orderBy: { tag: { name: 'asc' } },
          },
          genres: {
            select: {
              genre: { select: { id: true, name: true } },
            },
            orderBy: { genre: { name: 'asc' } },
          },
        },
        orderBy: [{ title: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.series.count({ where }),
    ]);

    return NextResponse.json({
      series: series.map((s) => ({
        id: s.id,
        title: s.title,
        originalTitle: s.originalTitle,
        year: s.year,
        type: s.type,
        imageUrl: s.imageUrl,
        imageThumbUrl: s.imageThumbUrl,
        origin: s.origin,
        countryName: s.country?.name ?? null,
        tags: s.tags.map((st) => st.tag),
        genres: s.genres.map((sg) => sg.genre),
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error al consultar series metadata:', error);
    return NextResponse.json(
      { error: 'Error al consultar series' },
      { status: 500 }
    );
  }
}

// PATCH - Actualización rápida e inline de tags y géneros de una serie específica
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const seriesId =
      typeof body.seriesId === 'number'
        ? body.seriesId
        : parseInt(body.seriesId, 10);

    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'seriesId inválido' }, { status: 400 });
    }

    const seriesExists = await prisma.series.findUnique({
      where: { id: seriesId },
      select: { id: true },
    });

    if (!seriesExists) {
      return NextResponse.json(
        { error: 'Serie no encontrada' },
        { status: 404 }
      );
    }

    const { tags, genres } = body;

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Actualizar tags si se proporcionaron
      if (Array.isArray(tags)) {
        const resolvedTags: Array<{ id: number; name: string }> = [];
        for (const rawTag of tags) {
          if (typeof rawTag === 'string' && rawTag.trim()) {
            const tagRecord = await findOrCreateTag(tx, rawTag.trim(), 'trope');
            if (tagRecord) resolvedTags.push(tagRecord);
          }
        }

        const newTagIds = new Set(resolvedTags.map((t) => t.id));
        const currentSeriesTags = await tx.seriesTag.findMany({
          where: { seriesId },
          select: { tagId: true },
        });
        const currentTagIds = new Set(currentSeriesTags.map((st) => st.tagId));

        // Eliminar los que ya no están
        const toRemove = Array.from(currentTagIds).filter(
          (id) => !newTagIds.has(id)
        );
        if (toRemove.length > 0) {
          await tx.seriesTag.deleteMany({
            where: { seriesId, tagId: { in: toRemove } },
          });
        }

        // Agregar los nuevos
        const toAdd = Array.from(newTagIds).filter(
          (id) => !currentTagIds.has(id)
        );
        if (toAdd.length > 0) {
          await tx.seriesTag.createMany({
            data: toAdd.map((tagId) => ({ seriesId, tagId })),
            skipDuplicates: true,
          });
        }
      }

      // 2. Actualizar géneros si se proporcionaron
      if (Array.isArray(genres)) {
        const resolvedGenres: Array<{ id: number; name: string }> = [];
        for (const rawGenre of genres) {
          if (typeof rawGenre === 'string' && rawGenre.trim()) {
            const genreRecord = await findOrCreateGenre(tx, rawGenre.trim());
            if (genreRecord) resolvedGenres.push(genreRecord);
          }
        }

        const newGenreIds = new Set(resolvedGenres.map((g) => g.id));
        const currentSeriesGenres = await tx.seriesGenre.findMany({
          where: { seriesId },
          select: { genreId: true },
        });
        const currentGenreIds = new Set(
          currentSeriesGenres.map((sg) => sg.genreId)
        );

        // Eliminar los que ya no están
        const toRemove = Array.from(currentGenreIds).filter(
          (id) => !newGenreIds.has(id)
        );
        if (toRemove.length > 0) {
          await tx.seriesGenre.deleteMany({
            where: { seriesId, genreId: { in: toRemove } },
          });
        }

        // Agregar los nuevos
        const toAdd = Array.from(newGenreIds).filter(
          (id) => !currentGenreIds.has(id)
        );
        if (toAdd.length > 0) {
          await tx.seriesGenre.createMany({
            data: toAdd.map((genreId) => ({ seriesId, genreId })),
            skipDuplicates: true,
          });
        }
      }

      // Retornar la serie con sus tags y géneros actualizados
      return tx.series.findUnique({
        where: { id: seriesId },
        select: {
          id: true,
          tags: {
            select: {
              tag: { select: { id: true, name: true, category: true } },
            },
            orderBy: { tag: { name: 'asc' } },
          },
          genres: {
            select: { genre: { select: { id: true, name: true } } },
            orderBy: { genre: { name: 'asc' } },
          },
        },
      });
    });

    // Revalidar cachés de Next.js
    revalidatePath('/catalogo');
    revalidatePath(`/series/${seriesId}`);
    revalidatePath('/admin/tags');

    return NextResponse.json({
      id: updated?.id,
      tags: updated?.tags.map((t) => t.tag) ?? [],
      genres: updated?.genres.map((g) => g.genre) ?? [],
    });
  } catch (error) {
    console.error('Error al actualizar metadatos de serie:', error);
    return NextResponse.json(
      { error: 'Error al actualizar metadatos' },
      { status: 500 }
    );
  }
}

// POST - Operaciones masivas en lote (Bulk Actions)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const { seriesIds, addTags, removeTags, addGenres, removeGenres } = body;

    if (!Array.isArray(seriesIds) || seriesIds.length === 0) {
      return NextResponse.json(
        { error: 'Debe especificar al menos una serie' },
        { status: 400 }
      );
    }

    const validSeriesIds = seriesIds
      .map((id: unknown) =>
        typeof id === 'number' ? id : parseInt(String(id), 10)
      )
      .filter((id: number) => !isNaN(id));

    if (validSeriesIds.length === 0) {
      return NextResponse.json(
        { error: 'IDs de series inválidos' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Agregar tags en lote
      if (Array.isArray(addTags) && addTags.length > 0) {
        const resolvedAddTags: number[] = [];
        for (const name of addTags) {
          if (typeof name === 'string' && name.trim()) {
            const t = await findOrCreateTag(tx, name.trim(), 'trope');
            if (t) resolvedAddTags.push(t.id);
          }
        }

        if (resolvedAddTags.length > 0) {
          const bulkTagData = validSeriesIds.flatMap((seriesId) =>
            resolvedAddTags.map((tagId) => ({ seriesId, tagId }))
          );
          await tx.seriesTag.createMany({
            data: bulkTagData,
            skipDuplicates: true,
          });
        }
      }

      // 2. Quitar tags en lote
      if (Array.isArray(removeTags) && removeTags.length > 0) {
        const tagRecords = await tx.tag.findMany({
          where: {
            name: {
              in: removeTags.filter(
                (t): t is string => typeof t === 'string' && !!t.trim()
              ),
            },
          },
          select: { id: true },
        });
        const removeTagIds = tagRecords.map((t) => t.id);

        if (removeTagIds.length > 0) {
          await tx.seriesTag.deleteMany({
            where: {
              seriesId: { in: validSeriesIds },
              tagId: { in: removeTagIds },
            },
          });
        }
      }

      // 3. Agregar géneros en lote
      if (Array.isArray(addGenres) && addGenres.length > 0) {
        const resolvedAddGenres: number[] = [];
        for (const name of addGenres) {
          if (typeof name === 'string' && name.trim()) {
            const g = await findOrCreateGenre(tx, name.trim());
            if (g) resolvedAddGenres.push(g.id);
          }
        }

        if (resolvedAddGenres.length > 0) {
          const bulkGenreData = validSeriesIds.flatMap((seriesId) =>
            resolvedAddGenres.map((genreId) => ({ seriesId, genreId }))
          );
          await tx.seriesGenre.createMany({
            data: bulkGenreData,
            skipDuplicates: true,
          });
        }
      }

      // 4. Quitar géneros en lote
      if (Array.isArray(removeGenres) && removeGenres.length > 0) {
        const genreRecords = await tx.genre.findMany({
          where: {
            name: {
              in: removeGenres.filter(
                (g): g is string => typeof g === 'string' && !!g.trim()
              ),
            },
          },
          select: { id: true },
        });
        const removeGenreIds = genreRecords.map((g) => g.id);

        if (removeGenreIds.length > 0) {
          await tx.seriesGenre.deleteMany({
            where: {
              seriesId: { in: validSeriesIds },
              genreId: { in: removeGenreIds },
            },
          });
        }
      }
    });

    revalidatePath('/catalogo');
    revalidatePath('/admin/tags');

    return NextResponse.json({
      success: true,
      updatedCount: validSeriesIds.length,
    });
  } catch (error) {
    console.error('Error en operación masiva de metadatos:', error);
    return NextResponse.json(
      { error: 'Error al aplicar cambios en lote' },
      { status: 500 }
    );
  }
}
