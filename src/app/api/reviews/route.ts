import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';
import { auth } from '@/lib/auth';

const TITLE_MAX = 160;
const BODY_MAX = 20000;
const RATING_MIN = 1;
const RATING_MAX = 10;

const VERDICTS = ['RECOMMENDED', 'MIXED', 'SKIP'] as const;
type Verdict = (typeof VERDICTS)[number];

const STATUSES = ['DRAFT', 'PUBLISHED'] as const;
type Status = (typeof STATUSES)[number];

interface ReviewInput {
  seriesId?: number;
  title?: string;
  body?: string;
  verdict?: Verdict | null;
  language?: string;
  status?: Status;
  plotRating?: number | null;
  chemistryRating?: number | null;
  ostRating?: number | null;
  castingRating?: number | null;
  hasSpoilers?: boolean;
}

function validateRating(value: unknown): number | null | 'invalid' {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'number' || !Number.isInteger(value)) return 'invalid';
  if (value < RATING_MIN || value > RATING_MAX) return 'invalid';
  return value;
}

// GET /api/reviews?seriesId=X — lista reviews publicadas de una serie
// + draft/hidden propio del usuario logueado (si aplica)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const seriesIdParam = request.nextUrl.searchParams.get('seriesId');
    if (!seriesIdParam) {
      return NextResponse.json(
        { error: 'seriesId es requerido' },
        { status: 400 }
      );
    }
    const seriesId = parseInt(seriesIdParam, 10);
    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'seriesId invalido' }, { status: 400 });
    }

    const where: Prisma.ReviewWhereInput = {
      seriesId,
      OR: [
        { status: 'PUBLISHED' },
        ...(currentUserId ? [{ userId: currentUserId }] : []),
      ],
    };

    const reviews = await prisma.review.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Error al obtener reseñas' },
      { status: 500 }
    );
  }
}

// POST /api/reviews — crea o actualiza la review propia del usuario
// (clave: userId + seriesId + language). Si existe, hace upsert.
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = (await request.json()) as ReviewInput;
    const seriesId = body.seriesId;
    const title = body.title?.trim();
    const text = body.body?.trim();
    const language = (body.language ?? 'es').slice(0, 10);

    if (!seriesId || isNaN(seriesId)) {
      return NextResponse.json(
        { error: 'seriesId es requerido' },
        { status: 400 }
      );
    }
    if (!title) {
      return NextResponse.json(
        { error: 'El titulo es requerido' },
        { status: 400 }
      );
    }
    if (title.length > TITLE_MAX) {
      return NextResponse.json(
        { error: `El titulo no puede superar ${TITLE_MAX} caracteres` },
        { status: 400 }
      );
    }
    if (!text) {
      return NextResponse.json(
        { error: 'El cuerpo de la reseña es requerido' },
        { status: 400 }
      );
    }
    if (text.length > BODY_MAX) {
      return NextResponse.json(
        { error: `El cuerpo no puede superar ${BODY_MAX} caracteres` },
        { status: 400 }
      );
    }

    const verdict =
      body.verdict && VERDICTS.includes(body.verdict) ? body.verdict : null;
    const status: Status =
      body.status && STATUSES.includes(body.status) ? body.status : 'PUBLISHED';

    const ratings = {
      plotRating: validateRating(body.plotRating),
      chemistryRating: validateRating(body.chemistryRating),
      ostRating: validateRating(body.ostRating),
      castingRating: validateRating(body.castingRating),
    };
    for (const [key, value] of Object.entries(ratings)) {
      if (value === 'invalid') {
        return NextResponse.json(
          {
            error: `${key} debe ser entero entre ${RATING_MIN} y ${RATING_MAX}`,
          },
          { status: 400 }
        );
      }
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

    const publishedAt = status === 'PUBLISHED' ? new Date() : null;

    const review = await prisma.review.upsert({
      where: {
        userId_seriesId_language: {
          userId: authResult.userId,
          seriesId,
          language,
        },
      },
      create: {
        userId: authResult.userId,
        seriesId,
        title,
        body: text,
        verdict,
        language,
        status,
        plotRating: ratings.plotRating as number | null,
        chemistryRating: ratings.chemistryRating as number | null,
        ostRating: ratings.ostRating as number | null,
        castingRating: ratings.castingRating as number | null,
        hasSpoilers: body.hasSpoilers === true,
        publishedAt,
      },
      update: {
        title,
        body: text,
        verdict,
        status,
        plotRating: ratings.plotRating as number | null,
        chemistryRating: ratings.chemistryRating as number | null,
        ostRating: ratings.ostRating as number | null,
        castingRating: ratings.castingRating as number | null,
        hasSpoilers: body.hasSpoilers === true,
        publishedAt,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error saving review:', error);
    return NextResponse.json(
      { error: 'Error al guardar reseña' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews?id=X — borra la review propia
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const id = parseInt(request.nextUrl.searchParams.get('id') || '', 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!review) {
      return NextResponse.json(
        { error: 'Reseña no encontrada' },
        { status: 404 }
      );
    }
    if (review.userId !== authResult.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Error al eliminar reseña' },
      { status: 500 }
    );
  }
}
