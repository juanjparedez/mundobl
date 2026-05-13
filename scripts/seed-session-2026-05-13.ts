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
    {
      category: 'Fixes',
      body: 'Migration que faltaba (#2c9167d): los commits del slice 1 y 2 agregaron 6 columnas nuevas al modelo Director (aliases, imdbUrl, mdlUrl, wikiUrl, birthYear, awards) pero las migration files nunca se generaron (no habia DB local). En prod: Prisma Client SELECTea las columnas, DB sigue con schema viejo → /series/1 crashea (digest 3266671265). Generada y commiteada migration `add_director_aliases_links_birth_awards`. Para aplicar: `npm run migrate:supabase`.',
      sortOrder: 12,
    },
    {
      category: 'Fixes',
      body: 'Catalogo - bloque "card universo se ve raro al expandir" (#6300c47 + #60cb9d0): el .universe-expand-panel tenia position:absolute top:100% z-index:10 — flotaba sobre la siguiente fila del grid tapando otras cards. Cambiado a flujo normal: el panel crece dentro del wrapper, el grid ajusta la altura de la fila al card mas alto. Comportamiento consistente con +info de single cards.',
      sortOrder: 13,
    },
    {
      category: 'Fixes',
      body: 'Catalogo - paginacion (#5f75f0e + #f7e1ffb + #2a34a5a): cierra ticket de Flor "Volver al catalogo en la pagina correcta". currentPage ahora se sincroniza con ?page=N en URL. Click en pagina hace router.push (genera back entry — page 1→2→5 + back retorna a 2). Cambio de filtro hace router.replace (no infla history con cada keystroke). Nuevo useEffect [searchParams] sincroniza state ← URL para que browser back/forward/backspace actualicen el contenido visible. Tambien (#5f75f0e) Pagination duplicado arriba del grid (otro ticket de Flor "numero de paginas arriba").',
      sortOrder: 14,
    },
    {
      category: 'Features',
      body: 'NavigationGuard global (#27bf01c): nuevo componente client montado en root layout que garantiza que el back nativo del browser (o swipe-back de mobile) siempre tenga destino interno. Si referrer es externo, inyecta el "parent logico" en history (mapa: /series/[id] → /catalogo, /directores/[id] → /catalogo, /noticias/X → /noticias, /admin/X/[id] → /admin/X, /perfil/* → /perfil, home secciones → /). Idempotente via state marker + sessionStorage flag por tab.',
      sortOrder: 15,
    },
    {
      category: 'Features',
      body: 'BackToCatalogButton (#5f75f0e + #27bf01c): boton "← Volver al catalogo" arriba del breadcrumb en /series/[id]. Si referrer es /catalogo (mismo origen), llama router.back() preservando ?page=N. Sino, router.push("/catalogo"). i18n: seriesDetail.backToCatalog (es + en).',
      sortOrder: 16,
    },
    {
      category: 'Fixes',
      body: 'Catalogo - estado expandido reescrito (#5a27bf8): unificado expandedInfoCardId (string|null + sessionStorage) y expandedUniverses (Set<number> + sessionStorage) en un solo expandedItemKey (string|null sin storage). Keys: "serie-${id}" o "universe-${id}". Resultado: solo una card expandida a la vez (single o universo), abrir una cierra la otra, F5/cerrar pestaña/ir a /series/X y volver = todo cerrado. Coherente con como ya funcionaban los single cards. -72/+19 lineas.',
      sortOrder: 17,
    },
    {
      category: 'SEO',
      body: 'SEO polish (#fab2847): layout.tsx keywords mas SEO-friendly ("series tailandesas/coreanas/japonesas" en vez de gentilicios solos, + "dramas BL" + "series LGBTQ+"). robots.ts bloquea /scripts y /data (no son rutas reales del app pero crawlers prueban). JsonLd.tsx con null guard runtime.',
      sortOrder: 18,
    },
    {
      category: 'Tooling',
      body: 'audit-2026-05-13.ts ampliado (#TBD): nueva seccion CLOSE_BY_TITLE para cerrar tickets existentes en DB por titulo (en vez de ID — porque los tickets de Flor estan creados via UI y no conocemos los IDs localmente). Marca COMPLETED a "Volver al catalogo" (Flor) y "numero de paginas" (Flor) referenciando commits 5f75f0e + 2a34a5a. Nuevos items NEW_ITEMS COMPLETED para los fixes que no tenian tickets previos: visual universe panel, NavigationGuard, push/replace en pagination, URL sync.',
      sortOrder: 19,
    },
    {
      category: 'Features',
      body: 'Toolbar de filtros en /feedback tab "Ideas y Bugs" (#f6e1cfd): tenia 81 solicitudes activas sin filtros — imposible navegar. Suma search instant (sobre title+description), chips multi-toggle por tipo (bug/feature/idea) y por status (default: solo OPEN+IN_PROGRESS para "ocultar cerradas"; togglear COMPLETED/REJECTED para verlas mezcladas), sort dropdown (mas recientes / mas votadas / mas comentadas), contador dinamico "X de Y" cuando hay filtro. Empty state diferenciado segun causa. Responsive: <640px todo en columna.',
      sortOrder: 20,
    },
    {
      category: 'Fixes',
      body: 'Backlog review 5 bug tickets (#69007f4): (1) dashboardKey v5→v6 en DashboardClient.tsx — invalida layouts cached con widgets borrados en iter 18-19. (2) 15 i18n keys orphan eliminadas del shape + es + en (profileDashboard.widgetOverview/Desc/Ratings/RatingsDesc + profile.overviewYearTotalHoursLabel + 5 pares profile.settingsCard{X}{Title,Desc}); 6 keys MANTENIDAS (siguen usadas). Cast `as TranslationShape` → `as unknown as TranslationShape` en 8 locales y en scripts translate-{locales,missing-keys}.ts (la separacion shape vs locales crecio). 3 tickets verificados y cerrados sin trabajo: episodios title+duration ya implementado en EpisodesList.tsx, empty space /perfil obsoleto (estructura cambio), audit i18n regresiones sin hallazgos.',
      sortOrder: 21,
    },
    {
      category: 'Refactor',
      body: '/feedback toolbar reusa primitivos del design-system (#031cc2b): <div className="feedback-toolbar"> + CSS custom → <PanelCard padding="md">; <Tag.CheckableTag> → <Chip pressed={active} onClick={...}>. PanelCard provee chrome visual (padding/border/bg/radius); Chip provee aria-pressed styling (primary-color cuando pressed). -60/+64 lineas net. Alinea con CLAUDE.md "preferir design-system antes de inventar". Cualquier cambio futuro a PanelCard/Chip se propaga gratis.',
      sortOrder: 22,
    },
    {
      category: 'Fixes',
      body: '/feedback empty .feedback-card__actions div (#031cc2b): el div se renderizaba siempre, incluso vacio (todos los children son condicionales userId&& / isAdmin&&). Para usuarios anonimos quedaba un flex-child 0x0 en el footer derecho. Wrap del div en `{(userId || isAdmin) && (...)}` — si no hay acciones, no se renderiza el div. Layout consistente para anonimos vs admins. Resuelve la percepcion del usuario de "ultimo card cortado".',
      sortOrder: 23,
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
