import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';
import { auth } from '@/lib/auth';
import { generateText, GeminiError } from '@/lib/gemini';
import { isSupportedLocale, LOCALE_LABELS } from '@/i18n/config';
import { notifySeriesSubscribers } from '@/lib/notifications';

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
  // Idiomas adicionales en los que crear traducciones automaticas
  // (Gemini). Solo aplica al crear, no al editar.
  translateTo?: string[];
  status?: Status;
  plotRating?: number | null;
  chemistryRating?: number | null;
  ostRating?: number | null;
  castingRating?: number | null;
  hasSpoilers?: boolean;
}

// Maximo de traducciones por save para no agotar la cuota de Gemini.
const MAX_TRANSLATE_TARGETS = 3;

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
      orderBy: [
        { isFeatured: 'desc' },
        { helpfulCount: 'desc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        user: { select: { id: true, name: true, nickname: true, image: true } },
        ...(currentUserId && {
          votes: {
            where: { userId: currentUserId },
            select: { helpful: true },
          },
        }),
      },
    });

    type ReviewWithVotes = (typeof reviews)[number] & {
      votes?: { helpful: boolean }[];
    };
    const enriched = (reviews as ReviewWithVotes[]).map((r) => {
      const myVote = r.votes && r.votes.length > 0 ? r.votes[0].helpful : null;
      const { votes: _votes, ...rest } = r;
      return { ...rest, myVote };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Error al obtener reseñas' },
      { status: 500 }
    );
  }
}

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
      select: { id: true, title: true, origin: true },
    });
    if (!seriesExists) {
      return NextResponse.json(
        { error: 'Serie no encontrada' },
        { status: 404 }
      );
    }
    if (seriesExists.origin === 'USER_EMBED') {
      return NextResponse.json(
        {
          error:
            'No se pueden publicar resenas en una serie aportada por un usuario. Esperar a que un admin la linkee con una serie del catalogo.',
        },
        { status: 422 }
      );
    }

    const previousReview = await prisma.review.findUnique({
      where: {
        userId_seriesId_language: {
          userId: authResult.userId,
          seriesId,
          language,
        },
      },
      select: { status: true },
    });
    const isNewlyPublished =
      status === 'PUBLISHED' &&
      (previousReview === null || previousReview.status !== 'PUBLISHED');

    const publishedAt = status === 'PUBLISHED' ? new Date() : null;

    const commonData = {
      verdict,
      status,
      plotRating: ratings.plotRating as number | null,
      chemistryRating: ratings.chemistryRating as number | null,
      ostRating: ratings.ostRating as number | null,
      castingRating: ratings.castingRating as number | null,
      hasSpoilers: body.hasSpoilers === true,
      publishedAt,
    };

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
        language,
        ...commonData,
      },
      update: {
        title,
        body: text,
        ...commonData,
      },
      include: {
        user: { select: { id: true, name: true, nickname: true, image: true } },
      },
    });

    if (isNewlyPublished) {
      await notifySeriesSubscribers({
        seriesId,
        type: 'review_published',
        title: `Nueva reseña en ${seriesExists.title}`,
        body: title,
        refType: 'review',
        refId: review.id,
        excludeUserId: authResult.userId,
      });
    }

    const requestedTargets = Array.isArray(body.translateTo)
      ? body.translateTo
      : [];
    const targets = Array.from(
      new Set(
        requestedTargets
          .filter((c) => typeof c === 'string')
          .filter((c) => isSupportedLocale(c))
          .filter((c) => c !== language)
      )
    ).slice(0, MAX_TRANSLATE_TARGETS);

    const translations: Array<{ language: string; reviewId: number }> = [];
    const translationErrors: Array<{ language: string; error: string }> = [];

    if (targets.length > 0) {
      const sourceLabel = LOCALE_LABELS[language as never] ?? language;
      for (const target of targets) {
        const targetLabel = LOCALE_LABELS[target as never] ?? target;
        try {
          const translated = await generateText({
            systemInstruction: `Sos un traductor especializado en reseñas de series asiaticas (BL/GL).
Traduci preservando el tono, las emociones y los terminos del fandom.
NO interpretes ni resumas: traduci el texto completo.
Devolve un JSON valido (y solo JSON, sin markdown fence) con la forma:
{"title": string, "body": string}
Idioma origen: ${sourceLabel}. Idioma destino: ${targetLabel}.`,
            prompt: JSON.stringify({ title, body: text }),
            temperature: 0.3,
            maxOutputTokens: 4096,
          });
          // Limpiar fence accidental.
          const cleaned = translated
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();
          const parsed = JSON.parse(cleaned) as {
            title?: string;
            body?: string;
          };
          if (
            !parsed.title ||
            !parsed.body ||
            typeof parsed.title !== 'string' ||
            typeof parsed.body !== 'string'
          ) {
            throw new Error('Respuesta de IA invalida');
          }

          const tr = await prisma.review.upsert({
            where: {
              userId_seriesId_language: {
                userId: authResult.userId,
                seriesId,
                language: target,
              },
            },
            create: {
              userId: authResult.userId,
              seriesId,
              title: parsed.title.slice(0, 160),
              body: parsed.body.slice(0, 20000),
              language: target,
              ...commonData,
            },
            update: {
              title: parsed.title.slice(0, 160),
              body: parsed.body.slice(0, 20000),
              ...commonData,
            },
          });
          translations.push({ language: target, reviewId: tr.id });
        } catch (err) {
          const msg =
            err instanceof GeminiError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Error desconocido';
          console.error(
            `[reviews] traduccion ${language}->${target} fallo:`,
            msg
          );
          translationErrors.push({ language: target, error: msg });
        }
      }
    }

    return NextResponse.json({ ...review, translations, translationErrors });
  } catch (error) {
    console.error('Error saving review:', error);
    return NextResponse.json(
      { error: 'Error al guardar reseña' },
      { status: 500 }
    );
  }
}

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
