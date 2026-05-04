// Cliente liviano para Google Gemini API (free tier).
// Modelo: gemini-2.0-flash. Limites free: ~15 RPM, ~1500 RPD por API key.
// Sin SDK extra: fetch directo para mantener bundle chico.

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
}

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

interface GenerateOptions {
  prompt: string;
  systemInstruction?: string;
  // 0 = deterministico, 1 = creativo. Default bajo para asistencia de texto.
  temperature?: number;
  maxOutputTokens?: number;
}

export async function generateText({
  prompt,
  systemInstruction,
  temperature = 0.4,
  maxOutputTokens = 2048,
}: GenerateOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError(
      'GEMINI_API_KEY no esta configurado en el servidor',
      503
    );
  }

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    ...(systemInstruction && {
      systemInstruction: { parts: [{ text: systemInstruction }] },
    }),
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType: 'text/plain',
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  };

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    if (res.status === 429) {
      throw new GeminiError(
        'Limite de uso del asistente IA alcanzado, esperá unos segundos.',
        429
      );
    }
    throw new GeminiError(
      `Error del asistente IA (${res.status}): ${errText.slice(0, 200)}`,
      res.status >= 500 ? 502 : res.status
    );
  }

  const data = (await res.json()) as GeminiResponse;

  if (data.promptFeedback?.blockReason) {
    throw new GeminiError(
      `El asistente bloqueó la solicitud (${data.promptFeedback.blockReason}).`,
      400
    );
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new GeminiError('El asistente IA no devolvió contenido.', 502);
  }
  return text;
}
