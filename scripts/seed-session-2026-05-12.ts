/* eslint-disable no-console */
// Carga env con la MISMA logica que `next dev`. Import dinamico de prisma
// para que se evalue DESPUES de loadEnvConfig — si fuera estatico, Prisma
// se inicializaria sin DATABASE_URL.
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

/**
 * Seed de la sesion 2026-05-12: /ver, aporte user-embed + panel admin.
 *
 * Inserta los `ChangelogItem` de los 6 commits `ver iter 1-6` en DB.
 * Los comments de progreso en FeatureRequest #109/#110/#111 ya los hizo
 * `scripts/comment-ver-agregar-progress.ts`.
 *
 * Uso: `npx tsx scripts/seed-session-2026-05-12.ts`
 */
async function main() {
  const { prisma } = await import('../src/lib/database');

  const version = '2026-05-12';
  const versionLabel = '/ver: aporte user-embed + moderacion admin';

  const changelogItems = [
    {
      category: 'Features',
      body: 'Nueva ruta /ver/agregar (login-gated): cualquier user logueado pega URL de canal oficial (YouTube/Vimeo/Bilibili/Dailymotion) y la IA precarga title/year/country/synopsis/cast/productora/idiomas/subs/tags/genres. Confianza expuesta (high/medium/low) + warnings si Gemini fallo o devolvio JSON dudoso. Form editable antes de confirmar; al guardar aparece al instante en /ver con badge @nickname.',
      sortOrder: 0,
    },
    {
      category: 'Features',
      body: 'Helper buildEmbedPreview en src/lib/user-embed-preview.ts: oEmbed nativo de cada plataforma para title/channel/thumbnail confiables, Gemini con shape JSON estricta para el resto. Plataformas no soportadas (Netflix, TikTok, etc.) → 422. Fallback si Gemini falla: warning + suggested con solo rawTitle.',
      sortOrder: 1,
    },
    {
      category: 'Features',
      body: 'Panel admin /admin/series/user-submitted: tabla de aportes con thumb, @submitter, plataformas, embeds, visibility. Acciones HIDE/SHOW (oculta de /ver post-hoc sin borrar), DELETE (cascade), LINK con una serie CURATED (transaccion que mueve Episodes con embedUrl al Season equivalente del target, crea Season si falta, enriquece episode destino sin embed, y borra el aporte). Nuevo item "Aportes" en AdminNav (groupCatalog).',
      sortOrder: 2,
    },
    {
      category: 'Features',
      body: 'Dedupes + rate limit en /api/user/series/embed/confirm: dedupe global por Episode.embedUrl (409 redirige al existente), dedupe submitter+title+year, max 5 aportes/h y 20/dia por user (429 + Retry-After). Helper en src/lib/rate-limit.ts.',
      sortOrder: 3,
    },
    {
      category: 'Schema',
      body: 'Migration add_series_origin_visibility_submittedby: campos nuevos Series.origin (CURATED|USER_EMBED), Series.visibility (VISIBLE|HIDDEN), Series.submittedById + relacion User.submittedSeries. Indices (origin,visibility) y (submittedById,createdAt). Defaults preservan todo el catalogo existente como CURATED+VISIBLE.',
      sortOrder: 4,
    },
    {
      category: 'Fixes',
      body: 'Anti-leak transversal: series USER_EMBED ya no aparecen en /catalogo, /series/[id], homepage, /novedades, /actores/[id], /tags/[id], sitemap-series, /api/series, /api/search, /api/stats/public (incluso queries raw SQL). Listings de actores/tags filtran _count.series por curadas (cero contaminacion). /ver y sitemap-ver SI las incluyen si visibility=VISIBLE.',
      sortOrder: 5,
    },
    {
      category: 'Fixes',
      body: 'VerSerieClient: badge "Aporte de @user" cuando origin=USER_EMBED; oculta el link a /series/[id] (esa pagina da 404 para user-embed); reemplaza el boton "Mover a catalogo" admin por "Linkear con curada" → /admin/series/user-submitted. Fix flicker auth (espera status==="authenticated" antes de mostrar acciones admin).',
      sortOrder: 6,
    },
    {
      category: 'Fixes',
      body: 'Endpoints rechazo 422 para USER_EMBED: POST /api/series/[id]/subscribe y POST /api/reviews. No se puede suscribir ni resenar un aporte hasta que admin lo linkea con una serie curada.',
      sortOrder: 7,
    },
    {
      category: 'UX',
      body: '/ver VerPage: CTA "Agregar una serie" en hero (solo authenticated). Toggle "Solo curadas por Flor" en filtros. Badge @nickname en cards user-embed.',
      sortOrder: 8,
    },
    {
      category: 'i18n',
      body: 'Nuevas keys adminNav.userEmbed / userEmbedShort en shape + 10 locales (es/en/it/de/fr/ja/ko/zh-CN/zh-TW/th).',
      sortOrder: 9,
    },
  ];

  let added = 0;
  let skipped = 0;
  for (const item of changelogItems) {
    const existing = await prisma.changelogItem.findFirst({
      where: { version, sortOrder: item.sortOrder },
      select: { id: true },
    });
    if (existing) {
      console.log(`[skip] ChangelogItem #${existing.id} (sortOrder ${item.sortOrder}) ya existe`);
      skipped++;
      continue;
    }
    const created = await prisma.changelogItem.create({
      data: {
        version,
        versionLabel,
        category: item.category,
        body: item.body,
        sortOrder: item.sortOrder,
      },
    });
    console.log(`[add] ChangelogItem #${created.id}: ${item.category}`);
    added++;
  }

  console.log();
  console.log(`Resumen: ${added} agregados, ${skipped} skipped (version ${version}).`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
