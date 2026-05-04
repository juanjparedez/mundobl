import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { generateText, GeminiError } from '@/lib/gemini';

const MAX_SUMMARY_WORDS = 280;
const MAX_URL_LENGTH = 2048;

interface AiGenerateInput {
  url?: string;
  sourceName?: string;
  articleText?: string; // texto del artículo ya extraído por el cliente (opcional)
}

// POST /api/admin/news/ai-generate
// Body: { url, sourceName, articleText? }
// Genera un resumen ético a partir de la URL/texto del artículo.
// SIEMPRE incluye disclaimer de fuente — nunca auto-publica.
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const input = (await request.json()) as AiGenerateInput;

    if (!input.url?.trim()) {
      return NextResponse.json({ error: 'url es requerida' }, { status: 400 });
    }
    if (input.url.length > MAX_URL_LENGTH) {
      return NextResponse.json(
        { error: 'url supera la longitud máxima' },
        { status: 400 }
      );
    }
    if (!input.sourceName?.trim()) {
      return NextResponse.json(
        { error: 'sourceName es requerido' },
        { status: 400 }
      );
    }

    // Validar que sea una URL razonablemente formada
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(input.url.trim());
    } catch {
      return NextResponse.json({ error: 'url no es válida' }, { status: 400 });
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: 'url debe usar http o https' },
        { status: 400 }
      );
    }

    const articleText = (input.articleText ?? '').trim();
    if (!articleText) {
      return NextResponse.json(
        { error: 'articleText es requerido (pegá el texto del artículo)' },
        { status: 400 }
      );
    }
    if (articleText.length > 8000) {
      return NextResponse.json(
        { error: 'articleText supera 8000 caracteres' },
        { status: 400 }
      );
    }

    const disclaimer = `\n\n---\n_Resumen generado con asistencia de IA · Fuente original: **${input.sourceName.trim()}** · [Ver artículo completo](${input.url.trim()})_`;

    const summaryRaw = await generateText({
      systemInstruction: `Sos un editor de una comunidad de fans de BL (Boys Love) y GL (Girls Love).
Tu tarea es escribir un resumen claro y atractivo de una noticia en español.

Reglas obligatorias:
- Máximo ${MAX_SUMMARY_WORDS} palabras en el cuerpo del resumen.
- Podés usar markdown ligero (negrita, cursiva, listas cortas) pero SIN headings (#).
- Tono informativo, entusiasta pero profesional; pensado para fans del género.
- NO inventes datos que no estén en el artículo.
- NO repitas ni copies literalmente el texto del artículo.
- NO agregues opiniones propias ni juicios de valor no presentes en la fuente.
- Incluí el dato más importante en la primera oración.
- Devolve SOLO el cuerpo del resumen, sin título, sin disclaimer, sin comillas wrapper.`,
      prompt: `Artículo de "${input.sourceName.trim()}" (${input.url.trim()}):\n\n${articleText}`,
      temperature: 0.5,
      maxOutputTokens: 512,
      thinkingBudget: 0,
    });

    const summary = summaryRaw.trim() + disclaimer;

    // Intentar extraer título sugerido con una segunda llamada liviana
    let suggestedTitle: string | null = null;
    try {
      const titleRaw = await generateText({
        systemInstruction: `Generá un titular para una noticia de BL/GL en español.
Reglas:
- Máximo 100 caracteres.
- Sin signos de exclamación innecesarios.
- Verbos en presente o pasado según corresponda.
- Devolve SOLO el titular, sin comillas ni puntuación final.`,
        prompt: `Generá el titular para este resumen:\n\n${summaryRaw.trim()}`,
        temperature: 0.4,
        maxOutputTokens: 128,
        thinkingBudget: 0,
      });
      suggestedTitle = titleRaw.trim().slice(0, 120) || null;
    } catch {
      // silencioso — el título es opcional
    }

    return NextResponse.json({ summary, suggestedTitle });
  } catch (error) {
    if (error instanceof GeminiError) {
      console.error('[news ai-generate] Gemini error:', error.message);
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error('[news ai-generate] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado del asistente de IA' },
      { status: 500 }
    );
  }
}
