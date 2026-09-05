import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

const MAX_SCORE = 1000; // guardrail generoso — la trivia hoy no llega ni cerca

/**
 * GET /api/user/glossary-quiz-score
 * Devuelve el mejor puntaje guardado del usuario logueado (o null si
 * todavía no jugó estando logueado). Usado por GlosarioQuiz.tsx para
 * hidratar el "mejor puntaje" al montar, mezclándolo con el local de
 * useBestScore (por si jugó antes desde otro dispositivo).
 */
export async function GET() {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  const user = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: { glossaryQuizBestScore: true },
  });

  return NextResponse.json({
    glossaryQuizBestScore: user?.glossaryQuizBestScore ?? null,
  });
}

/**
 * PATCH /api/user/glossary-quiz-score
 * Body: { score: number }
 *
 * Persiste el mejor puntaje de la trivia del Glosario Cultural por
 * usuario (antes solo vivía en localStorage vía useBestScore, invisible
 * para el server/logros). Solo actualiza si el score nuevo es mayor al
 * guardado — nunca lo baja. GlosarioQuiz.tsx llama esto cuando hay
 * sesión; sin sesión sigue usando localStorage como antes.
 */
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  let body: { score?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const score = typeof body.score === 'number' ? Math.floor(body.score) : NaN;
  if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
    return NextResponse.json({ error: 'score inválido.' }, { status: 400 });
  }

  const current = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: { glossaryQuizBestScore: true },
  });

  if (current && current.glossaryQuizBestScore !== null && current.glossaryQuizBestScore >= score) {
    return NextResponse.json({ glossaryQuizBestScore: current.glossaryQuizBestScore });
  }

  const updated = await prisma.user.update({
    where: { id: authResult.userId },
    data: { glossaryQuizBestScore: score },
    select: { glossaryQuizBestScore: true },
  });

  return NextResponse.json(updated);
}
