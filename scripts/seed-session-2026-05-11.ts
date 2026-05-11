/* eslint-disable no-console */
// Carga env files con la MISMA logica que `next dev`. IMPORTANTE: el
// import de `../src/lib/database` se hace DINAMICO dentro de main()
// para que se evalue DESPUES de loadEnvConfig — si fuera estatico se
// hoistearia y Prisma se inicializaria sin DATABASE_URL.
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function main() {
  const { prisma } = await import('../src/lib/database');

  // ─── 1. Backlog: bump dashboardKey post-cleanup ─────────────────────
  const bumpKey = await prisma.featureRequest.create({
    data: {
      title: 'Bump dashboardKey de v5 → v6 (post-cleanup widgets)',
      description: [
        'En la sesion 2026-05-11 se borraron 6 widgets del registry (SettingsRow, Overview, Ratings, YearSummary, ReviewsActivity, FollowedTitles). Los users que tenian layouts cached en localStorage con esos IDs van a ver slots vacios o "Missing widget: profile.X" en su grid.',
        '',
        'Fix: bumpear `dashboardKey` en src/app/perfil/dashboard/DashboardClient.tsx de:',
        '    const dashboardKey = `profile-${...}-${mode}-v5`;',
        'a:',
        '    const dashboardKey = `profile-${...}-${mode}-v6`;',
        '',
        'Esto invalida los layouts cached y aplica los nuevos defaults (que ya no incluyen los widgets borrados). Cambio de 1 caracter.',
        '',
        'No hacerlo no rompe nada — el DashboardGrid maneja "missing widget" con un fallback visual — pero queda feo para los users existentes.',
      ].join('\n'),
      type: 'bug',
      status: 'OPEN',
      priority: 'HIGH',
    },
  });
  console.log(`✓ FeatureRequest #${bumpKey.id}: bump dashboardKey v6`);

  // ─── 2. Backlog: limpiar i18n keys huerfanas ────────────────────────
  const i18nCleanup = await prisma.featureRequest.create({
    data: {
      title: 'Limpiar i18n keys huerfanas post-cleanup de /perfil',
      description: [
        'Tras los iters 18-19 (que borraron 6 widgets duplicados), quedaron i18n keys en messages.ts y los 10 locales que ya no tiene consumer en el codigo.',
        '',
        '**Keys huerfanas confirmadas:**',
        '- profileDashboard.widgetOverview / widgetOverviewDesc',
        '- profileDashboard.widgetRatings / widgetRatingsDesc',
        '- profile.sectionYearSummary',
        '- profile.overviewYearTotalHoursLabel (era usado por YearSummary)',
        '- profile.sectionReviewsActivity',
        '- profile.sectionFollowedTitles',
        '- profile.sectionSettings (todavia usado por ProfileSettings header — REVISAR antes de borrar)',
        '- profile.settingsCardPublicNameTitle/Desc (todas las 6 cards del SettingsRowWidget)',
        '- profile.settingsCardAppearanceTitle/Desc',
        '- profile.settingsCardSessionsTitle/Desc',
        '- profile.settingsCardPrivacyTitle/Desc',
        '- profile.settingsCardDangerTitle/Desc',
        '- profile.settingsCardNotificationsTitle/Desc (esta SI sigue usada por ProfileSettings — el nuevo card "Notificaciones" que agregue iter 18)',
        '',
        '**Proceso:**',
        '1. Hacer grep en src/ por cada key para confirmar zero consumers (las que aun se usan se mantienen).',
        '2. Borrar del shape `TranslationShape` en messages.ts.',
        '3. Borrar del bloque `es` y `en`.',
        '4. Correr `npx tsx scripts/translate-missing-keys.ts` (NO regenera lo que no existe — los locales tendran keys extras pero no rompen nada). Mejor: regenerar los 10 locales con `scripts/translate-locales.ts` para que tengan exactamente las keys correctas.',
        '',
        '**Riesgo:** bajo. tsc no falla por keys extras en locales (solo por keys faltantes). Borrar del shape ES suficiente para que tsc nos avise si quedo algun consumer.',
      ].join('\n'),
      type: 'bug',
      status: 'OPEN',
      priority: 'LOW',
    },
  });
  console.log(`✓ FeatureRequest #${i18nCleanup.id}: i18n cleanup`);

  // ─── 3. Backlog: unificar GenresDonut + TopGenresList ────────────────
  const genresWidget = await prisma.featureRequest.create({
    data: {
      title: 'Unificar GenresDonut + TopGenresList en un solo widget con viz toggle',
      description: [
        'Hoy tenemos 2 widgets que muestran exactamente la misma data (`stats.topGenres`) con viz distinta:',
        '- GenresDonutWidget: donut chart con top 6 + total al centro',
        '- TopGenresListWidget: lista vertical con barras de progreso (top 8 + counts exactos)',
        '',
        'En el iter 19 los dejamos a ambos porque son COMPLEMENTARIOS — el donut para visual rapido, la list para ver counts exactos. Pero son 2 entradas separadas en el WidgetPickerDrawer, lo que duplica el espacio mental del user.',
        '',
        '**Mejor solucion:** un solo widget "Generos" con un toggle interno (viz: donut | list). El user elige cual ver. Persisten el viz mode en localStorage (`widget-genres-viz: donut | list`).',
        '',
        '**Implementacion:**',
        '1. Nuevo `GenresWidget.tsx` que renderea uno u otro segun state local.',
        '2. Toggle en el Widget actions (`<Segmented>` chiquito con 2 opciones).',
        '3. Borrar GenresDonutWidget + TopGenresListWidget folders.',
        '4. WIDGET_IDS.genres y .topGenresList se consolidan en uno (`genres`). Bumpear dashboardKey.',
        '',
        '**Patron reusable:** este mismo patron sirve despues para Countries (TopCountries + WorldMap), Years (CompletedByYear chart + KPI). Cada uno con 2 viz alternativas. Refactor mas grande pero deja el dashboard mas limpio y "pro".',
      ].join('\n'),
      type: 'feature',
      status: 'OPEN',
      priority: 'MEDIUM',
    },
  });
  console.log(`✓ FeatureRequest #${genresWidget.id}: unificar Genres widgets`);

  // ─── 4. Backlog: rutas dedicadas para Collections items ──────────────
  const collectionsRoutes = await prisma.featureRequest.create({
    data: {
      title: 'Crear rutas /favoritos /retomar /abandonadas (listas completas)',
      description: [
        'En iter 15 se borro /perfil/clasico que era el destino de los links de CollectionsWidget para los items "Favoritos", "Para volver a ver" y "Abandonadas". Ahora esos items se renderean como display-only (item--static, sin href, no clickables).',
        '',
        'Solo "Viendo ahora" tiene ruta dedicada (/watching, ya existe).',
        '',
        '**Falta crear:**',
        '- /favoritos: lista filtrada de UserFavorite del usuario logueado.',
        '- /retomar: lista filtrada por ViewStatus=RETOMAR.',
        '- /abandonadas: lista filtrada por ViewStatus=ABANDONADA.',
        '',
        'Cada una similar a /watching: AppLayout + grid de MediaCards + tal vez sorting/filtering.',
        '',
        '**Despues:**',
        '- En CollectionsWidget, agregar `href` de vuelta a los items correspondientes.',
        '- Quitar el modifier `overview-collections__item--static` (la variante para items non-clickable).',
        '',
        '**API:** ya existe /api/user/profile que devuelve favorites + counts. Las nuevas paginas pueden hacer fetch al mismo endpoint o crear endpoints especificos /api/user/favorites, /api/user/rewatch, /api/user/abandoned con paginacion.',
      ].join('\n'),
      type: 'feature',
      status: 'OPEN',
      priority: 'LOW',
    },
  });
  console.log(`✓ FeatureRequest #${collectionsRoutes.id}: rutas listas dedicadas`);

  // ─── 5. Backlog: Widget Suscripciones real ──────────────────────────
  const subsWidget = await prisma.featureRequest.create({
    data: {
      title: 'Widget "Suscripciones" real basado en SeriesSubscription',
      description: [
        'En iter 19 se borro FollowedTitlesWidget porque mostraba `data.favorites` con bell icon — semanticamente mal: el nombre sugiere subscripciones (notificaciones) pero implementaba favoritos.',
        '',
        'El modelo SeriesSubscription si existe en Prisma. SubscriptionsSection en /perfil/SubscriptionsSection ya lo lee y muestra una lista en el footer del dashboard.',
        '',
        '**Idea:** sumar SubscriptionsSection al widget grid como un widget configurable. Hoy esta hardcodeado en el footer del DashboardClient junto a ProfileSettings y ClientVersionInfo (linea ~810).',
        '',
        '**Implementacion:**',
        '1. Crear `SubscriptionsWidget.tsx` en widgets/. Wrappea el SubscriptionsSection existente con `<Widget>` chrome.',
        '2. Registrar en WidgetRegistry con id "profile.subscriptions".',
        '3. Decidir si lo dejamos solo en el grid o tambien en el footer. Probable solo en el grid + linkado desde el card "Notificaciones" del ProfileSettings.',
        '4. Si va solo en el grid: borrar SubscriptionsSection del footer del DashboardClient.',
        '',
        'Datos: ya hay endpoint backend (lo que usa SubscriptionsSection internamente). Re-usar.',
      ].join('\n'),
      type: 'feature',
      status: 'OPEN',
      priority: 'LOW',
    },
  });
  console.log(`✓ FeatureRequest #${subsWidget.id}: Subscriptions widget`);

  // ─── 6. Changelog: items de la sesion 2026-05-11 ─────────────────────
  const version = '2026-05-11';
  const versionLabel = '/perfil: cerrar pagina (12 iters)';

  const changelogItems = [
    {
      category: 'Features',
      body: 'SocialsWidget nuevo: widget "Mis redes" con handles del user para Twitter/Instagram/Letterboxd/MyAnimeList/MyDramaList. Cada handle se renderea con icono de marca y abre la URL publica de cada plataforma. Edicion inline via Modal. Persiste en `User.socials` (nuevo campo Json, migracion 20260511063142_add_user_socials). Endpoint PATCH /api/user/me extendido con regex de validacion (handles sanitos, max 60 chars), Prisma.DbNull para limpiar.',
      sortOrder: 0,
    },
    {
      category: 'Features',
      body: 'Importar datos desde JSON: endpoint POST /api/user/account/import con 6 reglas de seguridad (userId siempre de la sesion, campos privilegiados filtrados, validacion shape, modo merge nunca replace, FK resolution con missingRefs reportado, limite 5MB). UI en ProfileSettings card "Privacidad y datos" con preview dry-run + confirm. Restaura comments / ratings / viewStatuses / favorites / featureRequests / featureVotes / suggestedSites.',
      sortOrder: 1,
    },
    {
      category: 'UX',
      body: '"Exportar mis datos" salio de "Zona Peligrosa" (que la palabra Irreversible solo aplica a Eliminar cuenta) y vive ahora en card propio "Privacidad y datos" junto al boton "Importar datos". Zona peligrosa queda con solo "Eliminar cuenta".',
      sortOrder: 2,
    },
    {
      category: 'UX',
      body: 'Header del dashboard consolidado: el mode selector (basic/advanced/admin) que vivia en una fila propia ahora se integra al header como sub-row de actions. "Editar perfil" cambia a primary type para diferenciarse de los controles del layout. 1 fila de chrome menos arriba del grid.',
      sortOrder: 3,
    },
    {
      category: 'Fixes',
      body: 'Heatmap responsive: ya no tiene cells de 12px fijos. Usa grid responsive (1fr columnas Y filas) para llenar ancho Y alto del widget. En widgets anchos+bajos las cells son rectangulos horizontales, en cuadrados son cuadradas. Adios al espacio muerto y al overflow horizontal.',
      sortOrder: 4,
    },
    {
      category: 'Fixes',
      body: 'Paper-in-paper resuelto: .mb-widget__body deja de tener su propio background (era color-mix con 90% bg-container). Ahora es transparente — el bg lo pone el .mb-widget root. Single source of background, sin efecto inset visible.',
      sortOrder: 5,
    },
    {
      category: 'Fixes',
      body: 'Sections del overview unificadas al patron canonico: Collections / Achievements / FollowedTitles / ReviewsActivity / YearSummary / SettingsRow dejaron de tener `<header>` interno + background + border propio. Ahora son body-only y el Widget wrapper provee title + icon + actions. Helpers exportados (countUnlockedAchievements + ACHIEVEMENTS_TOTAL) para que el wrapper rendee el counter como Widget action.',
      sortOrder: 6,
    },
    {
      category: 'Fixes',
      body: 'Padding root unificado en 19 widgets via --widget-body-padding (antes 8px/10px/spacing-md mezclados). Density modes propagan automaticamente. MyCasesWidget reescrito como lista compact (antes montaba MyCasesSection entera con Ant Table 1000px que se desbordaba del widget).',
      sortOrder: 7,
    },
    {
      category: 'Limpieza',
      body: '-2813 lineas: ruta legacy /perfil/clasico borrada (ProfileClient 1680 lineas + folders MyCasesSection, perfil-NotificationsWidget, overview/sections/{Header, ReviewsPanel}). Links rotos resueltos: items favorites/rewatch/abandoned de Collections quedan display-only hasta que existan rutas dedicadas (ver backlog). Fallback de error state ahora va a "/" home.',
      sortOrder: 8,
    },
    {
      category: 'Limpieza',
      body: '6 widgets duplicados borrados del registry (28→22): SettingsRowWidget (era un indice de cards que scrolleaba al ProfileSettings ya visible en el footer), OverviewWidget (75% dup del strip), RatingsWidget (100% dup del strip), YearSummaryWidget (3 de 4 KPIs duplicados + mislabeled), ReviewsActivityWidget (100% dup), FollowedTitlesWidget (usaba favoritos disfrazado de subscripciones). ProfileStatsStrip ahora cubre los 12 KPIs principales incluyendo "Vistos en {year}" y "Abandonadas".',
      sortOrder: 9,
    },
    {
      category: 'Limpieza',
      body: 'Orchestrators muertos del refactor previo borrados: ProfileUserLayout/, ProfileAdminLayout/, ProfileOverviewClient.tsx + 6 sections sin consumer (Cases, CommentsPanel, CountriesPanel, MyStats, Notifications, WatchingShelf — cada una ya reemplazada por su widget canonico). CatalogoClient.tsx.backup tambien limpiado.',
      sortOrder: 10,
    },
    {
      category: 'Fixes',
      body: '.npmrc con legacy-peer-deps=true para que Vercel pueda hacer npm install. react-simple-maps todavia no marca soporte para React 19 en sus peerDependencies (ni siquiera 4.0.0-beta lo hace), pero corre en runtime sin problemas. Workaround estandar hasta que el package publique una version con react@19 declarado.',
      sortOrder: 11,
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
