/* eslint-disable no-console */
// Carga env files con la MISMA logica que `next dev`. IMPORTANTE: el
// import de `../src/lib/database` se hace DINAMICO dentro de main()
// para que se evalue DESPUES de loadEnvConfig — si fuera estatico se
// hoistearia y Prisma se inicializaria sin DATABASE_URL.
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function main() {
  const { prisma } = await import('../src/lib/database');
  // ─── 1. Backlog: locales pendientes de regenerar ────────────────────
  const localesPendientes = await prisma.featureRequest.create({
    data: {
      title: 'Regenerar 4 locales restantes (de, zh-CN, zh-TW, th) via Gemini',
      description: [
        'Sesion 2026-05-10: se hizo una pasada de i18n grande (~75 keys nuevas en seriesHeader, profile.* y nuevo namespace achievements). Solo 4/8 locales fueron regenerados (it, fr, ja, ko).',
        '',
        'Los 4 restantes (de, zh-CN, zh-TW, th) NO se regeneraron porque el script scripts/translate-locales.ts tuvo fallos flaky en algunos batches: Gemini devolvia un array de N-1 strings cuando se le pedian N (consistente tras 3 retries en algun batch puntual).',
        '',
        'Mientras tanto las keys nuevas caen automaticamente al bloque `en` via el helper t() — funcional pero subideal para usuarios DE/ZH-CN/ZH-TW/TH.',
        '',
        'Para retomar:',
        '  npx tsx scripts/translate-locales.ts de',
        '  npx tsx scripts/translate-locales.ts zh-CN',
        '  npx tsx scripts/translate-locales.ts zh-TW',
        '  npx tsx scripts/translate-locales.ts th',
        '',
        'Mejora del script (opcional pero util): hacer fallback a sub-batches mas chicos (ej. 20) cuando un batch de 40 falla 3 veces — eso evita abortar todo el locale por un edge case puntual.',
      ].join('\n'),
      type: 'bug',
      status: 'OPEN',
      priority: 'LOW',
    },
  });
  console.log(`✓ FeatureRequest #${localesPendientes.id}: locales pendientes`);

  // ─── 2. Backlog: score de completitud para series (admin) ──────────
  const scoreFeature = await prisma.featureRequest.create({
    data: {
      title: 'Admin: score de completitud (0-1000) para series',
      description: [
        'Mostrar en /admin (lista de series) un score que indique que tan completa esta la informacion de cada serie en el catalogo. Permite priorizar que series enriquecer.',
        '',
        '**Especificacion:**',
        '- 1000 puntos: TODOS los campos posibles de Series (y relaciones) rellenos',
        '- Score minimo si solo se cargo lo obligatorio: TBD (definir junto con el peso por campo)',
        '',
        '**Decisiones pendientes (TBD):**',
        '1. Que se considera "obligatorio" — minimo viable para que la serie aparezca en el catalogo (ej. titulo, año, tipo, country)',
        '2. Peso por campo — los campos basicos (synopsis, imageUrl, productionCompany, originalLanguage, format, basedOn) probablemente deberian valer mas que los nice-to-have (universe, soundtrack)',
        '3. Como cuentan las relaciones (actors, directors, tags, genres, dubbings, watchLinks) — binario "tiene al menos uno" vs incremental por cantidad',
        '4. Como cuentan las temporadas/episodios — un campo `episodeCount` por temporada, sinopsis por temporada, observaciones, etc.',
        '5. Donde mostrar el score: columna en la tabla de admin, badge en MediaCard, tooltip con desglose, o varias',
        '',
        '**Ideas de UX:**',
        '- Color por rango: rojo <300, amarillo 300-700, verde >700',
        '- Click en el score abre un panel con desglose de "que falta" para llegar a 1000',
        '- Filtro en /admin para ver "series con score < X"',
        '- Posiblemente ordenar /admin por score asc para encontrar las mas vacias',
        '',
        'Modelo afectado: src/lib/database.ts (helper getSeriesCompletenessScore), prisma/schema.prisma (NO requiere cambio si se calcula on-read), columnas en la tabla admin de series.',
      ].join('\n'),
      type: 'feature',
      status: 'OPEN',
      priority: 'MEDIUM',
    },
  });
  console.log(`✓ FeatureRequest #${scoreFeature.id}: score de completitud`);

  // ─── 3. Changelog: items de la sesion 2026-05-10 ───────────────────
  const version = '2026-05-10';
  const versionLabel = 'i18n + posicionamiento + bonus ESLint';

  const changelogItems = [
    {
      category: 'Fixes',
      body: 'Fix posicionamiento en /series/[id]: la nav de pestañas (sticky) quedaba tapada por el TopBar al scrollear. Ahora se ancla a `top: var(--header-height)` para que se acomode justo debajo. scroll-margin-top tambien sincronizado para que los anchors a secciones (Reseñas, Comentarios, Contenido) no caigan ocultos. Synopsis mobile recupero padding horizontal.',
      sortOrder: 0,
    },
    {
      category: 'i18n',
      body: 'Pasada de internacionalizacion sobre los archivos tocados en commits recientes de UX/visual. ~75 keys nuevas en `seriesHeader` (Director, Reparto, Con contenido/reseña), `profile.*` (overview/customize/section/settings cards) y nuevo namespace `achievements` (12 logros con name + descripcion). Componentes refactorizados a `t()`: SeriesHeader, CustomizeDrawer, ProfileOverviewClient, Achievements, CommentsPanel, SettingsRow, YearSummary.',
      sortOrder: 1,
    },
    {
      category: 'i18n',
      body: 'Locales regenerados via Gemini: it, fr, ja, ko (4/8). Pendientes: de, zh-CN, zh-TW, th — caen a `en` via fallback de `t()` hasta proxima regeneracion (ver backlog).',
      sortOrder: 2,
    },
    {
      category: 'Refactor',
      body: 'OVERVIEW_SECTIONS en `useSectionVisibility` paso de `label: string` a `labelKey: TranslationKey`. Esto permite que el array module-level use i18n (no puede llamar `t()` ahi). Consumidor (CustomizeDrawer) resuelve con `t(section.labelKey)`.',
      sortOrder: 3,
    },
    {
      category: 'Fixes',
      body: 'Bonus: error de ESLint `react-hooks/set-state-in-effect` en /perfil/dashboard resuelto derivando `loading` de `status + data + errored` en vez de llamar `setLoading()` sincrono dentro del effect. Comportamiento identico al usuario.',
      sortOrder: 4,
    },
    {
      category: 'Limpieza',
      body: 'Bonus: 14 imports/vars sin uso eliminados en /admin/feedback (Button, Pagination, Tooltip, Empty, Form, 6 iconos, type FeedbackType, state editingCase, hook useLocale, dos `const option` zombies en columns).',
      sortOrder: 5,
    },
  ];

  for (const item of changelogItems) {
    const created = await prisma.changelogItem.create({
      data: {
        version,
        versionLabel,
        category: item.category,
        body: item.body,
        sortOrder: item.sortOrder,
      },
    });
    console.log(`✓ ChangelogItem #${created.id} [${item.category}]`);
  }

  console.log('\n✓ Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
