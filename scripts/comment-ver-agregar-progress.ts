import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

/**
 * Deja comentarios de progreso en #109, #110, #111 documentando que el flow
 * /ver/agregar (user-embed) cubre parcialmente cada item. La parte admin
 * (crear PERSONAL con AI, IMDB/MDL fetch) queda pendiente.
 *
 * Idempotente: skip si ya existe un comment con `marker`.
 *
 * Uso: `npx tsx scripts/comment-ver-agregar-progress.ts`
 */

const MARKER = '[ver-iter 2026-05-12]';

interface Entry {
  featureRequestId: number;
  body: string;
}

const ENTRIES: Entry[] = [
  {
    featureRequestId: 109,
    body: `${MARKER} Cobertura parcial — lado USER_EMBED implementado en ver iter 1-6 (commits 60e35fd → cdd66db).

Hecho:
- Nueva ruta /ver/agregar (login-gated): pegar URL YouTube/Vimeo/Bilibili/Dailymotion → buildEmbedPreview(url) autopobla title/year/country/synopsis/actors/productionCompany/languages/dubs/tags/genres via Gemini → form editable → POST /api/user/series/embed/confirm crea Series con origin=USER_EMBED, visibility=VISIBLE, catalogScope=WATCHABLE_ONLY, submittedById=user.id.
- Dedupe global por embedUrl (409 → redirige al existente), dedupe submitter+title+year, rate limit 5/h y 20/dia, validacion de plataforma (422 para Netflix u otros sin embed).

Pendiente para este item:
- Lado admin (catalogScope=PERSONAL CURATED): pagina nueva o boton "Agregar con AI" en /admin/series/nueva que reuse buildEmbedPreview pero acepte tambien IMDB id / MDL slug / titulo libre (#111 lo cubre).
- Mock style-guide/new-seri-mock.png pendiente de implementar para el flow admin.`,
  },
  {
    featureRequestId: 110,
    body: `${MARKER} Cobertura parcial — Gemini integrado en /ver/agregar (commits 016abe1, 26e135f).

Helper src/lib/user-embed-preview.ts arma EmbedPreview con shape JSON estricta (title, originalTitle, year, countryCode ISO-2, synopsis, actorNames[], productionCompanyName, originalLanguageName, dubbingLanguageNames[], tagNames[], genreNames[], confidence). Llamada con temperature:0.3, thinkingBudget:0. Fallback si Gemini falla: warning + suggested con solo rawTitle. Cliente muestra confianza (high/medium/low) y warnings antes de confirmar.

Pendiente para este item:
- Boton "AI fill" en SeriesForm admin (/admin/series/[id]/editar) que rellene campos vacios sin pisar lo cargado — esto es lo que pide #92 explicitamente.
- Validacion semantica: chequear coherencia year/country, detectar duplicados/variantes con el mismo titulo.
- Sugerir tags/generos a partir de synopsis + canal (ya hace algo pero no tiene auto-suggest interactivo en el form).`,
  },
  {
    featureRequestId: 111,
    body: `${MARKER} Cobertura parcial — YouTube/Vimeo/Bilibili/Dailymotion oEmbed implementado para single URL en ver iter 2 (commit 016abe1).

buildEmbedPreview(url) usa oEmbed nativo de cada plataforma para title/channel/thumbnail confiables, y Gemini sobre rawTitle+channel para autopoblado del resto.

Pendiente para este item:
- Fuentes externas: IMDB id, MyDramaList slug, titulo libre con Gemini grounding (web search).
- YouTube playlist URL ya cubierto desde antes en /admin/series/importar (preexistente).
- Endpoints especificos para cada fuente: /api/user/series/discover?source=imdb&id=tt... o similar.

Stack sugerido: Gemini grounding (que ya hace web search nativo) seria lo mas limpio; scraping directo de IMDB/MDL solo si necesitamos campos especificos que Gemini no devuelve.`,
  },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // Necesitamos un userId para autorear los comments. Usamos el primer ADMIN
  // (Juan, que es quien corre el script).
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN', email: 'juanjparedez@gmail.com' },
    select: { id: true },
  });
  if (!admin) {
    console.error('No se encontro admin Juan en la DB.');
    process.exit(1);
  }

  let added = 0;
  let skipped = 0;
  for (const entry of ENTRIES) {
    const existing = await prisma.featureRequestComment.findFirst({
      where: {
        featureRequestId: entry.featureRequestId,
        body: { contains: MARKER },
      },
      select: { id: true },
    });
    if (existing) {
      console.log(
        `[skip] #${entry.featureRequestId}: ya tiene comment con marker.`
      );
      skipped++;
      continue;
    }
    await prisma.featureRequestComment.create({
      data: {
        featureRequestId: entry.featureRequestId,
        userId: admin.id,
        body: entry.body,
      },
    });
    console.log(`[add] #${entry.featureRequestId}: comment de progreso.`);
    added++;
  }

  console.log();
  console.log(`Resumen: ${added} agregados, ${skipped} skipped.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
