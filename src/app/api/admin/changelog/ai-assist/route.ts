import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { generateText, GeminiError } from '@/lib/gemini';

const ACTIONS = ['polish', 'suggest-category'] as const;
type Action = (typeof ACTIONS)[number];

const KNOWN_CATEGORIES = ['Features', 'Fixes', 'Seguridad', 'Mejoras', 'Otros'];

interface AssistInput {
  action?: Action;
  body?: string;
  category?: string;
}

// POST /api/admin/changelog/ai-assist
// Body: { action, body, category? }
// Acciones:
// - polish: pule la descripcion para que sea clara y orientada al usuario.
// - suggest-category: detecta la categoria (Features/Fixes/Seguridad/Mejoras)
//   a partir del cuerpo. Devuelve { category }.
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const input = (await request.json()) as AssistInput;
    if (!input.action || !ACTIONS.includes(input.action)) {
      return NextResponse.json(
        { error: `action debe ser uno de: ${ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }
    const body = (input.body ?? '').trim();
    if (!body) {
      return NextResponse.json({ error: 'body es requerido' }, { status: 400 });
    }
    if (body.length > 2000) {
      return NextResponse.json(
        { error: 'body supera 2000 caracteres' },
        { status: 400 }
      );
    }

    if (input.action === 'polish') {
      const polished = await generateText({
        systemInstruction: `Sos un editor que pule items de changelog para una app web.
Reglas:
- Texto en una sola linea, en español.
- Empezá con verbo en infinitivo o pasado imperfecto. NO uses primera persona.
- Sé especifico: que cambia, no como se implemento.
- Tono neutro, util para el usuario final, no tecnico-arido.
- Maximo 140 caracteres.
- Devolve SOLO el texto pulido, sin comillas, prefijos ni explicaciones.`,
        prompt: `Puli este item de changelog manteniendo la idea:\n\n${body}`,
        temperature: 0.4,
        maxOutputTokens: 256,
        thinkingBudget: 0,
      });
      return NextResponse.json({ action: 'polish', text: polished.trim() });
    }

    // suggest-category
    const result = await generateText({
      systemInstruction: `Categorizá un item de changelog. Categorias validas (en este orden de prioridad):
${KNOWN_CATEGORIES.join(', ')}.
Devolve un JSON valido (y solo JSON, sin markdown fence) con la forma:
{"category": string}
Donde category debe ser exactamente una de las categorias listadas.`,
      prompt: body,
      temperature: 0.1,
      maxOutputTokens: 64,
      thinkingBudget: 0,
    });
    const cleaned = result
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    try {
      const parsed = JSON.parse(cleaned) as { category?: string };
      const category =
        parsed.category && KNOWN_CATEGORIES.includes(parsed.category)
          ? parsed.category
          : null;
      return NextResponse.json({ action: 'suggest-category', category });
    } catch {
      return NextResponse.json({
        action: 'suggest-category',
        category: null,
      });
    }
  } catch (error) {
    if (error instanceof GeminiError) {
      console.error('[changelog ai-assist] Gemini error:', error.message);
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error('[changelog ai-assist] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado del asistente' },
      { status: 500 }
    );
  }
}
