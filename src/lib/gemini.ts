// Cliente liviano para Google Gemini API (free tier).
// Sin SDK extra: fetch directo para mantener bundle chico.
// Cadena de modelos: probamos en orden y si uno devuelve 429/5xx
// caemos al siguiente. Override via env GEMINI_MODELS (csv).
const DEFAULT_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest',
];

function getModels(): string[] {
  const raw = process.env.GEMINI_MODELS?.trim();
  if (!raw) return DEFAULT_MODELS;
  const parsed = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : DEFAULT_MODELS;
}

function endpointFor(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}

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

interface GeminiErrorBody {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: unknown;
  };
}

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
    // Codigo simbolico de Google (RESOURCE_EXHAUSTED, PERMISSION_DENIED, etc).
    public readonly googleStatus?: string
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

// Cuando uno de estos errores ocurre, vale la pena probar el siguiente modelo.
function shouldFallback(status: number, googleStatus?: string): boolean {
  if (status === 429) return true; // RESOURCE_EXHAUSTED en este modelo
  if (status === 404) return true; // modelo no encontrado / renombrado
  if (status >= 500 && status < 600) return true; // error transitorio
  if (googleStatus === 'RESOURCE_EXHAUSTED') return true;
  if (googleStatus === 'NOT_FOUND') return true;
  if (googleStatus === 'UNAVAILABLE') return true;
  return false;
}

async function callOnce(
  model: string,
  apiKey: string,
  payload: Record<string, unknown>
): Promise<{ text?: string; error?: GeminiError }> {
  const res = await fetch(`${endpointFor(model)}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => '');
    let parsed: GeminiErrorBody | null = null;
    try {
      parsed = JSON.parse(raw) as GeminiErrorBody;
    } catch {
      parsed = null;
    }
    const googleStatus = parsed?.error?.status;
    const googleMessage = parsed?.error?.message;
    // Loggeo crudo para que se pueda diagnosticar en Vercel logs.
    console.error('[gemini] error', {
      model,
      httpStatus: res.status,
      googleStatus,
      googleMessage: googleMessage?.slice(0, 500),
    });

    let userMessage: string;
    if (res.status === 429 || googleStatus === 'RESOURCE_EXHAUSTED') {
      userMessage =
        'Cuota de Gemini agotada en este modelo (free tier 15 RPM / 1500 RPD compartido por API key).';
    } else if (
      res.status === 403 ||
      googleStatus === 'PERMISSION_DENIED' ||
      googleStatus === 'UNAUTHENTICATED'
    ) {
      userMessage =
        'API key invalida o sin permisos. Reviewa que la "Generative Language API" este habilitada y que la key sea reciente.';
    } else if (res.status === 400 && googleMessage) {
      userMessage = `Solicitud rechazada por Gemini: ${googleMessage.slice(0, 200)}`;
    } else if (googleMessage) {
      userMessage = `Error del asistente IA (${res.status}): ${googleMessage.slice(0, 200)}`;
    } else {
      userMessage = `Error del asistente IA (${res.status}).`;
    }

    return {
      error: new GeminiError(
        userMessage,
        res.status >= 500 ? 502 : res.status,
        googleStatus
      ),
    };
  }

  const data = (await res.json()) as GeminiResponse;
  if (data.promptFeedback?.blockReason) {
    return {
      error: new GeminiError(
        `El asistente bloqueó la solicitud (${data.promptFeedback.blockReason}).`,
        400,
        'SAFETY_BLOCKED'
      ),
    };
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('')
    .trim();

  if (!text) {
    return {
      error: new GeminiError('El asistente IA no devolvió contenido.', 502),
    };
  }
  return { text };
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

  const payload = {
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

  const models = getModels();
  let lastError: GeminiError | null = null;
  for (const model of models) {
    const { text, error } = await callOnce(model, apiKey, payload);
    if (text) return text;
    lastError = error ?? lastError;
    if (!error || !shouldFallback(error.status, error.googleStatus)) {
      // Error definitivo (ej: 400 prompt invalido), no tiene sentido seguir.
      throw error ?? new GeminiError('Error desconocido', 502);
    }
    // Si fue fallback, log y seguimos al siguiente modelo.
    console.warn(
      `[gemini] modelo ${model} fallo (${error.status}/${error.googleStatus}), probando siguiente...`
    );
  }

  throw (
    lastError ??
    new GeminiError(
      'Todos los modelos de Gemini fallaron. Reintentá en un momento.',
      503
    )
  );
}
