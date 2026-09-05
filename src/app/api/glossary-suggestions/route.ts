import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

const VALID_COUNTRIES = new Set(['thailand', 'korea', 'japan', 'general']);
const VALID_CATEGORIES = new Set([
  'honorifics',
  'relationships',
  'genreConcepts',
  'university',
  'fandom',
]);

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function GET() {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  const suggestions = await prisma.glossarySuggestion.findMany({
    where: { userId: authResult.userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(suggestions);
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const term = optionalString(data.term);
    const meaning = optionalString(data.meaning);
    const context = optionalString(data.context);
    const sourceUrl = optionalString(data.sourceUrl);
    const country = optionalString(data.country) ?? 'general';
    const category = optionalString(data.category) ?? 'fandom';

    if (!term || !meaning || !context) {
      return NextResponse.json(
        { error: 'Término, significado y contexto son requeridos.' },
        { status: 400 }
      );
    }
    const examples = optionalString(data.examples);
    const commonMistake = optionalString(data.commonMistake);

    if (
      term.length > 120 ||
      meaning.length > 2000 ||
      context.length > 3000 ||
      (examples && examples.length > 2000) ||
      (commonMistake && commonMistake.length > 1000)
    ) {
      return NextResponse.json(
        { error: 'Uno de los campos supera el límite permitido.' },
        { status: 400 }
      );
    }
    if (!VALID_COUNTRIES.has(country) || !VALID_CATEGORIES.has(category)) {
      return NextResponse.json({ error: 'Clasificación no válida.' }, { status: 400 });
    }
    if (sourceUrl) {
      try {
        const parsedUrl = new URL(sourceUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error();
      } catch {
        return NextResponse.json({ error: 'URL de fuente no válida.' }, { status: 400 });
      }
    }

    const suggestion = await prisma.glossarySuggestion.create({
      data: {
        term,
        transliteration: optionalString(data.transliteration),
        country,
        category,
        meaning,
        context,
        examples,
        commonMistake,
        sourceName: optionalString(data.sourceName),
        sourceUrl,
        notes: optionalString(data.notes),
        userId: authResult.userId,
      },
    });

    return NextResponse.json(suggestion, { status: 201 });
  } catch (error) {
    console.error('[glossary-suggestions POST]', error);
    return NextResponse.json(
      { error: 'No se pudo enviar la sugerencia.' },
      { status: 500 }
    );
  }
}
