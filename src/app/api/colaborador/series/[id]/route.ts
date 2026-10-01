import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { revalidateSeriesDetail } from '@/lib/revalidate-series';
import { prisma, getContributionMetadata } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import { assertSeriesOwnership } from '@/lib/collaborator-guard';
import { contributionMetadataFailure } from '@/lib/contribution-metadata';
import { loadSeriesForSave, recordSeriesRevision } from '@/lib/series-save';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ALLOWED_TYPES = new Set(['serie', 'pelicula', 'corto', 'especial']);

interface PatchBody {
  title?: string;
  originalTitle?: string | null;
  year?: number | null;
  type?: string;
  synopsis?: string | null;
  imageUrl?: string | null;
  imageThumbUrl?: string | null;
  countryCode?: string | null;
  productionCompanyName?: string | null;
  actorNames?: string[];
  tagNames?: string[];
  genreNames?: string[];
}

function cleanArray(value: unknown, max: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim().slice(0, maxLen);
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * PATCH /api/colaborador/series/[id]
 *
 * Ficha reducida para el rol COLLABORATOR (ver /admin/colaborador/[id]) —
 * subset "seguro" de campos, sin nada curatorial (featured, review,
 * overallRating, notesPrivate, universe, related series, etc.). ADMIN
 * tambien puede pegarle a este endpoint (ownership check lo deja pasar),
 * pero su UI real sigue siendo /admin/series/[id]/editar.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRole(['ADMIN', 'COLLABORATOR']);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const seriesId = parseInt(id, 10);
    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'ID invalido.' }, { status: 400 });
    }
    const ownership = await assertSeriesOwnership(seriesId, auth);
    if (!ownership.ok) {
      return NextResponse.json(
        { error: ownership.error },
        { status: ownership.status }
      );
    }

    const body = (await request.json()) as PatchBody;

    const data: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const title = body.title.trim();
      if (!title) {
        return NextResponse.json(
          { error: 'El titulo es requerido.' },
          { status: 422 }
        );
      }
      data.title = title.slice(0, 200);
    }
    if (body.originalTitle !== undefined) {
      data.originalTitle = body.originalTitle?.trim().slice(0, 200) || null;
    }
    if (body.year !== undefined) {
      data.year =
        typeof body.year === 'number' && Number.isFinite(body.year)
          ? Math.floor(body.year)
          : null;
    }
    if (body.type !== undefined && ALLOWED_TYPES.has(body.type)) {
      data.type = body.type;
    }
    if (body.synopsis !== undefined) {
      data.synopsis = body.synopsis?.trim().slice(0, 2000) || null;
    }
    if (body.imageUrl !== undefined) {
      const newImageUrl = body.imageUrl?.trim() || null;
      data.imageUrl = newImageUrl;
      // Sin poster no hay thumb; con poster, solo se pisa si el colaborador
      // subio un archivo nuevo via /api/upload (que manda imageThumbUrl) —
      // si no, se omite y el thumb existente sobrevive a este PATCH.
      if (!newImageUrl) {
        data.imageThumbUrl = null;
      } else if (typeof body.imageThumbUrl === 'string') {
        data.imageThumbUrl = body.imageThumbUrl.trim() || null;
      }
    }
    const metadata = await getContributionMetadata({
      countryCode: body.countryCode,
      productionCompanyName: body.productionCompanyName,
      actorNames: cleanArray(body.actorNames, 12, 80),
      tagNames: cleanArray(body.tagNames, 12, 60),
      genreNames: cleanArray(body.genreNames, 6, 60),
    });
    if (!metadata.ok) {
      return NextResponse.json(
        contributionMetadataFailure(metadata.unresolvedNames),
        { status: 422 }
      );
    }
    if (body.countryCode !== undefined)
      data.countryId = metadata.data.countryId;
    if (body.productionCompanyName !== undefined)
      data.productionCompanyId = metadata.data.productionCompanyId;

    const updated = await prisma.$transaction(async (tx) => {
      // Recheck the boundary in the write itself: ownership may change after the guard.
      const where = {
        id: seriesId,
        ...(auth.role === 'COLLABORATOR'
          ? {
              origin: 'USER_EMBED',
              catalogScope: 'WATCHABLE_ONLY',
              submittedById: auth.userId,
            }
          : {}),
      };
      // Foto previa al guardado, antes de tocar nada. Si el UPDATE de abajo
      // no pasa el limite de ownership, la transaccion se revierte con ella.
      const before = await loadSeriesForSave(tx, seriesId);
      // A real parent UPDATE also locks the boundary for relation-only edits.
      const series = await tx.series.update({
        where,
        data: { ...data, updatedAt: new Date(), editVersion: { increment: 1 } },
      });
      if (before) {
        await recordSeriesRevision(tx, before, auth.userId, 'collaborator');
      }

      if (body.actorNames !== undefined) {
        await tx.seriesActor.deleteMany({ where: { seriesId } });
        for (const actorId of metadata.data.actorIds) {
          await tx.seriesActor.create({
            data: { seriesId, actorId, character: '', isMain: false },
          });
        }
      }
      if (body.tagNames !== undefined) {
        await tx.seriesTag.deleteMany({ where: { seriesId } });
        for (const tagId of metadata.data.tagIds) {
          await tx.seriesTag.create({ data: { seriesId, tagId } });
        }
      }
      if (body.genreNames !== undefined) {
        await tx.seriesGenre.deleteMany({ where: { seriesId } });
        for (const genreId of metadata.data.genreIds) {
          await tx.seriesGenre.create({
            data: { seriesId, genreId },
          });
        }
      }

      return series;
    });

    revalidatePath('/ver');
    revalidateSeriesDetail(updated);
    revalidatePath('/admin/series/user-submitted');

    return NextResponse.json({ id: updated.id, title: updated.title });
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'No podés modificar esta serie.' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al guardar' },
      { status: 500 }
    );
  }
}
