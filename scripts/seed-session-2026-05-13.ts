/* eslint-disable no-console */
// Carga env con la MISMA logica que `next dev`. Import dinamico de prisma
// para que se evalue DESPUES de loadEnvConfig — si fuera estatico, Prisma
// se inicializaria sin DATABASE_URL.
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

/**
 * Seed de la sesion 2026-05-13: triage del backlog + slice 1 ejecutado.
 *
 * Inserta los `ChangelogItem` de los commits 43b4644 (slice 1) + fab2847
 * (SEO polish) + dbd78c0 (seed director-notes). El cierre de items via
 * `scripts/audit-2026-05-13.ts --apply` queda a cargo del usuario cuando
 * tenga DB up.
 *
 * Uso: `npx tsx scripts/seed-session-2026-05-13.ts`
 */
async function main() {
  const { prisma } = await import('../src/lib/database');

  const version = '2026-05-13';
  const versionLabel =
    'Triage backlog + slice 1 (score completitud + director links) + slice 2 (director rico fase 2)';

  const changelogItems = [
    {
      category: 'Features',
      body: 'Score de completitud para series (admin/editor): nueva CompletenessCard al tope del overview tab en /admin/series/[id]. Score 0-100 computado on-the-fly (sin migracion) con 10 campos pesados (synopsis 15, poster 15, cast 15, director 10, tags 10, review 10, soundtrack 10, country 5, year 5, originalTitle 5). Helper puro src/lib/series-completeness.ts. Tier visual (low/mid/high) con tone semantico + lista de campos faltantes como Chip con peso.',
      sortOrder: 0,
    },
    {
      category: 'Features',
      body: 'Directores: campos nuevos en el modelo Director — aliases (String[]), imdbUrl, mdlUrl, wikiUrl (String?). Migracion add_director_aliases_and_external_links. Editables desde el admin form (Select mode="tags" para aliases + 3 inputs URL con validacion). Render publico en /directores/[id]: Chip list de aliases debajo del nombre + nav de links externos con icono + label i18n.',
      sortOrder: 1,
    },
    {
      category: 'SEO',
      body: 'JSON-LD enriquecido en /directores/[id]: alternateName (aliases) + sameAs (IMDb/MDL/Wiki). JsonLd component con null guard runtime para no emitir <script> invalido si data viene null/undefined. /series/[id] sin cambios visibles (cleanup de dead var jsonLdData).',
      sortOrder: 2,
    },
    {
      category: 'SEO',
      body: 'Keywords mas SEO-friendly en layout.tsx: "series tailandesas/coreanas/japonesas" (en vez de "tailandes/coreano/japones") + "dramas BL" + "series LGBTQ+". robots.ts bloquea /scripts y /data — no son rutas reales del app pero algunos crawlers prueban estas convenciones; explicito es mejor.',
      sortOrder: 3,
    },
    {
      category: 'Tooling',
      body: 'scripts/triage-backlog-2026-05-13.ts: categoriza items OPEN por area funcional (10 cats: noticias/directores/ai/catalogo/perfil/admin/i18n/seo/cleanup/infra) + infiere effort/impact via keywords y longitud + marca quick wins (S+H, S+M, M+H). Persiste prefijo [cat:X][effort:Y][impact:Z] en description (sin migracion, idempotente, reversible). Modos --dry-run / --apply / --report (genera docs/backlog-triage-2026-05-13.md).',
      sortOrder: 4,
    },
    {
      category: 'Tooling',
      body: 'scripts/audit-2026-05-13.ts: deja audit comments idempotentes en items con cobertura parcial (#109/#110/#111 siguen OPEN — la evidencia confirma parcialidad post comment-ver-agregar-progress.ts) + crea 3 items COMPLETED para el trabajo de hoy (score completitud + director aliases + director links externos) con SHA del commit en description. Idempotente: dedupe por title (items) y marker (comments).',
      sortOrder: 5,
    },
    {
      category: 'i18n',
      body: 'Keys nuevas: completeness.* (12) + directorProfile.* (5) + adminDirectors extra (9: fieldAliases/fieldImdbUrl/fieldMdlUrl/fieldWikiUrl + hints + invalidUrl). TranslationShape + es + en actualizados. Los 8 locales restantes (it/de/fr/ja/ko/zh-CN/zh-TW/th) tolerados via `as TranslationShape` cast — correr `scripts/translate-missing-keys.ts` para traducir.',
      sortOrder: 6,
    },
    {
      category: 'Docs',
      body: 'context.md: nueva seccion "Backlog (FeatureRequest)" con triage 2026-05-13 + scripts + slice 1. /home/juanparedez/.claude/plans/hagamos-un-relevamiento-general-glimmering-shannon.md: plan completo del relevamiento + roadmap (slice 2: director rico fase 2, command palette, push UI; slice 3: IMDB/MDL precarga, UserList, achievements).',
      sortOrder: 7,
    },
    {
      category: 'Features',
      body: 'Slice 2 (#0c726b9) - Director rico fase 2: campos Director.birthYear (Int?) + Director.awards (String[]) sumados al schema. Admin form acepta los nuevos campos. En /directores/[id]: chip de año de nacimiento con CalendarOutlined, seccion "Premios" con icono trofeo + lista bullet, y seccion "Obras destacadas" entre el header y la filmografia.',
      sortOrder: 8,
    },
    {
      category: 'Features',
      body: 'Obras destacadas en /directores/[id] (slice 2): seccion auto-derivada del top 3 series del director por overallRating. Solo aparece si al menos 2 series tienen rating cargado (no inventa data). Cards con borde gold + tag de rating destacado. Idea: si mas adelante queremos curaduria manual, agregar SeriesDirector.featured boolean (sin necesidad hoy).',
      sortOrder: 9,
    },
    {
      category: 'SEO',
      body: 'JSON-LD de /directores/[id] (slice 2): suma birthDate (año) + award (lista de premios) al Person schema. Junto con alternateName (aliases) y sameAs (IMDb/MDL/Wiki) del slice 1, el schema Person queda completo para crawlers.',
      sortOrder: 10,
    },
    {
      category: 'i18n',
      body: 'Slice 2: 7 keys nuevas en TranslationShape + es + en (adminDirectors.fieldBirthYear/fieldAwards/hintBirthYear/hintAwards + directorProfile.birthYear/awardsTitle/featuredWorksTitle). Interpolacion {year} en directorProfile.birthYear.',
      sortOrder: 11,
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
