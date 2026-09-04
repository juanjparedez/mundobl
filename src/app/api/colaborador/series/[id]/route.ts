import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import { assertSeriesOwnership } from '@/lib/collaborator-guard';
import {
  findOrCreateTag,
  findOrCreateGenre,
  findOrCreateActor,
} from '@/lib/tag-utils';

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
      data.imageUrl = body.imageUrl?.trim() || null;
    }
    if (body.countryCode !== undefined) {
      if (body.countryCode) {
        // Case-insensitive: ver comentario equivalente en
        // /api/series/import-playlist/confirm.
        const country = await prisma.country.findFirst({
          where: { code: { equals: body.countryCode, mode: 'insensitive' } },
          select: { id: true },
        });
        data.countryId = country?.id ?? null;
      } else {
        data.countryId = null;
      }
    }
    if (body.productionCompanyName !== undefined) {
      const name = body.productionCompanyName?.trim();
      if (name) {
        const pc = await prisma.productionCompany.upsert({
          where: { name },
          update: {},
          create: { name },
        });
        data.productionCompanyId = pc.id;
      } else {
        data.productionCompanyId = null;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const series = Object.keys(data).length
        ? await tx.series.update({ where: { id: seriesId }, data })
        : await tx.series.findUniqueOrThrow({ where: { id: seriesId } });

      if (body.actorNames !== undefined) {
        await tx.seriesActor.deleteMany({ where: { seriesId } });
        for (const name of cleanArray(body.actorNames, 12, 80)) {
          const actor = await findOrCreateActor(tx, name);
          if (!actor) continue;
          await tx.seriesActor.create({
            data: { seriesId, actorId: actor.id, character: '', isMain: false },
          });
        }
      }
      if (body.tagNames !== undefined) {
        await tx.seriesTag.deleteMany({ where: { seriesId } });
        for (const name of cleanArray(body.tagNames, 12, 60)) {
          const tag = await findOrCreateTag(tx, name);
          if (!tag) continue;
          await tx.seriesTag.create({ data: { seriesId, tagId: tag.id } });
        }
      }
      if (body.genreNames !== undefined) {
        await tx.seriesGenre.deleteMany({ where: { seriesId } });
        for (const name of cleanArray(body.genreNames, 6, 60)) {
          const genre = await findOrCreateGenre(tx, name);
          if (!genre) continue;
          await tx.seriesGenre.create({
            data: { seriesId, genreId: genre.id },
          });
        }
      }

      return series;
    });

    revalidatePath('/ver');
    revalidatePath(`/ver/${seriesId}`);
    revalidatePath('/admin/series/user-submitted');

    return NextResponse.json({ id: updated.id, title: updated.title });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al guardar' },
      { status: 500 }
    );
  }
}
