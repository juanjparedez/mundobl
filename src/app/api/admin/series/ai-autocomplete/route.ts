import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { generateText, GeminiError } from '@/lib/gemini';
import { prisma } from '@/lib/database';

interface AutocompletePayload {
  title?: string;
  originalTitle?: string;
  year?: number;
  country?: string;
  type?: string;
  currentSynopsis?: string;
  scope?:
    | 'all'
    | 'synopsis'
    | 'info'
    | 'genres_tags'
    | 'cast'
    | 'directors'
    | 'production';
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(['ADMIN', 'MODERATOR']);
    if (!auth.authorized) return auth.response;

    const body = (await request
      .json()
      .catch(() => ({}))) as AutocompletePayload;
    const {
      title,
      originalTitle,
      year,
      country,
      type,
      currentSynopsis,
      scope = 'all',
    } = body;

    const searchSubject = [title, originalTitle].filter(Boolean).join(' / ');
    if (!searchSubject.trim()) {
      return NextResponse.json(
        {
          error:
            'Debes ingresar al menos el título de la serie para autocompletar con IA.',
        },
        { status: 400 }
      );
    }

    // Traer referencias existentes de la base de datos para alinear resultados
    const [countries, genres, tags, productionCompanies, languages] =
      await Promise.all([
        prisma.country.findMany({ select: { id: true, name: true } }),
        prisma.genre.findMany({ select: { name: true } }),
        prisma.tag.findMany({ select: { name: true } }),
        prisma.productionCompany.findMany({ select: { name: true } }),
        prisma.language.findMany({ select: { name: true } }),
      ]);

    const countryNames = countries.map((c) => c.name).join(', ');
    const genreNames = genres
      .map((g) => g.name)
      .slice(0, 30)
      .join(', ');
    const tagNames = tags
      .map((t) => t.name)
      .slice(0, 40)
      .join(', ');
    const companyNames = productionCompanies
      .map((pc) => pc.name)
      .slice(0, 30)
      .join(', ');
    const langNames = languages
      .map((l) => l.name)
      .slice(0, 20)
      .join(', ');

    const systemInstruction = `Eres un asistente experto en series, películas y dramas asiáticos e internacionales (con especialización en dramas BL, GL, romances, dramas juveniles y producciones de Tailandia, Corea del Sur, Japón, Taiwán, China, Filipinas, etc.).

Tu tarea es investigar la producción audiovisual indicada y devolver un objeto JSON estructurado en español con datos verídicos y precisos.

Sugerencias de catálogo existente en la base de datos:
- Países: ${countryNames}
- Géneros de referencia: ${genreNames}
- Tags de referencia: ${tagNames}
- Productoras de referencia: ${companyNames}
- Idiomas: ${langNames}

Formato JSON estricto requerido según el scope solicitado:
${
  scope === 'synopsis'
    ? `{
  "synopsis": "Sinopsis atractiva, fluida, profesional y completa en español (sin spoilers graves, de 2 a 4 párrafos bien redactados)."
}`
    : scope === 'cast'
      ? `{
  "actors": [
    { "name": "Nombre Actor 1", "characterName": "Nombre Personaje 1", "isMain": true },
    { "name": "Nombre Actor 2", "characterName": "Nombre Personaje 2", "isMain": true }
  ]
}`
      : scope === 'directors'
        ? `{
  "directors": [
    { "name": "Nombre Director 1" }
  ]
}`
        : scope === 'genres_tags'
          ? `{
  "genres": ["Romance", "Drama", "Comedia"],
  "tags": ["Enemies to Lovers", "Universidad", "Música"]
}`
          : scope === 'production'
            ? `{
  "productionCompany": "Productora o canal principal (ej. GMMTV, Domundi, Studio Wabi Sabi, Be On Cloud, TV Asahi, Me Mind Y, etc.)",
  "originalLanguage": "Idioma original (ej. Tailandés, Coreano, Japonés, Chino Mandarín, Tagalo, Inglés, etc.)",
  "basedOn": "Tipo de obra original si aplica (ej. Novela, Manga, Manhwa, Webtoon, Corto, Original)",
  "airDays": ["Lunes", "Viernes"]
}`
            : scope === 'info'
              ? `{
  "title": "Título oficial o más conocido en español/inglés",
  "originalTitle": "Título en idioma nativo (ej. tailandés, hangul, kanji o pinyin)",
  "type": "serie" | "pelicula" | "corto" | "especial",
  "year": 2024,
  "countryName": "Nombre del país de origen (elige preferentemente entre: ${countryNames})",
  "airDays": ["Lunes", "Viernes"]
}`
              : `{
  "title": "Título oficial o más conocido en español/inglés",
  "originalTitle": "Título en idioma nativo (ej. tailandés, hangul, kanji o pinyin)",
  "type": "serie" | "pelicula" | "corto" | "especial",
  "year": 2024,
  "countryName": "Nombre del país de origen (elige preferentemente entre: ${countryNames})",
  "productionCompany": "Productora o canal principal (ej. GMMTV, Domundi, Studio Wabi Sabi, Be On Cloud, TV Asahi, Me Mind Y, etc.)",
  "originalLanguage": "Idioma original (ej. Tailandés, Coreano, Japonés, Chino Mandarín, Tagalo, Inglés, etc.)",
  "basedOn": "Tipo de obra original si aplica (ej. Novela, Manga, Manhwa, Webtoon, Corto, Original)",
  "synopsis": "Sinopsis atractiva, fluida y completa en español (sin spoilers graves, 2 a 4 párrafos bien redactados).",
  "airDays": ["Lunes", "Viernes"],
  "genres": ["Romance", "Drama", "Comedia"],
  "tags": ["Enemies to Lovers", "Universidad", "Música"],
  "observations": "Información adicional de interés (ej. novela en la que se basa, autor/a, plataformas oficiales de emisión).",
  "actors": [
    { "name": "Nombre Actor 1", "characterName": "Nombre Personaje 1", "isMain": true },
    { "name": "Nombre Actor 2", "characterName": "Nombre Personaje 2", "isMain": true }
  ],
  "directors": [
    { "name": "Nombre Director" }
  ]
}`
}`;

