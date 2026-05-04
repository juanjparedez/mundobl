import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { generateText, GeminiError } from '@/lib/gemini';
import { LOCALE_LABELS, isSupportedLocale } from '@/i18n/config';

const ACTIONS = [
  'polish',
  'translate',
  'suggest-title',
  'spoiler-check',
] as const;
type Action = (typeof ACTIONS)[number];

interface AssistInput {
  action?: Action;
  body?: string;
  title?: string;
  language?: string;
  targetLanguage?: string;
}

const BODY_MAX = 20000;

// Throttle muy basico en memoria del proceso (best-effort en serverless,
// mejor que nada para evitar abuso obvio). 5 requests / min por usuario.
const userHits = new Map<string, number[]>();
const LIMIT_PER_MIN = 5;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const cutoff = now - 60_000;
  const hits = (userHits.get(userId) ?? []).filter((t) => t > cutoff);
  if (hits.length >= LIMIT_PER_MIN) return false;
  hits.push(now);
  userHits.set(userId, hits);
  return true;
}

function localeName(code: string): string {
  if (isSupportedLocale(code)) return LOCALE_LABELS[code];
  return code;
}

function buildPrompt(input: AssistInput): {
  prompt: string;
  systemInstruction: string;
} {
  const {
    action,
    body = '',
    title = '',
    language = 'es',
    targetLanguage,
  } = input;
  const langName = localeName(language);

  switch (action) {
    case 'polish':
      return {
        systemInstruction: `Sos un editor literario que pule reseñas de series asiaticas (BL/GL).
Tu trabajo: mejorar redaccion, ortografia y fluidez sin cambiar la opinion del autor ni inventar hechos.
Mantene el tono personal y emocional original. NO agregues spoilers que no esten en el texto.
Devolve SOLO el texto pulido, sin comillas, sin explicaciones, sin titulos extra.
Idioma de salida: ${langName}.`,
        prompt: `Pulí esta reseña manteniendo la voz del autor:\n\n${body}`,
      };
    case 'translate':
      if (!targetLanguage) {
        throw new GeminiError('targetLanguage es requerido para traducir', 400);
      }
      return {
        systemInstruction: `Sos un traductor especializado en reseñas de series asiaticas (BL/GL).
Traduci preservando el tono, las emociones y los terminos del fandom.
NO interpretes ni resumas: traduci el texto completo.
Devolve SOLO el texto traducido, sin comillas ni explicaciones.
Idioma origen: ${langName}. Idioma destino: ${localeName(targetLanguage)}.`,
        prompt: title ? `Titulo: ${title}\n\nReseña:\n${body}` : body,
      };
    case 'suggest-title':
      return {
        systemInstruction: `Sos un editor que sugiere titulos cortos y atractivos para reseñas de series asiaticas (BL/GL).
El titulo debe tener entre 4 y 12 palabras, capturar la idea central y ser personal (no clickbait).
Devolve SOLO el titulo sugerido, sin comillas ni explicaciones, sin "Titulo:" prefijo.
Idioma: ${langName}.`,
        prompt: `Sugerí un titulo para esta reseña:\n\n${body}`,
      };
    case 'spoiler-check':
      return {
        systemInstruction: `Analiza una reseña de serie y detecta posibles spoilers (revelaciones de trama, finales, muertes, plot twists).
Devolve un JSON valido (y solo JSON, sin markdown fence) con la forma:
{"hasSpoilers": boolean, "reasons": [string, ...]}
Reasons debe listar frases o ideas detectadas, en ${langName}, max 3 items.`,
        prompt: body,
      };
    default:
      throw new GeminiError('Action invalida', 400);
  }
}

// POST /api/reviews/ai-assist
// body: { action, body, title?, language?, targetLanguage? }
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    if (!checkRateLimit(authResult.userId)) {
      return NextResponse.json(
        {
          error:
            'Estas usando el asistente muy rapido. Limite local: 5 por minuto. Esperá unos segundos.',
          source: 'local-throttle',
        },
        { status: 429 }
      );
    }

    const input = (await request.json()) as AssistInput;
    if (!input.action || !ACTIONS.includes(input.action)) {
      return NextResponse.json(
        { error: `action debe ser uno de: ${ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }
    const body = (input.body ?? '').trim();
    if (input.action !== 'suggest-title' && !body) {
      return NextResponse.json({ error: 'body es requerido' }, { status: 400 });
    }
    if (input.action === 'suggest-title' && !body) {
      return NextResponse.json(
        { error: 'Necesitas algo de texto para sugerir titulo' },
        { status: 400 }
      );
    }
    if (body.length > BODY_MAX) {
      return NextResponse.json(
        { error: `El texto supera ${BODY_MAX} caracteres` },
        { status: 400 }
      );
    }

    const { prompt, systemInstruction } = buildPrompt(input);
    const result = await generateText({
      prompt,
      systemInstruction,
      temperature: input.action === 'spoiler-check' ? 0.1 : 0.5,
      // Margenes mas generosos: gemini-2.5 usa "thinking tokens" por
      // default que se consumen antes de la salida visible.
      maxOutputTokens: input.action === 'suggest-title' ? 512 : 4096,
      // Para tareas cortas/deterministicas, deshabilitamos thinking
      // para que toda la cuota vaya al texto de salida.
      thinkingBudget: input.action === 'suggest-title' ? 0 : undefined,
    });

    if (input.action === 'spoiler-check') {
      // Extraemos JSON aunque venga con fence accidental.
      const jsonStr = result
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      try {
        const parsed = JSON.parse(jsonStr) as {
          hasSpoilers?: boolean;
          reasons?: string[];
        };
        return NextResponse.json({
          action: 'spoiler-check',
          hasSpoilers: parsed.hasSpoilers === true,
          reasons: Array.isArray(parsed.reasons)
            ? parsed.reasons.slice(0, 3)
            : [],
        });
      } catch {
        return NextResponse.json({
          action: 'spoiler-check',
          hasSpoilers: false,
          reasons: [],
        });
      }
    }

    return NextResponse.json({ action: input.action, text: result });
  } catch (error) {
    if (error instanceof GeminiError) {
      console.error('[ai-assist] Gemini error:', error.message);
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error('[ai-assist] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado del asistente' },
      { status: 500 }
    );
  }
}
