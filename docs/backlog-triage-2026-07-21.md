# Backlog triage + ranking ROI — 2026-07-21

Generado por `scripts/triage-backlog-2026-07-21.ts`. Total OPEN: **85**.

## Rúbrica ROI

Ejes 0–3: **seguridad**, **claridad** (accionable/repro), **importancia** (afecta a todos/desbloquea), **urgencia** (roto en prod hoy).
`score = seguridad*2 + urgencia*1.5 + claridad*1 + importancia*1`

Buckets (orden de trabajo, bugs de Flor primero): **BUG_FLOR** → **SECURITY** → **VERIFY** → **FEATURE_ROADMAP** → **CLEANUP**.

## Ranking global

| # | Bucket | Score | Cat/Effort/Impact | Type | Prio | Título |
|---|--------|-------|-------------------|------|------|--------|
| 30 | BUG_FLOR | 10.5 | catalogo/M/H | feature→**bug** | MEDIUM→**HIGH** | Contenido |
| 128 | BUG_FLOR | 10.0 | seo/S/M | feature→**bug** | MEDIUM | Nombred e pagina anterior |
| 132 | BUG_FLOR | 9.5 | catalogo/M/M | feature→**bug** | MEDIUM→**HIGH** | Especial |
| 133 | BUG_FLOR | 8.5 | catalogo/M/M | feature→**bug** | MEDIUM→**HIGH** | Viendo |
| 12 | BUG_FLOR | 8.0 | catalogo/S/M | feature→**bug** | MEDIUM | Modificación |
| 93 | BUG_FLOR | 8.0 | catalogo/M/M | bug | MEDIUM | Episodios: nombre + duracion no se muestran en /series/[id] |
| 113 | BUG_FLOR | 8.0 | catalogo/M/M | feature→**bug** | MEDIUM | Bloques de informacion adicional |
| 40 | BUG_FLOR | 7.0 | catalogo/S/L | feature | MEDIUM | Eliminar |
| 130 | BUG_FLOR | 7.0 | catalogo/S/L | feature→**bug** | MEDIUM | Temporadas |
| 42 | BUG_FLOR | 6.0 | catalogo/S/L | feature→**bug** | MEDIUM | Contador (Países) |
| 69 | SECURITY | 14.0 | infra/M/M | feature | LOW | Migrar OAuth client a proyecto Google Cloud propio |
| 26 | SECURITY | 9.5 | admin/M/M | feature | MEDIUM | Sistema de ban de usuarios y bloqueo por IP |
| 23 | SECURITY | 8.5 | infra/M/L | feature | MEDIUM | Access logs con registro de visitas y acciones |
| 25 | SECURITY | 8.5 | admin/S/L | feature | MEDIUM | Banner de privacidad |
| 24 | SECURITY | 6.5 | admin/M/L | feature | MEDIUM | Panel admin de logs con filtros y limpieza |
| 27 | VERIFY | 9.5 | admin/M/M | feature | MEDIUM | Mejora de la gestión de usuarios |
| 4 | VERIFY | 5.5 | admin/M/M | feature | MEDIUM | Pagina de gestion de usuarios y roles |
| 5 | VERIFY | 5.5 | admin/M/M | feature | MEDIUM | Tags y etiquetas con autocompletado en formulario de series |
| 6 | VERIFY | 5.5 | admin/M/M | feature | MEDIUM | Parejas de personajes en el reparto |
| 7 | VERIFY | 5.5 | perfil/M/M | feature | MEDIUM | Selector de posición de imagen mejorado |
| 8 | VERIFY | 5.5 | admin/XL/M | feature | MEDIUM | Cards de universos rediseñadas |
| 9 | VERIFY | 5.5 | admin/M/M | feature | MEDIUM | "Basado en" dinámico |
| 10 | VERIFY | 5.5 | admin/M/M | feature | MEDIUM | Verificación de Google Search Console |
| 11 | VERIFY | 5.5 | admin/M/M | feature | MEDIUM | Modificación |
| 13 | VERIFY | 5.5 | admin/M/M | feature | MEDIUM | Especiales |
| 14 | VERIFY | 5.5 | admin/M/M | feature | MEDIUM | Estado |
| 16 | VERIFY | 5.5 | admin/M/M | feature | MEDIUM | Temporadas/Especiales |
| 28 | VERIFY | 5.5 | admin/M/M | feature | MEDIUM | Universos |
| 31 | VERIFY | 5.5 | admin/M/M | feature | MEDIUM | Banderita |
| 32 | VERIFY | 5.5 | admin/M/M | feature | MEDIUM | Universos |
| 33 | VERIFY | 5.5 | admin/M/M | feature | MEDIUM | Banderitas |
| 36 | VERIFY | 5.5 | admin/M/M | feature | MEDIUM | Puntuación  |
| 38 | VERIFY | 5.5 | admin/M/M | feature | MEDIUM | Tipo |
| 39 | VERIFY | 5.5 | admin/M/M | feature | MEDIUM | Etiquetas (Tags) |
| 41 | VERIFY | 5.5 | admin/M/M | feature | MEDIUM | Reality |
| 52 | FEATURE_ROADMAP | 9.0 | ai/L/H | feature | HIGH | Asistente IA en creacion de serie |
| 92 | FEATURE_ROADMAP | 9.0 | ai/L/H | feature | HIGH | AI auto-fill de series: completar datos automaticamente |
| 109 | FEATURE_ROADMAP | 9.0 | ai/XL/H | feature | HIGH | Nueva pagina "Agregar serie" con AI auto-discovery |
| 110 | FEATURE_ROADMAP | 9.0 | ai/L/H | feature | HIGH | Full AI integration en flow de creacion de series |
| 111 | FEATURE_ROADMAP | 9.0 | ai/L/H | feature | HIGH | Precarga de datos AI desde IMDB / MyDramaList |
| 44 | FEATURE_ROADMAP | 8.0 | noticias/M/M | feature | HIGH | Editor Markdown para Noticias |
| 87 | FEATURE_ROADMAP | 8.0 | catalogo/XL/M | feature | HIGH | Refactor visual: pendientes /catalogo/[id] (workspace admin) |
| 97 | FEATURE_ROADMAP | 8.0 | admin/M/M | feature | MEDIUM | Admin: score de completitud (0-1000) para series |
| 112 | FEATURE_ROADMAP | 8.0 | admin/M/M | feature | HIGH | Score de completitud (0-1000) para series admin |
| 119 | FEATURE_ROADMAP | 8.0 | directores/L/M | feature | HIGH | Directores: rediseño UX/UI de la página pública |
| 89 | FEATURE_ROADMAP | 6.5 | perfil/M/M | feature | MEDIUM | Reseñas: no hay edit/delete shortcut desde /perfil |
| 35 | FEATURE_ROADMAP | 5.5 | perfil/M/M | idea | MEDIUM | Aviso al entrar |
| 45 | FEATURE_ROADMAP | 5.5 | noticias/S/M | feature | MEDIUM | Upload de imagen de portada para Noticias |
| 46 | FEATURE_ROADMAP | 5.5 | noticias/S/M | feature | MEDIUM | Pagina de detalle de noticia /noticias/[id] |
| 47 | FEATURE_ROADMAP | 5.5 | noticias/S/M | feature | MEDIUM | Comentarios en Noticias |
| 48 | FEATURE_ROADMAP | 5.5 | noticias/S/M | feature | MEDIUM | Notificaciones in-app cuando se publica una Noticia |
| 50 | FEATURE_ROADMAP | 5.5 | noticias/M/M | feature | MEDIUM | Tops por categoria editables desde /admin/noticias |
| 53 | FEATURE_ROADMAP | 5.5 | ai/M/M | feature | MEDIUM | Recomendaciones "porque viste X, mira Y" en pagina de serie |
| 54 | FEATURE_ROADMAP | 5.5 | ai/L/M | feature | MEDIUM | Sistema de recomendaciones admin curado |
| 55 | FEATURE_ROADMAP | 5.5 | perfil/XL/M | feature | MEDIUM | Detalle serie: rediseño bloque acciones inferior |
| 57 | FEATURE_ROADMAP | 5.5 | catalogo/S/M | feature | MEDIUM | Continuar viendo: persistir timestamp del ultimo episodio vi |
| 63 | FEATURE_ROADMAP | 5.5 | noticias/L/M | feature | MEDIUM | SEO Fase 2: schema.org + breadcrumbs + grafo interno |
| 64 | FEATURE_ROADMAP | 5.5 | noticias/L/M | idea | MEDIUM | SEO Fase 3: llms.txt + endpoint /api/ai-map para agentes |
| 70 | FEATURE_ROADMAP | 5.5 | ai/M/M | feature | MEDIUM | Re-correr migracion i18n para 26 archivos fallidos en batch |
| 71 | FEATURE_ROADMAP | 5.5 | i18n/M/M | feature | MEDIUM | Helper i18n server-side para components que no son client |
| 75 | FEATURE_ROADMAP | 5.5 | noticias/L/M | feature | MEDIUM | Top N dinamicos en /admin/noticias (decisiones de diseño abi |
| 85 | FEATURE_ROADMAP | 5.5 | perfil/M/M | feature | MEDIUM | Modelo Collection: listas personalizadas del usuario |
| 90 | FEATURE_ROADMAP | 5.5 | perfil/M/M | idea | MEDIUM | Backlog: implementar widgets reordenables ON el overview /pe |
| 94 | FEATURE_ROADMAP | 5.5 | directores/M/M | feature | MEDIUM | Refactor visual: /admin/contenido + AdminTableClient + admin |
| 95 | FEATURE_ROADMAP | 5.5 | admin/M/M | feature | MEDIUM | Refactor visual: /sitios + /contenido + /watching + landing |
| 116 | FEATURE_ROADMAP | 5.5 | perfil/S/L | feature | MEDIUM | Unificar GenresDonut + TopGenresList en un solo widget con v |
| 120 | FEATURE_ROADMAP | 5.5 | directores/M/M | feature | MEDIUM | Directores: ampliar información pública disponible |
| 131 | FEATURE_ROADMAP | 5.5 | catalogo/S/L | feature | MEDIUM | Botón de editar serie |
| 114 | CLEANUP | 8.0 | perfil/S/M | bug | HIGH | Bump dashboardKey de v5 → v6 (post-cleanup widgets) |
| 68 | CLEANUP | 5.5 | cleanup/S/L | bug | LOW | Limpiar imports no usados en FeedbackClient + BottomNav |
| 76 | CLEANUP | 5.5 | cleanup/M/L | feature | LOW | Refactor: USER_PUBLIC_SELECT compartido para Prisma queries |
| 88 | CLEANUP | 5.5 | perfil/S/L | bug | LOW | Empty space en /perfil overview cuando MyComments es corto |
| 115 | CLEANUP | 5.5 | i18n/S/L | bug | LOW | Limpiar i18n keys huerfanas post-cleanup de /perfil |
| 49 | CLEANUP | 4.5 | noticias/S/L | feature | LOW | Tags UI mejorada en Noticias con auto-suggest |
| 56 | CLEANUP | 4.5 | catalogo/S/L | idea | LOW | Comparador de series 1v1 |
| 58 | CLEANUP | 4.5 | seo/S/L | idea | LOW | Heatmap publico de estrenos por mes/año |
| 59 | CLEANUP | 4.5 | noticias/S/L | feature | LOW | Export del catalogo de usuario (Markdown/JSON) |
| 60 | CLEANUP | 4.5 | catalogo/S/L | feature | LOW | Busqueda avanzada multi-criterio combinada |
| 61 | CLEANUP | 4.5 | admin/S/L | feature | LOW | Import/export de datos para backup |
| 67 | CLEANUP | 4.5 | admin/L/L | feature | LOW | Notificaciones por correo (opt-in desde config) |
| 73 | CLEANUP | 4.5 | i18n/M/L | bug | LOW | Audit completo de regresiones post-auto-i18n |
| 86 | CLEANUP | 4.5 | perfil/M/L | feature | LOW | Modelo Achievement: logros persistidos en backend |
| 91 | CLEANUP | 4.5 | perfil/M/L | feature | LOW | Search bar contextual: solo donde corresponde |
| 117 | CLEANUP | 4.5 | perfil/L/L | feature | LOW | Crear rutas /favoritos /retomar /abandonadas (listas complet |
| 118 | CLEANUP | 4.5 | perfil/L/L | feature | LOW | Widget "Suscripciones" real basado en SeriesSubscription |

## BUG_FLOR — Bugs de Flor (funcionales) (10)

| # | Score | E/I | Título | Nota |
|---|-------|-----|--------|------|
| 30 | 10.5 | M/H | Contenido | No se puede agregar contenido salvo entrando a editar; aparece al fondo |
| 128 | 10.0 | S/M | Nombred e pagina anterior | Aparece mundobl.win en el inicio (debería ser mundobl.com.ar) |
| 132 | 9.5 | M/M | Especial | Especiales no muestran cantidad de episodios; el campo desaparece al editar |
| 133 | 8.5 | M/M | Viendo | En "Viendo" las series no aparecen enteras |
| 12 | 8.0 | S/M | Modificación | Universos con +3 títulos muestran solo 2 y descolocan a las vecinas |
| 93 | 8.0 | M/M | Episodios: nombre + duracion no se muestran en /se | Episodios: nombre + duración no se muestran en /series/[id] |
| 113 | 8.0 | M/M | Bloques de informacion adicional | Bloques info adicional: solo al editar, no al crear (paridad crear/editar) |
| 40 | 7.0 | S/L | Eliminar | Tarea de datos: borrar T2 de Addicted Heroin (ya existe scripts/delete-addicted-s2.ts) |
| 130 | 7.0 | S/L | Temporadas | Typo "tempoaradas"→"temporada" + UX de temporadas |
| 42 | 6.0 | S/L | Contador (Países) | No figuran todos los países en el contador |

## SECURITY — Seguridad / privacidad (5)

| # | Score | E/I | Título | Nota |
|---|-------|-----|--------|------|
| 69 | 14.0 | M/M | Migrar OAuth client a proyecto Google Cloud propio | OAuth client vive en proyecto ajeno AEGIS → aislar a proyecto propio + rotar secretos |
| 26 | 9.5 | M/M | Sistema de ban de usuarios y bloqueo por IP | Ban de usuarios + bloqueo por IP — implementado, SIN verificar en runtime |
| 23 | 8.5 | M/L | Access logs con registro de visitas y acciones | Access logs — implementado, SIN verificar |
| 25 | 8.5 | S/L | Banner de privacidad | Banner de privacidad — implementado, SIN verificar |
| 24 | 6.5 | M/L | Panel admin de logs con filtros y limpieza | Panel admin de logs — implementado, SIN verificar |

## VERIFY — Verificar (implementado sin testear) (20)

| # | Score | E/I | Título | Nota |
|---|-------|-----|--------|------|
| 27 | 9.5 | M/M | Mejora de la gestión de usuarios |  |
| 4 | 5.5 | M/M | Pagina de gestion de usuarios y roles |  |
| 5 | 5.5 | M/M | Tags y etiquetas con autocompletado en formulario  |  |
| 6 | 5.5 | M/M | Parejas de personajes en el reparto |  |
| 7 | 5.5 | M/M | Selector de posición de imagen mejorado |  |
| 8 | 5.5 | XL/M | Cards de universos rediseñadas |  |
| 9 | 5.5 | M/M | "Basado en" dinámico |  |
| 10 | 5.5 | M/M | Verificación de Google Search Console |  |
| 11 | 5.5 | M/M | Modificación |  |
| 13 | 5.5 | M/M | Especiales |  |
| 14 | 5.5 | M/M | Estado |  |
| 16 | 5.5 | M/M | Temporadas/Especiales |  |
| 28 | 5.5 | M/M | Universos |  |
| 31 | 5.5 | M/M | Banderita |  |
| 32 | 5.5 | M/M | Universos |  |
| 33 | 5.5 | M/M | Banderitas |  |
| 36 | 5.5 | M/M | Puntuación  |  |
| 38 | 5.5 | M/M | Tipo |  |
| 39 | 5.5 | M/M | Etiquetas (Tags) |  |
| 41 | 5.5 | M/M | Reality |  |

## FEATURE_ROADMAP — Features roadmap (33)

| # | Score | E/I | Título | Nota |
|---|-------|-----|--------|------|
| 52 | 9.0 | L/H | Asistente IA en creacion de serie |  |
| 92 | 9.0 | L/H | AI auto-fill de series: completar datos automatica |  |
| 109 | 9.0 | XL/H | Nueva pagina "Agregar serie" con AI auto-discovery |  |
| 110 | 9.0 | L/H | Full AI integration en flow de creacion de series |  |
| 111 | 9.0 | L/H | Precarga de datos AI desde IMDB / MyDramaList |  |
| 44 | 8.0 | M/M | Editor Markdown para Noticias |  |
| 87 | 8.0 | XL/M | Refactor visual: pendientes /catalogo/[id] (worksp |  |
| 97 | 8.0 | M/M | Admin: score de completitud (0-1000) para series |  |
| 112 | 8.0 | M/M | Score de completitud (0-1000) para series admin |  |
| 119 | 8.0 | L/M | Directores: rediseño UX/UI de la página pública |  |
| 89 | 6.5 | M/M | Reseñas: no hay edit/delete shortcut desde /perfil |  |
| 35 | 5.5 | M/M | Aviso al entrar |  |
| 45 | 5.5 | S/M | Upload de imagen de portada para Noticias |  |
| 46 | 5.5 | S/M | Pagina de detalle de noticia /noticias/[id] |  |
| 47 | 5.5 | S/M | Comentarios en Noticias |  |
| 48 | 5.5 | S/M | Notificaciones in-app cuando se publica una Notici |  |
| 50 | 5.5 | M/M | Tops por categoria editables desde /admin/noticias |  |
| 53 | 5.5 | M/M | Recomendaciones "porque viste X, mira Y" en pagina |  |
| 54 | 5.5 | L/M | Sistema de recomendaciones admin curado |  |
| 55 | 5.5 | XL/M | Detalle serie: rediseño bloque acciones inferior |  |
| 57 | 5.5 | S/M | Continuar viendo: persistir timestamp del ultimo e |  |
| 63 | 5.5 | L/M | SEO Fase 2: schema.org + breadcrumbs + grafo inter |  |
| 64 | 5.5 | L/M | SEO Fase 3: llms.txt + endpoint /api/ai-map para a |  |
| 70 | 5.5 | M/M | Re-correr migracion i18n para 26 archivos fallidos |  |
| 71 | 5.5 | M/M | Helper i18n server-side para components que no son |  |
| 75 | 5.5 | L/M | Top N dinamicos en /admin/noticias (decisiones de  |  |
| 85 | 5.5 | M/M | Modelo Collection: listas personalizadas del usuar |  |
| 90 | 5.5 | M/M | Backlog: implementar widgets reordenables ON el ov |  |
| 94 | 5.5 | M/M | Refactor visual: /admin/contenido + AdminTableClie |  |
| 95 | 5.5 | M/M | Refactor visual: /sitios + /contenido + /watching  |  |
| 116 | 5.5 | S/L | Unificar GenresDonut + TopGenresList en un solo wi |  |
| 120 | 5.5 | M/M | Directores: ampliar información pública disponible |  |
| 131 | 5.5 | S/L | Botón de editar serie | Botón editar serie también arriba |

## CLEANUP — Cleanup / tech-debt (17)

| # | Score | E/I | Título | Nota |
|---|-------|-----|--------|------|
| 114 | 8.0 | S/M | Bump dashboardKey de v5 → v6 (post-cleanup widgets | Bump dashboardKey v5→v6: quick-win, evita slots vacíos en layouts cacheados |
| 68 | 5.5 | S/L | Limpiar imports no usados en FeedbackClient + Bott |  |
| 76 | 5.5 | M/L | Refactor: USER_PUBLIC_SELECT compartido para Prism |  |
| 88 | 5.5 | S/L | Empty space en /perfil overview cuando MyComments  |  |
| 115 | 5.5 | S/L | Limpiar i18n keys huerfanas post-cleanup de /perfi |  |
| 49 | 4.5 | S/L | Tags UI mejorada en Noticias con auto-suggest |  |
| 56 | 4.5 | S/L | Comparador de series 1v1 |  |
| 58 | 4.5 | S/L | Heatmap publico de estrenos por mes/año |  |
| 59 | 4.5 | S/L | Export del catalogo de usuario (Markdown/JSON) |  |
| 60 | 4.5 | S/L | Busqueda avanzada multi-criterio combinada |  |
| 61 | 4.5 | S/L | Import/export de datos para backup |  |
| 67 | 4.5 | L/L | Notificaciones por correo (opt-in desde config) |  |
| 73 | 4.5 | M/L | Audit completo de regresiones post-auto-i18n |  |
| 86 | 4.5 | M/L | Modelo Achievement: logros persistidos en backend |  |
| 91 | 4.5 | M/L | Search bar contextual: solo donde corresponde |  |
| 117 | 4.5 | L/L | Crear rutas /favoritos /retomar /abandonadas (list |  |
| 118 | 4.5 | L/L | Widget "Suscripciones" real basado en SeriesSubscr |  |

## Reclasificaciones aplicadas

**Type** (8): #12 feature→bug, #30 feature→bug, #42 feature→bug, #113 feature→bug, #128 feature→bug, #130 feature→bug, #132 feature→bug, #133 feature→bug

**Priority** (3): #30 MEDIUM→HIGH, #132 MEDIUM→HIGH, #133 MEDIUM→HIGH

## VERIFY — checklist de verificación humana (20)

Items marcados como implementados pero **sin testear en runtime** (batch revertido a OPEN). Verificar cada uno end-to-end y cerrar (COMPLETED) o reabrir con detalle del bug. Cerrarlos baja el backlog real.

- [ ] #27 — Mejora de la gestión de usuarios
- [ ] #4 — Pagina de gestion de usuarios y roles
- [ ] #5 — Tags y etiquetas con autocompletado en formulario de series
- [ ] #6 — Parejas de personajes en el reparto
- [ ] #7 — Selector de posición de imagen mejorado
- [ ] #8 — Cards de universos rediseñadas
- [ ] #9 — "Basado en" dinámico
- [ ] #10 — Verificación de Google Search Console
- [ ] #11 — Modificación
- [ ] #13 — Especiales
- [ ] #14 — Estado
- [ ] #16 — Temporadas/Especiales
- [ ] #28 — Universos
- [ ] #31 — Banderita
- [ ] #32 — Universos
- [ ] #33 — Banderitas
- [ ] #36 — Puntuación 
- [ ] #38 — Tipo
- [ ] #39 — Etiquetas (Tags)
- [ ] #41 — Reality

## Notas

- Categoría/effort/impact persisten como prefijo `[cat:X][effort:Y][impact:Z]` en `FeatureRequest.description` (idempotente; no re-prefija).
- Re-ejecutar: `npx tsx scripts/triage-backlog-2026-07-21.ts --report`. Aplicar: agregar `--apply`.
- El bug de tags duplicados reportado por Flor se corrigió en código esta sesión (`src/lib/tag-utils.ts` + 3 rutas de series).