    const prompt = `Investiga la siguiente producción audiovisual y completa los datos para el scope "${scope}":
Título de búsqueda: "${searchSubject}"
${year ? `Año aproximado: ${year}` : ''}
${country ? `País indicado: ${country}` : ''}
${type ? `Tipo: ${type}` : ''}
${currentSynopsis ? `Sinopsis actual de referencia: "${currentSynopsis}"` : ''}

Recuerda responder ÚNICAMENTE con el objeto JSON válido.`;

    const aiResultRaw = await generateText({
      systemInstruction,
      prompt,
      temperature: scope === 'synopsis' ? 0.4 : 0.2,
      responseMimeType: 'application/json',
      thinkingBudget: 0,
      tools: [{ googleSearch: {} }],
    });

    let aiData: {
      title?: string;
      originalTitle?: string;
      type?: string;
      year?: number;
      countryName?: string;
      productionCompany?: string;
      originalLanguage?: string;
      basedOn?: string;
      synopsis?: string;
      airDays?: string[];
      genres?: string[];
      tags?: string[];
      observations?: string;
      actors?: Array<{
        name: string;
        characterName?: string;
        isMain?: boolean;
      }>;
      directors?: Array<{ name: string }>;
    };

    try {
      aiData = JSON.parse(aiResultRaw);
    } catch {
      return NextResponse.json(
        { error: 'No se pudo procesar la respuesta del modelo IA' },
        { status: 502 }
      );
    }

    // Resolver countryId a partir de countryName
    let matchedCountryId: number | null = null;
    if (aiData.countryName) {
      const normalizedCountry = aiData.countryName.toLowerCase().trim();
      const match = countries.find(
        (c) =>
          c.name.toLowerCase() === normalizedCountry ||
          c.name.toLowerCase().includes(normalizedCountry) ||
          normalizedCountry.includes(c.name.toLowerCase())
      );
      if (match) matchedCountryId = match.id;
    }

    // Normalizar type
    let normalizedType = 'serie';
    if (aiData.type) {
      const tLower = aiData.type.toLowerCase();
      if (tLower.includes('pel') || tLower.includes('movi'))
        normalizedType = 'pelicula';
      else if (tLower.includes('cort')) normalizedType = 'corto';
      else if (tLower.includes('esp')) normalizedType = 'especial';
      else normalizedType = 'serie';
    }

    return NextResponse.json({
      title: aiData.title || title,
      originalTitle: aiData.originalTitle || originalTitle,
      type: normalizedType,
      year: typeof aiData.year === 'number' ? aiData.year : year || null,
      countryId: matchedCountryId,
      countryName: aiData.countryName || null,
      productionCompany: aiData.productionCompany || null,
      originalLanguage: aiData.originalLanguage || null,
      basedOn: aiData.basedOn ? [aiData.basedOn] : [],
      synopsis: aiData.synopsis || null,
      airDays: Array.isArray(aiData.airDays) ? aiData.airDays : [],
      genres: Array.isArray(aiData.genres) ? aiData.genres : [],
      tags: Array.isArray(aiData.tags) ? aiData.tags : [],
      observations: aiData.observations || null,
      actors: Array.isArray(aiData.actors) ? aiData.actors : [],
      directors: Array.isArray(aiData.directors) ? aiData.directors : [],
    });
  } catch (error) {
    if (error instanceof GeminiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error('Error en autocomplete con IA:', error);
    return NextResponse.json(
      { error: 'Error al consultar el asistente IA' },
      { status: 500 }
    );
  }
}
