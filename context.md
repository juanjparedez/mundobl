# MundoBL - Contexto del Proyecto

### Comunidad y pertenencia: nueva entrega en curso (2026-09-27)

- El usuario autorizó un bloque mayor tras #103: listas/Top 5 privados, perfil público opt-in, conversaciones conectadas, seguimiento configurable, bloqueos, denuncias/moderación y métricas. Contrato y aceptación en [comunidad-pertenencia-plan.md](docs/comunidad-pertenencia-plan.md). Este alcance nuevo no reactiva otros proyectos ajenos de seguimiento.
- Rama `codex/comunidad-pertenencia`. Migración `20260928005043_community_belonging` aplicada únicamente a PostgreSQL local; ocho tablas nuevas con RLS, publicaciones existentes preservadas y nuevos temas privados por defecto. No aplicar en producción hasta completar interfaz y controles de la entrega.
- Helpers/API de listas, perfiles, preferencias de invitación, bloqueos y moderación implementados; exportación personal incluye Comunidad y borrado de cuenta elimina borradores privados. Pantallas de listas, Top 5, perfil opt-in e invitación discreta implementadas con textos en diez idiomas y pruebas de navegador a 1280/390 px. Pruebas de librería/privacidad, solicitudes y moderación en PostgreSQL local.
- Conversaciones: controles para seguir, activar avisos explícitamente y silenciar. Las respuestas notifican únicamente a seguidores que lo eligieron, respetando bloqueos recíprocos y cuentas suspendidas; ya no notifican automáticamente al creador. API para editar/publicar/retirar borradores con control de concurrencia, marcar respuestas leídas y guardar recomendaciones sin reemplazar progreso. `test-community-conversations.ts` y `test-community-flow.mjs` aprobados localmente; OAuth y entrega real de notificaciones no están cubiertos por el navegador de prueba.
- Conversaciones integradas: el compositor guarda borradores privados; su dueño puede editar/publicar/retirar. `/comunidad/mis-conversaciones` separa propias, borradores y seguidas con respuestas nuevas y marcado de lectura por página. `/comunidad/obras/[id]` filtra por obra/capítulo y preselecciona el contexto al crear; enlaces desde ficha, reproducción y comentarios de capítulos. Respuestas admiten una obra pública adjunta; listas y respuestas permiten guardarla en pendientes conservando progreso existente. Nuevos textos en los diez idiomas. `test-community-flow.mjs` verifica este recorrido con APIs/componentes reales y PostgreSQL local; `test-community-library-flow.mjs` confirma regresión de listas/perfiles/Top 5. TypeScript y ESLint focalizado aprobados, móvil/escritorio sin desbordamiento; falta prueba con el layout completo.
- Completados controles de denuncia/bloqueo, panel de moderación con motivos/auditoría, configuración ADMIN y métricas públicas. Moderadores ya no borran contenido ajeno por rutas heredadas; la revisión no permite leer borradores. Importación recupera listas/temas/presentación en privado sin reactivar publicación ni avisos; probadas idempotencia y concurrencia. Backup/restauración local verificó las 75 tablas con datos en los ocho modelos nuevos.
- Build y TypeScript aprobados; lint focalizado sin errores. Navegador con servidor Next de producción, AppLayout y JWT verificados recorrió listas privadas/publicación/retirada, guardado de recomendaciones, denuncia/moderación y borrador contextual; anchos 1280/390 sin desbordamiento ni errores de página. Google OAuth se reemplazó por sesiones locales firmadas; no se verificó entrega externa de notificaciones. Corregidos origen en NextURL para loopback y botones que redirigían al login durante la carga de sesión.
- Entrega: ver [comunidad-pertenencia-plan.md](docs/comunidad-pertenencia-plan.md) y [entrega del 28/09](docs/entrega-comunidad-2026-09-28.md). Falta CI remoto, backup/migración de producción y comprobación posterior al merge. No hay cambios de producción aplicados todavía. Preview deshabilitado para esta rama para concentrar la entrega en un único PR.

### Conversaciones de Comunidad (2026-09-27)

- Discusiones de series/capítulos, pedidos de reseñas y recomendaciones; respuestas, cierre/reapertura, moderación y notificaciones al autor. Feed con portadas, autores públicos, extractos sin spoilers, filtros y búsqueda. Pedidos de reseña abren el editor de la obra.
- Tablas CommunityTopic/CommunityReply con RLS y límites concurrentes por usuario. Migración aditiva `20260927175456_community_topics`: aplicar antes del despliegue. Backup ampliado a 67 tablas y restauración ensayada localmente.
- Alcance, pruebas y límites: [entrega de Comunidad](docs/entrega-comunidad-2026-09-27.md). Las pruebas integradas usan APIs y PostgreSQL reales con sesión de prueba; no prueban OAuth ni entrega real de notificaciones. No implica chat privado ni seguimiento de conversaciones.

### Estadísticas de reseñas y participación (2026-09-27)

- `/estadisticas` muestra `totalPublishedReviews`: reseñas PUBLISHED de cuentas no ADMIN sobre obras públicamente accesibles. Incluye catálogo y aportes con reproducción disponible; excluye borradores y obras ocultas. Cada versión por idioma cuenta como una reseña. Reutiliza `PUBLIC_REVIEW_SERIES` de `database.ts`, compartido con `getCommunityReviews`, para mantener el mismo criterio de acceso.
- `/admin/stats` muestra reseñas publicadas totales y con `publishedAt` en los últimos siete días, incluyendo equipo y obras ocultas al público. El endpoint de edición ya renueva `publishedAt` al publicar/guardar una reseña publicada: esta métrica representa publicaciones vigentes con esa fecha, no un historial inmutable de primeras publicaciones.
- Usuarios activos conserva el límite de 20 cuentas no bloqueadas y amplía las acciones de los últimos 30 días: seguimiento, reseñas publicadas, comentarios públicos, calificaciones y favoritos. Usa `updatedAt` salvo favoritos (`createdAt`); no incorpora visitas anónimas ni borradores/comentarios privados.
- ISR público reducido de seis horas a cinco minutos. El texto explica actualización al visitar tras ese intervalo y regeneración en segundo plano; no promete tiempo real ni refresco automático de una pestaña abierta. Textos nuevos en los diez idiomas.
- `scripts/test-community-statistics.ts` pasó contra PostgreSQL temporal PGlite con las migraciones existentes: alcance público/admin, fechas, borradores, ocultar obras y actividad sin seguimiento. `scripts/test-community-statistics-ui.mjs` pasó con componentes reales y API/sesión simuladas a 1280/390 px: contadores y usuario solo reseñas, sin desbordamiento. TypeScript y ESLint de archivos modificados aprobados. Sin cambios de schema, despliegue ni consulta de cantidades de producción.

**Entrega acotada del 2026-09-26:** ver [alcance integrado, validación y pendientes](docs/entrega-seguimiento-2026-09-26.md). El usuario pidió detener la expansión del plan y concentrar el trabajo existente en un PR, con merge cuando esté verificado. No reanudar automáticamente el objetivo amplio.

Catalogo personal de series asiaticas (BL/GL y otros generos). Aplicacion full-stack para gestionar, calificar y hacer seguimiento de series, peliculas, cortos y especiales.

---

## Stack Tecnologico

| Tecnologia     | Version | Uso                      |
| -------------- | ------- | ------------------------ |
| **Next.js**    | 16      | Framework (App Router)   |
| **React**      | 19      | UI                       |
| **TypeScript** | 5.9     | Tipado estricto          |
| **Ant Design** | 6       | Componentes UI           |
| **Prisma**     | 7.4     | ORM                      |
| **PostgreSQL** | -       | Base de datos (Supabase) |

## Infraestructura

| Servicio           | Detalle                                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Hosting**        | Vercel (deploy automatico desde GitHub)                                                                                            |
| **Base de datos**  | Supabase PostgreSQL (sa-east-1, Sao Paulo)                                                                                         |
| **Almacenamiento** | Supabase Storage (bucket `images`)                                                                                                 |
| **Auth**           | NextAuth.js (Google OAuth)                                                                                                         |
| **Dominio**        | **mundobl.com.ar** (primario), mundobl.win (backup). Redireccion `.win → .com.ar` via Cloudflare (DNS / Page Rules), NO en codigo. |
| **SSL**            | Automatico via Vercel                                                                                                              |

### Variables de Entorno (Vercel + .env local)

```
# Base de datos
DATABASE_URL                # Transaction pooler (puerto 6543) - para la app
DIRECT_URL                  # Session pooler (puerto 5432) - para migraciones Prisma
SUPABASE_PASSWORD           # Password del proyecto Supabase

# Auth (NextAuth + Google OAuth)
AUTH_SECRET                 # Secret para NextAuth
NEXTAUTH_URL                # URL absoluta del sitio
GOOGLE_CLIENT_ID            # Google OAuth client ID
GOOGLE_CLIENT_SECRET        # Google OAuth client secret
ADMIN_EMAILS                # Emails admin separados por coma

# Supabase Storage (subida de imagenes)
NEXT_PUBLIC_SUPABASE_URL                       # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY   # Anon key publica
SUPABASE_SERVICE_ROLE_KEY                      # Service role key (server-only)

# Integraciones externas
YOUTUBE_API_KEY             # YouTube Data API v3 (importacion de videos/canales/playlists)
VIMEO_CLIENT_ID             # Vimeo API
VIMEO_ACCESS_TOKEN          # Token de acceso de Vimeo

# Links del proyecto (admin/info)
PROJECT_GITHUB_URL
PROJECT_VERCEL_URL
PROJECT_SUPABASE_URL
```

> **Limpiar del `.env` local**: las vars `DEV_AUTH_BYPASS`, `DEV_AUTH_ROLE`, `DEV_AUTH_USER_ID` no las lee ningun archivo en `src/`. Son dead config (auditado 2026-05-09). Si en el futuro se reintroduce un bypass de auth dev, debe ir guardado tras `process.env.NODE_ENV !== 'production'`.

**Asistente IA del proyecto:** **Gemini** (no Claude/Anthropic). El helper esta en [src/lib/gemini.ts](src/lib/gemini.ts) y la env var es `GEMINI_API_KEY`. Cualquier feature de IA debe usar este helper, no integrar otro proveedor.

---

## Integraciones Externas

### YouTube Data API v3

- **Env**: `YOUTUBE_API_KEY` (configurada). Cuota gratuita: 10k unidades/dia.
- **Helper**: [src/lib/channel-fetcher.ts](src/lib/channel-fetcher.ts) → `fetchYouTubeChannel(url, pageToken?)`
  - Acepta URLs de canal: `/channel/UCxxx`, `/@handle`, `/c/customname`, `/user/username`
  - Usa el endpoint `playlistItems` sobre la playlist `uploads` del canal
  - Pagina con `nextPageToken`, 50 videos por pagina
  - Devuelve `ChannelVideo[]` con `videoId`, `title`, `description`, `thumbnailUrl`, `channelName`, `channelUrl`, `publishedAt`, `platform: 'YouTube'`
- **`fetchYouTubePlaylist(url, pageToken?)`**: importa una playlist (ej. la playlist oficial de una serie en GMMTV). Acepta URLs `?list=PLxxx` o `playlist/PLxxx`. Devuelve `PlaylistFetchResult` con metadata del playlist (titulo, descripcion, thumbnail, itemCount) ademas de los videos.
- **`fetchAllYouTubePlaylistVideos(url, maxPages=10)`**: paginacion automatica hasta `maxPages` (500 videos) — para series con muchos episodios.
- **Lo que NO esta implementado todavia**:
  - Fetch por **video unico** con metadata enriquecida (`videos` endpoint con `contentDetails` para duracion)

### Vimeo API

- **Env**: `VIMEO_CLIENT_ID`, `VIMEO_ACCESS_TOKEN` (configuradas).
- **Helper**: [src/lib/channel-fetcher.ts](src/lib/channel-fetcher.ts) → `fetchVimeoChannel(url, pageToken?)`
  - Acepta URLs de usuario/canal: `/channels/name`, `/username`
  - Usa el endpoint `users/{userId}/videos`, 25 videos por pagina, ordenado por fecha
  - Misma forma de retorno (`ChannelVideo[]`) que YouTube → flujo unificado

### Internacionalizacion (i18n)

- **10 locales soportados con traduccion completa**: `es`, `en`, `it`, `de`, `fr`, `ja`, `ko`, `zh-CN`, `zh-TW`, `th`. Default: `es`.
- Storage: `localStorage['app-locale']` (client-side). El toggle es client-side, las URLs NO cambian por locale.
- **Estructura**:
  - [src/i18n/config.ts](src/i18n/config.ts): SUPPORTED_LOCALES, LOCALE_LABELS, isSupportedLocale
  - [src/i18n/messages.ts](src/i18n/messages.ts): TranslationShape (tipo), bloques `es` y `en` inline (~1500 lineas cada uno), MESSAGES record que importa los otros 8 desde `locales/`
  - `src/i18n/locales/{code}.ts`: traducciones generadas por IA (Gemini), una por locale. Editables a mano si una frase suena mal.
- **Helper**: [src/lib/providers/LocaleProvider.tsx](src/lib/providers/LocaleProvider.tsx) → `useLocale()` retorna `{ locale, setLocale, t(key) }`. `t` falla a `en` si la clave no existe en el locale activo, y a la propia clave si tampoco existe en `en`.
- **antd locales**: [src/lib/providers/ThemeProvider.tsx](src/lib/providers/ThemeProvider.tsx) mapea cada locale al pack de antd (`antd/locale/xx_YY`) para DatePicker, Calendar, etc.
- **Para regenerar un locale via IA**: `npx tsx scripts/translate-locales.ts {code}` (usa `MESSAGES.en` como source de verdad, batchea en groups de 40 strings, escribe el archivo). Free tier de Gemini suficiente.
- **Para agregar un locale nuevo**: ver header de [config.ts](src/i18n/config.ts).

### Google Gemini API (asistente IA)

- **Env**: `GEMINI_API_KEY` (configurada en Vercel; **no** en `.env` local). Free tier: 15 RPM / 1500 RPD compartido por key.
- **Modelo**: cadena con fallback automatico. Default: `gemini-2.5-flash` → `gemini-flash-latest` → `gemini-2.5-flash-lite`. Override via env `GEMINI_MODELS` (csv).
- **Helper**: [src/lib/gemini.ts](src/lib/gemini.ts) → `generateText({prompt, systemInstruction, temperature?, maxOutputTokens?, thinkingBudget?})`
  - `thinkingBudget: 0` desactiva "thinking tokens" (recomendado para tareas cortas)
  - Tira `GeminiError` con `status` HTTP + `googleStatus` simbolico (RESOURCE_EXHAUSTED, PERMISSION_DENIED, etc.)
  - Fallback automatico ante 429/404/5xx; errores definitivos (400, prompt invalido) frenan
- **Consumidores actuales**:
  - `POST /api/reviews/ai-assist` — sugerencias de resena
  - `POST /api/admin/changelog/ai-assist` — redaccion de changelog
  - `POST /api/admin/news/ai-generate` — generacion de news
  - `POST /api/reviews` — asistencia inline
- **Casos de uso futuros**: traduccion de sinopsis al español al importar series, normalizacion de titulos parseados de YouTube, deteccion de pais/año desde metadata de canal.

### Embed helpers ([src/lib/embed-helpers.ts](src/lib/embed-helpers.ts))

Soporta 8 plataformas para reproducir/parsear:

- **YouTube**, **Vimeo**, **Bilibili**, **Dailymotion**, **TikTok**, **Instagram**, **Twitter/X**, **Spotify**
- `getYouTubeId`, `getVimeoId`, `getBilibiliId`, `detectPlatform(url)`, `buildEmbedSrc(url)`, `getThumbnailUrl(url)`
- Constantes: `PLATFORM_OPTIONS`, `CATEGORY_OPTIONS`, `PLATFORM_COLORS`

### Supabase Storage

- **Helper**: [src/lib/supabase.ts](src/lib/supabase.ts)
- Bucket: `images`. Funciones: `uploadImage`, `deleteImage`, `downloadAndUploadImage` (re-hostea imagen desde URL externa)
- Usa la **service role key** y SOLO para Storage. La app NUNCA consulta tablas via el cliente Supabase (`supabase.from(...)`) — todo el acceso a DB es via Prisma.

### Seguridad DB — RLS (Row Level Security)

- **Todas las tablas del schema `public` tienen RLS habilitado** (deny-by-default para el rol `anon`). Sin esto, la anon/publishable key (PUBLICA, `NEXT_PUBLIC_...`) permitiria leer/escribir tablas via la REST API de Supabase (PostgREST), salteando la app.
- **No rompe la app**: Prisma conecta con el rol postgres (conexion directa `DATABASE_URL`), que **bypassea RLS**. Storage usa la service key (RLS aparte).
- ⚠️ **RLS no lo maneja Prisma**: las tablas nuevas de futuras migraciones NO heredan RLS. Tras cada `prisma migrate` correr [scripts/enable-rls.ts](scripts/enable-rls.ts) (`--apply`) para re-habilitarlo en las nuevas.

### NextAuth (Google OAuth)

- [src/lib/auth.ts](src/lib/auth.ts), [src/lib/auth-helpers.ts](src/lib/auth-helpers.ts)
- `requireAuth()`, `requireRole(['ADMIN' | 'MODERATOR' | 'USER'])` para proteger endpoints
- Roles via `User.role` (enum `Role`); admin se puede sembrar via `ADMIN_EMAILS`
- **Authorized Redirect URIs** que tienen que estar registrados en Google Cloud Console (cliente OAuth):
  - `https://mundobl.com.ar/api/auth/callback/google` (primario)
  - `https://mundobl.win/api/auth/callback/google` (backup; aunque el proxy redirige .win → .com.ar, conviene tenerlo por si el callback llega antes del redirect)
  - `http://localhost:3000/api/auth/callback/google` (dev)

### Display name publico (privacidad)

- `User.nickname String?` (migracion `20260509064748_add_user_nickname`).
- Helper [src/lib/user-display.ts](src/lib/user-display.ts) → `formatPublicName({name, nickname})` y `getInitials(...)`. Usar en TODO contexto donde otros usuarios ven el nombre (comentarios, feedback, reseñas). El sidebar/menu propio puede seguir mostrando `session.user.name` directo (uno se ve a si mismo con apellido completo).
- Fallback cuando no hay nickname: `"Nombre I."` (inicial del apellido). Si el usuario solo tiene un nombre: se muestra tal cual.
- API: `PATCH /api/user/me` body `{nickname: string | null}` para que el usuario edite su propio nickname.
- UI: input en [/perfil → ProfileSettings](src/app/perfil/ProfileSettings/ProfileSettings.tsx) (primer card del grid).
- **Importante para futuras queries**: cualquier `prisma.user.findX` o `select: { user: ... }` que vaya a renderizar publicamente debe incluir `nickname: true` ademas de `name: true`.

### Tags (matching sin duplicados)

- `Tag.name` es `@unique` pero el indice de Postgres es case/espacios-sensible, asi que "Enemy to Lovers" vs "enemy to lovers" eran filas distintas.
- Helpers en [src/lib/tag-utils.ts](src/lib/tag-utils.ts): `findOrCreateTag(client, rawName, category='trope')`, `findOrCreateGenre(client, rawName)` y `findOrCreateActor(client, rawName)`. Hacen `trim` + `findFirst({ name: { equals, mode: 'insensitive' } })` y solo crean si no existe (maneja carrera P2002). Aceptan el cliente Prisma o un `Prisma.TransactionClient`.
- **Usar siempre estos helpers** al persistir tags/generos/actores desde nombre (nunca `X.upsert({ where: { name } })` a pelo). Aplicados en [POST /api/series](src/app/api/series/route.ts), [PATCH /api/series/[id]](src/app/api/series/[id]/route.ts), [POST /api/user/series/embed/confirm](src/app/api/user/series/embed/confirm/route.ts) y (actores) [PATCH /api/seasons/[id]](src/app/api/seasons/[id]/route.ts). `POST /api/tags` rechaza duplicados case-insensitive.
- **Limpieza de duplicados existentes**: `scripts/merge-duplicate-tags.ts` y `scripts/merge-duplicate-actors.ts` (dry-run por defecto, `--apply` fusiona; reusan la logica de `/api/tags/merge` y `/api/actors/merge`). Corridos 2026-07-21: 6 tags + 5 actores fusionados (espacios al inicio/final).
- Tablas compartidas que aun usan `upsert({ where: { name } })` exacto (ProductionCompany, Language): mismo bug latente; replicar `findOrCreate*` + script de merge si aparecen duplicados.

### Bloques de informacion adicional (crear + editar)

- [SeriesInfoBlocksManager](src/components/admin/SeriesInfoBlocksManager/SeriesInfoBlocksManager.tsx) soporta 2 modos: **edicion** (prop `seriesId`, persiste via API en vivo) y **creacion** (props `pendingBlocks`/`onPendingBlocksChange`, en memoria). En creacion, [SeriesForm](src/components/admin/SeriesForm.tsx) adjunta `infoBlocks` al payload de `POST /api/series`, que los persiste como `SeriesInfoBlock`. Mismo patron que `SeriesContentManager` (`contentItems`).

### Web Push (notificaciones)

- Paquete `web-push`. Suscripciones en `PushSubscription` model. Server actions en [src/lib/push-server.ts](src/lib/push-server.ts) (si existe).

### SEO (JSON-LD + Breadcrumbs + sitemap segmentado + robots)

**JSON-LD** ([src/components/seo/JsonLd.tsx](src/components/seo/JsonLd.tsx) helper):

- Layout/home: `WebSite` + `Organization`
- `/series/[id]` y `/catalogo/[id]`: `TVSeries` con name, alternateName, description, image, datePublished, countryOfOrigin, inLanguage, productionCompany, numberOfSeasons, numberOfEpisodes, actor, director, genre, keywords, aggregateRating
- `/ver/[id]`: `TVSeries` simplificada con `WatchAction`
- `/catalogo`, `/ver`, `/sitios`, `/noticias`: `CollectionPage` con `ItemList` (top 20-30)
- `/actores/[id]`, `/directores/[id]`: `Person`
- `/tags/[id]`: `CollectionPage`
- Cada `<Breadcrumbs>` emite `BreadcrumbList` automaticamente

**Robots y Sitemap**:

- [src/app/robots.ts](src/app/robots.ts): permite contenido publico, bloquea admin/api/perfil/notificaciones/watching/auth/scanners. Apunta a `/sitemap.xml`.
- [src/app/sitemap.ts](src/app/sitemap.ts): usa `generateSitemaps()` para segmentar en 7 sub-sitemaps:
  - `/sitemap/0.xml` static (home, /catalogo, /ver, /noticias, /novedades, /sitios, /creditos, /legal, /feedback, /estadisticas)
  - `/sitemap/1.xml` series — solo `catalogScope: 'PERSONAL'` (las del catalogo curado)
  - `/sitemap/2.xml` noticias — solo `status: 'PUBLISHED'`
  - `/sitemap/3.xml` ver — series con al menos un `Episode.embedUrl`
  - `/sitemap/4.xml` actores
  - `/sitemap/5.xml` directores
  - `/sitemap/6.xml` tags
- Next.js genera automaticamente `/sitemap.xml` como sitemap-index que apunta a los 7.
- `lastModified` por entidad sale de `updatedAt` → acelera re-crawl de lo que cambia.

---

## Flujos de Catalogo (CURATED / USER_EMBED + PERSONAL / WATCHABLE_ONLY)

`Series` tiene dos discriminadores ortogonales:

- **`origin`** (`'CURATED'` default | `'USER_EMBED'`): quien creo el row.
  - `CURATED`: Flor (admin) la subio al catalogo.
  - `USER_EMBED`: aportada por un user registrado via `/ver/agregar`.
- **`catalogScope`** (`'PERSONAL'` default | `'WATCHABLE_ONLY'`): donde aparece publicamente.
- **`visibility`** (`'VISIBLE'` default | `'HIDDEN'`): Flor puede ocultar aportes post-hoc.
- **`submittedById`**: User que aporto la USER_EMBED (nullable; on-delete SetNull).

Matriz publica:

| origin / scope                        | /catalogo | /ver (si tiene embedUrl) | /series/[id]                  | sitemap series | sitemap ver |
| ------------------------------------- | --------- | ------------------------ | ----------------------------- | -------------- | ----------- |
| CURATED + PERSONAL                    | ✓         | ✓                        | ✓                             | ✓              | ✓           |
| CURATED + WATCHABLE_ONLY              | —         | ✓                        | ✓                             | —              | ✓           |
| USER_EMBED + WATCHABLE_ONLY (VISIBLE) | —         | ✓                        | 404 (excepto submitter/admin) | —              | ✓           |
| USER_EMBED + WATCHABLE_ONLY (HIDDEN)  | —         | —                        | 404 (excepto submitter/admin) | —              | —           |

**Campos de embed en `Episode`:** `embedUrl`, `embedPlatform`, `embedVideoId`, `embedChannelName`, `embedChannelUrl`.

**Helpers en [src/lib/database.ts](src/lib/database.ts):**

- `getAllSeries({ scope, origin })` — `scope: PERSONAL|WATCHABLE_ONLY|ALL`, `origin: CURATED|USER_EMBED|ALL`.
- `getWatchableSeries()` — filtra `visibility=VISIBLE` + episodios con `embedUrl` (cualquier origin).
- `getWatchableSeriesById(id)` — filtra `visibility=VISIBLE`. Variante admin: `getWatchableSeriesByIdAdmin(id)` (sin filtro).
- `getSeriesById(id)` — filtra `origin=CURATED` (USER_EMBED no se sirve por aca). Variante admin: `getSeriesByIdAdmin(id)`.
- `getActorById`, `getTagById`, `getDirectorById`, `getCountryById`, `getUniverseById`, `getCatalogFilterIndex`, `getAllActorsWithCount`, `getAllDirectorsWithCount`, `getAllUniverses` — todos filtran sus `include.series` (o `_count.series`) por `origin=CURATED, catalogScope=PERSONAL` para no exponer aportes USER_EMBED en listings publicos. Actores/tags/etc. con count=0 quedan ocultos.

**API:**

- `POST /api/series/[id]/scope` — admin cambia `catalogScope` entre PERSONAL ↔ WATCHABLE_ONLY (solo CURATED).
- `POST /api/series/[id]/subscribe`, `POST /api/reviews` — rechazan con 422 si la serie es USER_EMBED (suscripcion/resena solo despues de linkear).

### Aporte de series por users (flow USER_EMBED)

Cualquier user registrado puede agregar series embebidas via `/ver/agregar`. UI cliente: [src/app/ver/agregar/AgregarVerClient.tsx](src/app/ver/agregar/AgregarVerClient.tsx).

**Endpoints (en [src/app/api/user/series/embed/](src/app/api/user/series/embed/)):**

- `POST /api/user/series/embed/preview` — body `{ url }`. Llama `buildEmbedPreview(url)` en [src/lib/user-embed-preview.ts](src/lib/user-embed-preview.ts), que combina oEmbed (YouTube/Vimeo/Dailymotion) o scrape og: (Bilibili) con Gemini ([src/lib/gemini.ts](src/lib/gemini.ts)) para autopoblar metadata. Devuelve `EmbedPreview` con `confidence: high|medium|low`. No persiste. Dedupe global por `Episode.embedUrl` (409 con `existingSeriesId`).
- `POST /api/user/series/embed/confirm` — persiste `Series` con `origin=USER_EMBED`, `visibility=VISIBLE`, `catalogScope=WATCHABLE_ONLY`, `submittedById=session.user.id` + `Season` + `Episode`. Upsert silencioso de tablas compartidas (`Actor/ProductionCompany/Tag/Language/Genre/Country` por nombre). Rate limit ([src/lib/rate-limit.ts](src/lib/rate-limit.ts)): max 5/h y 20/dia por user (429 + `Retry-After`).
- Plataformas soportadas: YouTube, Vimeo, Bilibili, Dailymotion. Otras → 422.

### Panel admin `/admin/series/user-submitted`

Lista de aportes USER_EMBED con acciones de moderacion ([src/app/admin/series/user-submitted/](src/app/admin/series/user-submitted/)):

- `POST /api/admin/user-series/[id]/visibility` — toggle VISIBLE/HIDDEN (HIDDEN saca del listing publico, admin sigue accediendo).
- `DELETE /api/admin/user-series/[id]` — borra el aporte (cascade limpia Episodes/tags/etc.).
- `POST /api/admin/user-series/[id]/link` — transaccion que mueve los `Episode` con embedUrl al `Season` equivalente de una serie `CURATED` target (crea Season si falta, enriquece episode destino sin embed, omite duplicados) y luego borra el USER_EMBED. Es la unica forma de "promover" un aporte: no se cambia el `origin` del row, se fusiona al row CURATED existente.

`/admin/series` (la tabla curada principal) ahora filtra `origin=CURATED` para no mezclar los aportes con el catalogo de Flor.

### Vista carrusel de `/catalogo` (opt-in, no reemplaza grid/list)

Tercer `viewMode` de `CatalogoClient.tsx` (`'grid' | 'list' | 'carousel'`), elegible por el usuario vía toggle en la toolbar — el default sigue siendo `'grid'`. Filas por categoría curada a mano (no una por cada género/país/plataforma), reordenables y ocultables por el usuario vía drag-and-drop (`@dnd-kit`), persistido en `localStorage`. **No reusa** `MediaCarousel`/`StreamingHub` de `/ver` (forma de datos distinta — `SerieData` vs `CarouselMediaItem`) ni se integra con `/catalogo/dashboard` (ese es un dashboard de estadísticas con el sistema de widgets pesado, sin relación).

- **Tipos compartidos**: [src/app/(app)/catalogo/catalogTypes.ts](<src/app/(app)/catalogo/catalogTypes.ts>) (`SerieData`, `CatalogItem`, etc. — antes vivían inline en `CatalogoClient.tsx`).
- **Agrupación por universo**: [src/app/(app)/catalogo/catalogGrouping.ts](<src/app/(app)/catalogo/catalogGrouping.ts>) → `groupIntoCatalogItems()`, compartida entre la grilla clásica y la categoría "Sagas y universos" del carrusel.
- **Pool de categorías**: [src/app/(app)/catalogo/carousel/catalogCarouselCategories.ts](<src/app/(app)/catalogo/carousel/catalogCarouselCategories.ts>) — array fijo en código (`CarouselCategoryDef[]`: id, label i18n, filtro, sort opcional). Países curados (Tailandia/Corea/Japón) elegidos por distribución real del catálogo, no adivinados.
- **Persistencia**: `localStorage['catalog-carousel-prefs']` = `{ order: string[]; hidden: string[] }`, manejado por `useCarouselPrefs.ts` — se reconcilia contra el pool actual en cada lectura (ids viejos se descartan, ids nuevos se agregan al final), así un storage vacío/corrupto/desactualizado siempre converge a un estado válido.
- **Componentes**: `CatalogCarouselView` (orquestador), `CatalogCarouselRow` (una fila, scroll horizontal calcado de `MediaCarousel.css`), `CarouselConfigDrawer` (drawer de reorder/hide, mismo patrón que `CustomizeDrawer` de `/perfil` + drag handles de `@dnd-kit/sortable`). Las cards individuales reusan `renderSingleCard`/`renderUniverseCard` de `CatalogoClient.tsx` (pasadas como render-prop) en vez de reconstruir esa lógica.

---

## Flujos de Importacion

### 1. Import de canal a `EmbeddableContent` (existente)

- **Ruta admin**: [/admin/contenido](src/app/admin/contenido/)
- **Endpoint**: `POST /api/contenido/import-channel`
- **Drawer**: [src/app/admin/contenido/ImportChannelDrawer/](src/app/admin/contenido/ImportChannelDrawer)
- **Caso de uso**: importar trailers/OSTs/clips/entrevistas sueltas de un canal de YouTube/Vimeo
- **Destino**: tabla `EmbeddableContent` (no se asocia automaticamente a una `Series`)
- Workflow: pegar URL de canal → preview de videos → seleccionar y categorizar → guardar

### 2. Import de playlist → Series + Episodes (IMPLEMENTADO)

- **Caso de uso**: pegar una playlist de YouTube de una serie completa (ej. GMMTV) y crear `Series` (default scope `WATCHABLE_ONLY`) + `Season` + `Episode[]` con todos los `embed*` poblados.
- **Ruta admin**: [/admin/series/importar](src/app/admin/series/importar/) → form para pegar URL + scope + opcional traduccion ES via Gemini → preview editable (titulo, año, pais sugerido por canal, sinopsis, tabla de episodios con renumerar/eliminar) → boton confirmar.
- **Helpers**:
  - [src/lib/channel-fetcher.ts](src/lib/channel-fetcher.ts) → `fetchYouTubePlaylist(url, pageToken?)` + `fetchAllYouTubePlaylistVideos(url, maxPages=10)`
  - [src/lib/episode-parser.ts](src/lib/episode-parser.ts) → `parseEpisodeTitle(title)` extrae `seasonNumber`, `episodeNumber`, `partNumber/partTotal` (para videos partidos como `[1/4]`), `cleanTitle` sin marcadores. Cubre `EP.X`, `Episode X`, `S1E12`, `1x01`, `Capitulo X`, `E01`. `inferSeriesTitle(cleanTitles[])` deduce el nombre por prefijo comun.
  - [src/lib/playlist-importer.ts](src/lib/playlist-importer.ts) → `buildImportPreview({url, autoTranslate, catalogScope, maxPages})` orquesta fetch + parse + traduccion + agrupacion por temporada + deteccion de duplicados/missing. Incluye mapping de canales → pais ISO (GMMTV→TH, BeOnCloud→TH, IdeaFirstCompany→PH, etc.).
- **Endpoints**:
  - `POST /api/series/import-playlist` (admin) → devuelve `ImportPreview` sin escribir DB
  - `POST /api/series/import-playlist/confirm` (admin) → persiste tras validar uniqueness `(seasonId, episodeNumber)` en una transaccion Prisma
- **Decision de producto sobre videos partidos** (`[1/4]`, `[2/4]`...): cada video → un Episode. Si dos parsean al mismo `episodeNumber`, la UI marca duplicados como warning bloqueante; el admin debe renumerar o eliminar antes de confirmar (boton "Renumerar 1..N" disponible). No hay campos `partNumber`/`partTotal` en `Episode` — solo se exponen como Tag informativo en el preview.

### 3. Barrido de canal → playlists candidatas (IMPLEMENTADO)

Paso PREVIO al importer de playlists. El importer resuelve "tengo la URL de una serie"; el barrido resuelve "de las 200 playlists de este canal oficial, cuales son series que valen la pena". Es lo que permite escalar /ver de a decenas de series en vez de una por vez.

- **Ruta admin**: [/admin/series/barrido](<src/app/(app)/admin/series/barrido/>) → pegar URL de canal (o tocar uno de los atajos) → tabla de playlists clasificadas → boton "Importar" por fila que abre el importer con `?url=` ya cargado.
- **Endpoint**: `POST /api/series/sweep-channel` (ADMIN + COLLABORATOR). Solo lee, no persiste. Devuelve 503 (no 500) cuando la API key esta vencida o ausente, que es su modo de falla mas comun.
- **Helpers**:
  - [fetchYouTubeChannelPlaylists](src/lib/channel-fetcher.ts) → lista todas las playlists publicas de un canal (1 unidad de cuota por pagina de 50).
  - [src/lib/channel-sweep.ts](src/lib/channel-sweep.ts) → `sweepChannel(url, importedTitles)` clasifica cada playlist en `CANDIDATE | ALREADY_IMPORTED | NOISE | TOO_SHORT`, con el motivo en texto para que el admin pueda no creerle.
- **Por que el filtro importa tanto como el fetch**: un canal como Dee Hup House mezcla la serie completa con `Highlights | X`, `Reaction | X`, `Next Episode | X`, `Shorts | X` y hasta una playlist POR episodio (`EP.12 | X`). Importar sin filtrar llena /ver de basura. `NOISE_PREFIXES` / `NOISE_KEYWORDS` en channel-sweep.ts son la lista negra; el minimo de videos es 4 (hay BL cortos legitimos de 4-5 episodios).
- **Deteccion de "ya importada"**: por titulo normalizado (`normalizeTitle`), NO por playlistId — el importer no guarda el playlist de origen. La comparacion es por **contencion**, no por igualdad: los titulos de playlist arrastran el canal (`Bad Buddy Series | GMMTV`) o el titulo original pegado adelante (`แค่เพื่อนครับเพื่อน BAD BUDDY SERIES`). Se cruza contra TODAS las series (incluido el catalogo curado) porque si el titulo ya existe ahi el admin querra linkear en vez de duplicar — es solo lectura de titulos, no mezcla los catalogos.
- **Canales precargados**: [officialChannels.ts](<src/app/(app)/admin/series/barrido/officialChannels.ts>). **Todos los handles fueron verificados uno por uno contra el titulo real del canal** — los handles "obvios" son casi siempre homonimos: `@BeOnCloud` es un canal personal indonesio, `@domundi` es "Ios 23:59", `@Strongberry` es un musico centroafricano. No agregar de memoria.

---

## Reproducibilidad de embeds en /ver (`Episode.playback`)

El catalogo de /ver **se pudre solo**: las productoras licencian series a Viki/iQIYI y geo-bloquean lo que estaba abierto, YouTube pone age-gates, los uploaders borran videos. Medido el 2026-09-06 desde IP argentina sobre las 24 series con episodios de YouTube: **18 OK, 5 parciales, 1 rota**. El mensaje exacto de YouTube en las bloqueadas es "Quien subió este video no permitió que estuviera disponible en tu país".

- **Campos** (en `Episode`): `playback` (enum `EpisodePlayback`: `UNKNOWN | OK | GEO_BLOCKED | AGE_RESTRICTED | REMOVED | NOT_EMBEDDABLE`), `playbackCheckedAt`, `playbackBlockedMarkets` (subset de `CORE_MARKETS`).
- **Relacion con `Series.geoRestrictedCore`**: ese flag sigue existiendo y es a nivel serie; `playback` es por episodio. Una serie puede tener los primeros capitulos bloqueados y el resto no (patron real de GMMTV). El audit **recalcula** `geoRestrictedCore` a partir de los episodios, asi deja de ser un snapshot manual del import.
- **Helper**: [src/lib/playability.ts](src/lib/playability.ts) — dos fuentes, NO intercambiables:
  - `probeViaApi` (preferida): `videos.list` con `contentDetails,status`. Devuelve `regionRestriction`, que lista los paises bloqueados de TODO el mundo en una sola llamada por cada 50 videos. Necesita `YOUTUBE_API_KEY`.
  - `probeViaWatchPage`: scrapea la watch page publica. Sin API key, pero **solo sabe del pais desde el que corre el proceso** — no asumir que el resto de los mercados estan bien porque dio OK.
  - `isPlayableIn(playback, blockedMarkets, market)`: `UNKNOWN` cuenta como reproducible **a proposito** — un episodio sin sondear no se esconde de /ver, es preferible mostrar de mas a vaciar la pagina porque el audit no corrio.
- **Script**: `npx tsx scripts/audit-ver-playability.ts` (`--dry-run`, `--limit N`, `--stale N`, `--source api|watch-page`, `--market AR`). Conviene correrlo periodicamente; sondear 1.800 episodios por API cuesta ~36 de las 10.000 unidades diarias.
- **UI**: `getWatchableSeries(market)` devuelve `playableEpisodes`. /ver muestra el badge `ver.partiallyUnavailableBadge` ("{count} de {total} disponibles acá") cuando hay bloqueo parcial; el badge de bloqueo total (`geoRestrictedBadge`) gana sobre el parcial. El color va por `--text-on-overlay`, un token que **no** se redefine por tema: el chip tiene fondo oscuro siempre.
- **Pendiente**: el `market` es fijo en `'AR'`. Para que respete al visitante real hay que leer el header `x-vercel-ip-country` en `/ver/page.tsx` y pasarlo a `getWatchableSeries`.

---

## Parrilla semanal de emision (`/estrenos`)

Que serie sale cada dia de la semana. Vive en la landing como banda (entre `landing__stats` y
`landing__novedades`) y en `/estrenos` como permalink. La banda es el producto: `/` recibe 249
visitas/mes contra 134 de `/catalogo` y 4 de `/glosario` — una ruta nueva y profunda nace con el
trafico del glosario.

**El dato es `Series.airDays`, NO `Episode.airDate`.** Medido el 2026-09-12 en produccion:

|                                                                 |                                         |
| --------------------------------------------------------------- | --------------------------------------- |
| Episodios con `airDate`                                         | 1.831 de 6.933                          |
| con `airDate` en los ultimos 7 dias                             | **2**                                   |
| en los ultimos 90 dias                                          | 41 — **las 41 de una sola serie**       |
| esa serie                                                       | id 655, `USER_EMBED` + `WATCHABLE_ONLY` |
| Series con `airDays`, `year >= 2026`, creadas hace < 16 semanas | **38, todas `CURATED` + `PERSONAL`**    |

`airDate` es el `publishedAt` de YouTube: un archivo historico de subidas (2022 -> 398 episodios,
2023 -> 315, 2024 -> 201), no un feed de estrenos. Una parrilla por fecha mostraria 2 episodios de
un aporte de usuario y habria filtrado `USER_EMBED` al catalogo curado. **La query no toca esa
columna**, asi que el blindaje es estructural y no hay heuristica que calibrar.

- **Helper**: [getAiringSchedule()](src/lib/database.ts) — `origin='CURATED'` +
  `catalogScope='PERSONAL'` + `visibility='VISIBLE'` explicitos. Payload podado a 9 campos
  (~8 KB): sin `synopsis`, `review`, `seasons`, `tags` ni `genres`.
- **Logica pura**: [src/lib/airing-schedule.ts](src/lib/airing-schedule.ts) — `AIR_DAY_MAP`,
  `parseAirDays`, `groupByWeekday`, `getAirDayStatus`. Se extrajo de
  `CurrentlyWatchingDashboard.tsx`, que la tenia privada y con las etiquetas en español
  hardcodeadas dentro de un componente traducido a 10 idiomas.
- **Componente**: [WeeklySchedule](src/components/estrenos/WeeklySchedule/WeeklySchedule.tsx) —
  sin texto propio (recibe `labels` via `useWeeklyScheduleLabels`), reusa `MediaCard` y `Chip`
  del design-system.

**Ventana de vigencia (`AIRING_WINDOW_WEEKS = 16`)**: `airDays` nunca se apaga — una serie que
termino en mayo sigue diciendo "jueves" para siempre, y publicar un horario falso es peor que no
publicar nada. Flor carga la serie cuando empieza a emitirse y una temporada BL dura 10-14
semanas. **La ventana caduca sola**: el error, cuando ocurre, es por omision (una serie muy larga
desaparece), nunca por afirmacion falsa. Cuando moleste, el reemplazo es `Series.airingUntil
DateTime?` (columna aditiva, override manual del admin) y `isAiringNow` gana una linea.

**Lo que la parrilla NO afirma, a proposito**: numero de capitulo (derivarlo de `createdAt` +
cadencia seria inventarlo), hora de emision (no existe el campo) ni "ya esta disponible"
(ninguna de las 38 tiene embed).

**Trampa de hidratacion**: "hoy" NO se calcula en el servidor. Con ISR y Vercel en UTC, el dia
queda congelado en el cache y da mal para un argentino despues de las 21:00. `WeeklySchedule` usa
`useSyncExternalStore` con `getServerSnapshot` devolviendo un centinela: el SSR renderiza lunes ->
domingo sin marca de hoy, y el cliente rota el orden con su dia real.

**Aviso de capitulo nuevo: no implementado.** No hay evento que detectar (las 38 series tienen 0
episodios con `airDate` y 0 con `embedUrl`) ni a quien avisarle (`SeriesSubscription` tenia 0
filas). La campanita de `/estrenos`
([ScheduleSubscribeToggle](src/components/estrenos/ScheduleSubscribeToggle/ScheduleSubscribeToggle.tsx),
contra el `POST|DELETE /api/series/[id]/subscribe` existente, con
[GET /api/user/subscriptions](src/app/api/user/subscriptions/route.ts) resolviendo las N en un
fetch) existe para que las suscripciones empiecen a acumularse. Cuando haya volumen, va como un
trabajo mas del cron diario (`/api/cron/daily`), con gate de calidad del dato: solo disparar si
`max(airDate) >= hoy-2d` **y** >= 3 episodios con `airDate` **y** espaciado mediano de 6-8 dias
(eso distingue una serie en emision de un volcado historico). Registrar el tipo nuevo en **los
dos** mapeos `type -> flag` de `src/lib/web-push.ts` (estan duplicados).

---

## Rol de colaborador externo (`COLLABORATOR`)

Cuarto valor del enum `Role` (junto a `ADMIN`/`MODERATOR`/`VISITOR`), pensado para productoras/proveedores de contenido externos (ej. XUXY) que Flor evalua y aprueba a mano — **nunca autoservicio**: solo un ADMIN asigna este rol desde `/admin/usuarios` (`PUT /api/users/[id]/role`).

- **Acceso**: admin reducido en `/admin/colaborador/**`, gateado en [src/proxy.ts](src/proxy.ts) — un COLLABORATOR no puede entrar a ningun otro `/admin/*` (redirect a `/catalogo`); si intenta, cae directo a `/admin/colaborador`. El resto de `/admin` sigue exactamente igual que antes (ADMIN/MODERATOR).
- **3 vistas** en [src/app/(app)/admin/colaborador/](<src/app/(app)/admin/colaborador/>):
  - `/admin/colaborador` — listado de series propias (`ColaboradorClient.tsx`), filtra `origin=USER_EMBED, submittedById=self`.
  - `/admin/colaborador/importar` — reusa [ImportarClient](src/app/admin/series/importar/ImportarClient.tsx) (`variant="collaborator"`): mismo flujo de playlist de YouTube que el importer de ADMIN, **pura YouTube Data API, sin Gemini** salvo que el propio colaborador tilde "traducir sinopsis" (una llamada por serie, no por video — no consume cuota relevante de `GEMINI_API_KEY`).
  - `/admin/colaborador/[id]` — ficha reducida (`CollaboratorSeriesForm.tsx`): titulo/sinopsis/poster/pais/productora/actores/tags/generos + [SeriesInfoBlocksManager](src/components/admin/SeriesInfoBlocksManager/SeriesInfoBlocksManager.tsx) embebido (mismo componente que usa ADMIN) + tabla de episodios (solo lectura, con link a "importar mas"). **No** expone campos curatoriales (`featured`, `review`, `overallRating`, `notesPrivate`, universo, series relacionadas — esos siguen 100% ADMIN-only).
- **Endpoints propios**: `POST /api/series/import-playlist(/confirm)` aceptan `COLLABORATOR` ademas de `ADMIN` y fuerzan server-side `origin=USER_EMBED`, `catalogScope=WATCHABLE_ONLY`, `submittedById=session.user.id` (ignoran lo que mande el body); `PATCH /api/colaborador/series/[id]` (ficha reducida). `DELETE /api/admin/user-series/[id]` y los 3 endpoints de `info-blocks` (`/api/series/[id]/info-blocks`, `/api/series/info-blocks/[id]`, `/api/series/[id]/info-blocks/reorder`) tambien aceptan `COLLABORATOR` sobre su propio aporte.
- **Ownership guard reusable**: [src/lib/collaborator-guard.ts](src/lib/collaborator-guard.ts) → `assertSeriesOwnership(seriesId, auth)` / `assertInfoBlockOwnership(blockId, auth)`. ADMIN/MODERATOR pasan siempre (mismo comportamiento pre-COLLABORATOR); COLLABORATOR solo si `origin=USER_EMBED && submittedById === auth.userId`. Usar en cualquier endpoint nuevo que un colaborador pueda tocar, siempre despues de `requireRole([...])`.
- **Rate limit propio**: [checkCollaboratorImportRateLimit](src/lib/rate-limit.ts) — 200 series/dia (vs. 5/hora + 20/dia de `checkUserEmbedRateLimit` para aportes casuales de usuarios comunes), pensado para onboarding masivo de un catalogo completo en pocas sesiones.
- **Chequeo de edad de YouTube** (defensa extra, no reemplaza la vetting manual del rol): [checkYouTubeAgeRestriction](src/lib/channel-fetcher.ts) — batchea `videos.list?part=contentDetails` de a 50 ids, lee `contentRating.ytRating === 'ytAgeRestricted'`. Solo se activa (`checkAgeRestriction: true`) para el importer de COLLABORATOR. Los videos marcados aparecen con warning y **des-tildados por defecto** en el preview (columna "Incluir" en `ImportarClient`, solo visible si hay al menos un episodio marcado) — el colaborador puede volver a tildarlos.
- **Publicacion**: inmediata (`visibility` default `VISIBLE`, igual que el resto de `Series.create` sin override explicito) — a diferencia de `/ver/agregar` para usuarios comunes, que arranca en `PENDING_REVIEW` si el submitter no es ADMIN/MODERATOR (ver `POST /api/user/series/embed/confirm`). La distincion es deliberada: COLLABORATOR ya paso por vetting humano al recibir el rol, un VISITOR anonimo no. Moderacion post-hoc sigue disponible en `/admin/series/user-submitted` (hide/delete/link) para AMBOS casos — ese panel ahora tambien muestra un tag "Colaborador" junto al nombre cuando el submitter tiene el rol.
- **Reseñas y suscripcion habilitadas en USER_EMBED** (antes solo reseñas estaban bloqueadas con 422): decision de Flor al construir este feature — "mientras no afecte al catalogo curado". Las vidrieras publicas que agregaban reseñas SIN filtrar `origin` (spotlight + contador de la landing en [src/app/page.tsx](src/app/page.tsx)) se corrigieron para excluir `USER_EMBED`. La UI de rating+reseñas se agrego a `/ver/[id]` ([VerSerieClient.tsx](<src/app/(app)/ver/[id]/VerSerieClient.tsx>)), condicionada a `isUserEmbed` (para CURATED+WATCHABLE_ONLY ya existe en `/series/[id]` via "Ver ficha completa", no se duplica). Favoritos y "marcar visto" ya funcionaban sobre USER_EMBED desde antes — no fue necesario tocarlos.
- **Sidebar**: item propio "Mi panel de colaborador" (`sidebar.collaboratorPanel`, i18n a 10 locales) visible solo para `role=COLLABORATOR`, en vez del item "Administracion" (que sigue sin mostrarse a este rol). Label de rol (`adminUsers.roleCollaborator`) tambien i18n'd — es el unico string nuevo de este feature que paso por los 10 locales: **el resto de `/admin/colaborador/**`queda hardcodeado en español**, mismo criterio que el resto de`/admin/\*` (`ImportarClient`, `UserSubmittedClient`, `SeriesForm`, etc. — ninguno usa `useLocale()`; el admin es una herramienta interna de Flor, no contenido público).
- **Upload de imagenes**: `POST /api/upload` ahora acepta `COLLABORATOR` ademas de `ADMIN`/`MODERATOR` (mismo endpoint, sin distincion de carpeta).

---

## Principios de Desarrollo

### SOLID

- **Single Responsibility**: Cada componente/archivo hace una sola cosa
- **Open/Closed**: Componentes extensibles via props
- **Liskov Substitution**: Componentes intercambiables via interfaces
- **Interface Segregation**: Props especificas, no interfaces genericas
- **Dependency Inversion**: Inyeccion de dependencias via props

### DRY & Buenas Practicas

- No repetir logica: extraer a helpers en `src/lib/` o hooks en `src/hooks/`
- Componentes reutilizables en `src/components/common/`
- Tipos compartidos en `src/types/`
- Constantes en `src/constants/`
- No usar `any` en TypeScript, usar tipos especificos o `unknown`

### Estilos

- **NO usar CSS-in-JS**. Estilos en archivos `.css` separados por componente
- Usar variables CSS definidas en `src/styles/variables.css`
- Temas claro/oscuro via atributo `[data-theme]` en HTML
- Preferir variables CSS sobre valores hardcodeados:
  ```css
  background: var(--bg-base);
  color: var(--text-primary);
  padding: var(--spacing-md);
  ```
- Tema de Ant Design configurado en `src/lib/theme.config.ts`

### Componentes

- Funcionales con hooks (no clases)
- Exportar con nombre (no default export)
- Props con interfaz TypeScript explicita
- Cada componente tiene su carpeta: `Component.tsx` + `Component.css`
- Usar componentes de Ant Design antes de crear personalizados
- Importar Ant Design individualmente: `import { Button, Input } from 'antd'`

### Nomenclatura

- Componentes: **PascalCase** (`SearchBar`, `PageTitle`)
- Archivos componentes: **PascalCase**, utilidades: **camelCase**
- Variables CSS: **kebab-case** (`--primary-color`, `--spacing-md`)
- Funciones: **camelCase** (`handleSearch`, `formatearFecha`)

---

## Estructura del Proyecto

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout raiz (Ant Design + ThemeProvider)
│   ├── page.tsx                  # Home → redirige a /catalogo
│   ├── api/                      # API REST endpoints
│   │   ├── series/               # CRUD series + ratings, comments, favorites, view-status, search
│   │   ├── seasons/              # CRUD temporadas + ratings, comments
│   │   ├── episodes/             # CRUD episodios + view-status, comments, generate
│   │   ├── actors/               # CRUD actores + merge duplicados
│   │   ├── directors/            # CRUD directores + merge duplicados
│   │   ├── tags/                 # CRUD tags + merge duplicados
│   │   ├── universes/            # CRUD universos
│   │   ├── languages/            # CRUD idiomas
│   │   ├── production-companies/ # CRUD productoras
│   │   ├── countries/            # Lectura paises
│   │   ├── genres/               # CRUD generos
│   │   ├── currently-watching/   # Series en curso (filtrado por usuario)
│   │   ├── contenido/            # CRUD contenido embebible + import de canales
│   │   ├── sitios/               # CRUD sitios recomendados + sugeridos
│   │   ├── feature-requests/     # Feedback + votos
│   │   ├── upload/               # Subida de imagenes (Supabase Storage)
│   │   ├── users/                # Gestion de usuarios
│   │   ├── admin/                # Logs, info del proyecto (solo admin)
│   │   ├── changelog/            # Changelog publico
│   │   └── build-info/           # Info de build/version
│   ├── catalogo/                 # Catalogo personal publico (scope PERSONAL)
│   │   ├── page.tsx              # Server component: fetch series
│   │   ├── CatalogoClient.tsx    # Client component: filtros, busqueda, paginacion
│   │   └── [id]/                 # Detalle de serie
│   ├── ver/                      # Catalogo "ver completo" (series con embedUrl)
│   │   ├── page.tsx              # Server: fetch via getWatchableSeries
│   │   ├── VerPage.tsx           # Client: filtros (busqueda, pais, plataforma, toggle "solo curadas")
│   │   ├── agregar/              # /ver/agregar - aporte user-embed (login-gated, IA autopobla)
│   │   └── [id]/                 # Player con seleccion de episodio (badge submitter para USER_EMBED)
│   ├── creditos/                 # Atribucion a canales oficiales (YouTube, etc.)
│   ├── legal/                    # Aviso legal sobre embeds y derechos
│   ├── contenido/                # Pagina publica de contenido embebible
│   ├── sitios/                   # Pagina publica de sitios recomendados
│   ├── admin/                    # Panel de administracion
│   │   ├── page.tsx              # Tabla de series
│   │   ├── series/nueva/         # Crear serie
│   │   ├── series/[id]/editar/   # Editar serie
│   │   ├── series/user-submitted/# Panel de moderacion de aportes USER_EMBED (hide/delete/link)
│   │   ├── actores/              # Gestion actores
│   │   ├── directores/           # Gestion directores
│   │   ├── tags/                 # Gestion tags
│   │   ├── universos/            # Gestion universos
│   │   ├── idiomas/              # Gestion idiomas
│   │   ├── productoras/          # Gestion productoras
│   │   ├── sitios/               # Gestion sitios recomendados
│   │   ├── contenido/            # Gestion contenido embebible + import canales
│   │   ├── usuarios/             # Gestion usuarios y roles
│   │   ├── logs/                 # Access logs con filtros clickeables
│   │   └── info/                 # Info del proyecto (links, equipo)
│   ├── feedback/                 # Feedback + Changelog
│   ├── actores/[id]/             # Perfil de actor
│   ├── directores/[id]/          # Perfil de director
│   ├── series/[id]/              # Detalle de serie (publica)
│   └── watching/                 # Dashboard "Viendo ahora"
├── components/
│   ├── layout/                   # AppLayout, Header, Sidebar, BottomNav
│   ├── common/                   # PageTitle, SearchBar, CommentsList, EmbedPlayer,
│   │                             # ContentDisclaimer, CountryFlag
│   ├── series/                   # SeriesHeader, SeriesInfo, SeasonsList, EpisodesList,
│   │                             # RatingSection, CommentsSection, ViewStatusToggle
│   ├── admin/                    # SeriesForm, SeasonForm, SeasonEditForm, SeriesContentManager
│   └── watching/                 # CurrentlyWatchingDashboard
├── lib/
│   ├── database.ts               # Helpers de acceso a DB (Prisma)
│   ├── supabase.ts               # Cliente Supabase Storage (upload/delete/downloadAndUpload)
│   ├── auth.ts                   # Configuracion NextAuth
│   ├── auth-helpers.ts           # requireAuth, requireRole
│   ├── access-log.ts             # Registro y consulta de access logs
│   ├── embed-helpers.ts          # Helpers para contenido embebible (YouTube, etc.)
│   ├── channel-fetcher.ts        # Importacion de videos de canales de YouTube
│   ├── country-codes.ts          # Codigos de pais
│   ├── theme.config.ts           # Configuracion tema Ant Design
│   ├── utils.ts                  # Utilidades generales
│   └── providers/ThemeProvider.tsx
├── hooks/                        # useMediaQuery, useMessage
├── types/                        # series.types.ts, content.ts, person.types.ts, theme.types.ts
├── constants/                    # navigation.ts, series.ts, sitios.ts
├── styles/                       # globals.css, variables.css, dark-mode-fixes.css
└── generated/prisma/             # Cliente Prisma generado (no editar)
```

---

## Patron de Datos (Server → Client)

```
page.tsx (Server Component)
  → Llama a src/lib/database.ts (Prisma query)
  → Pasa datos como props a *Client.tsx (Client Component)
  → Client Component maneja interactividad y estado
  → Cambios del usuario → API call (fetch a /api/*) → Actualizar UI
```

### Acceso a Base de Datos

```typescript
// En Server Components o API routes:
import {
  getAllSeries,
  getSeriesById,
  searchSeriesByTitle,
} from '@/lib/database';

// Funciones disponibles:
// Series: getAllSeries, getSeriesById, searchSeriesByTitle, getSeriesByCountry, getSeriesByType
// Actores: getAllActors, getActorById, searchActorsByName, getAllActorsWithCount
// Directores: getAllDirectors, getDirectorById, searchDirectorsByName, getAllDirectorsWithCount
// Paises: getAllCountries, getCountryById
// Universos: getAllUniverses, getUniverseById
// Stats: getStats, getViewStats
```

---

## Base de Datos (Prisma + Supabase)

### Schema: `prisma/schema.prisma`

**Modelos principales:**

- `Series` - Series/peliculas/cortos. Campos discriminadores: `catalogScope` (`PERSONAL` | `WATCHABLE_ONLY`), `origin` (`CURATED` | `USER_EMBED`), `visibility` (`VISIBLE` | `HIDDEN`), `submittedById` (User ref nullable)
- `Season` - Temporadas por serie
- `Episode` - Episodios. Campos de embed: `embedUrl`, `embedPlatform`, `embedVideoId`, `embedChannelName`, `embedChannelUrl`
- `Actor` - Actores
- `Director` - Directores
- `Country` - Paises

**Modelos de relacion:**

- `SeriesActor`, `SeasonActor` - Actores por serie/temporada (con pairingGroup)
- `SeriesDirector` - Directores por serie
- `SeriesTag` - Tags por serie
- `SeriesGenre` - Generos por serie
- `SeriesDubbing` - Idiomas de doblaje
- `RelatedSeries` - Series relacionadas (bidireccional)

**Modelos de metadata:**

- `Universe` - Agrupacion de series relacionadas
- `Tag` - Etiquetas (tropes, genres, moods)
- `Genre` - Generos
- `ProductionCompany`, `Language`
- `Rating` - Calificaciones por categoria (trama, casting, BSO, etc.)
- `UserRating` - Calificaciones de usuarios
- `Comment` - Comentarios en serie/temporada/episodio (con userId)
- `ViewStatus` - Estado de visualizacion (`WatchStatus` enum, por usuario)

**Modelos de contenido:**

- `SeriesInfoBlock` - Cards labeladas libres por serie ("Basado en", "Curiosidades", "Premios"...). Render publico solo si tiene contenido. Editables desde `/admin/series/[id]/editar` via `SeriesInfoBlocksManager`.
- `EmbeddableContent` - Contenido embebido (trailers, OSTs, entrevistas)
- `RecommendedSite` - Sitios recomendados curados por admin
- `SuggestedSite` - Sitios sugeridos por la comunidad
- `WatchLink` - Plataformas donde ver cada serie

**Modelos de feedback:**

- `FeatureRequest` - Solicitudes de bugs/features/ideas con status y prioridad
- `FeatureRequestImage` - Imagenes adjuntas a solicitudes
- `FeatureVote` - Votos de usuarios en solicitudes

**Modelos de sistema:**

- `User`, `Account`, `Session`, `VerificationToken` - NextAuth
- `AccessLog` - Visitas (solo ruta y hora, sin IP ni usuario), intentos de ataque (`ABUSE`, con IP, se borran a los 7 dias), acciones del equipo y corridas del cron. El cron diario borra el resto a los 90 dias (ver `/privacidad`)
- `BannedIp` - IPs bloqueadas

**Enums:**

- `Role` - USER, MODERATOR, ADMIN
- `WatchStatus` - SIN_VER, VIENDO, VISTA, ABANDONADA, RETOMAR

### Migraciones

```bash
# Generar cliente Prisma despues de cambios al schema
npx prisma generate

# Crear migracion SOLO contra PostgreSQL local (DIRECT_URL local)
npx prisma migrate dev --name descripcion_del_cambio

# Aplicar migraciones en produccion (Vercel lo hace automaticamente en build)
npx prisma migrate deploy

# Ver estado de migraciones
npx prisma migrate status

# Verificar que la base coincide con el schema (solo lectura)
npm run db:check

# Abrir Prisma Studio (UI para explorar datos)
npx prisma studio
```

**Nota:** El build command en Vercel es `prisma generate && next build --webpack`. Prisma genera el cliente automaticamente antes de cada build.

---

## Guia de Cambios Comunes

### Agregar una nueva pagina

1. Crear carpeta en `src/app/nombre-pagina/`
2. `page.tsx` (Server Component) - fetch de datos
3. `NombreClient.tsx` (Client Component) - UI interactiva
4. `nombre.css` - Estilos
5. Agregar ruta en `src/constants/navigation.ts`

### Agregar un nuevo componente

1. Crear carpeta en `src/components/categoria/NombreComponente/`
2. `NombreComponente.tsx` - Logica
3. `NombreComponente.css` - Estilos
4. Exportar con nombre: `export function NombreComponente()`

### Agregar un endpoint API

1. Crear `src/app/api/recurso/route.ts`
2. Exportar funciones HTTP: `GET`, `POST`, `PUT`, `DELETE`
3. Proteger con `requireAuth()` o `requireRole(['ADMIN'])`
4. Usar helpers de `src/lib/database.ts` o Prisma directo
5. Retornar `NextResponse.json()`

### Modificar filtros del catalogo

- Filtros estan en `src/app/catalogo/CatalogoClient.tsx`
- Tipos de filtro en `src/types/series.types.ts`

### Modificar tema/estilos globales

- Variables CSS: `src/styles/variables.css`
- Tema Ant Design: `src/lib/theme.config.ts`
- Skins: `src/styles/skins/<nombre>.css` (ver "Sistema de skins" abajo)
- Dark mode fixes: `src/styles/dark-mode-fixes.css` (limpiado a 113 lineas, sin `!important`. Solo quedan reglas para componentes que AntD no expone como token)

---

## Sistema de skins

Las skins son una dimension visual ortogonal a `theme` (light/dark), `tone` (default/warm/cool/contrast), `accent` (los 11 presets) y `density`. Una skin remapea los tokens base (`--bg-*`, `--text-*`, `--border-*`, `--radius-*`, `--shadow-*`) a una paleta nueva, y opcionalmente aplica overrides al shell (sidebar, topbar, content area).

**Skins disponibles:**

| Skin      | Archivo                                                                | Cuando aplica                                                                                                                                                                                                                              |
| --------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `default` | (sin archivo)                                                          | Default — usa tokens base de [variables.css](src/styles/variables.css)                                                                                                                                                                     |
| `premium` | [src/styles/skins/premium-dark.css](src/styles/skins/premium-dark.css) | Solo cuando `data-theme='dark'`. Paleta premium dark (`#090911`/`#11101d`/`#171423`/`#211b32`), bordes sutiles `rgba(255,255,255,0.06–0.14)`, sombras soft, radii 14/18. Expone tambien `--mb-*` para componentes nuevos del design-system |

**Como agregar una skin nueva:**

1. Crear `src/styles/skins/<nombre>.css` con `html[data-skin='<nombre>'] { ... }`
2. Importarla en [src/styles/skins/index.css](src/styles/skins/index.css)
3. Agregar la key a `SkinKey` en [src/types/theme.types.ts](src/types/theme.types.ts)
4. Sumar la opcion al toggle en [src/components/layout/SettingsPanel/SettingsPanel.tsx](src/components/layout/SettingsPanel/SettingsPanel.tsx)
5. Agregar las claves i18n `settings.skinDefault`/`<nombre>` en `messages.ts` y los 10 locales
6. Si la skin requiere tokens distintos en AntD ConfigProvider (Layout, Modal, Tooltip), extender `buildTheme(mode, accent, skin)` en [src/lib/theme.config.ts](src/lib/theme.config.ts)

**ATENCION sobre el accent dorado de la skin premium:** NO esta hardcodeado. El "dorado" sale del accent que el usuario eligio en Settings (en este caso, probablemente `amber`). Si se elige otro accent, la skin sigue siendo coherente — los items selected/focus/primary toman el accent del usuario via `--primary-color`. Cualquier hex tone-of-brand hardcodeado en componentes nuevos rompe esto: usar siempre tokens.

---

## Design system primitivos

[src/components/design-system/](src/components/design-system/) — primitivos sin texto hardcodeado (cada componente recibe el texto via props/children traducidos por la pagina).

| Componente      | Cuando usar                                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `PanelCard`     | Wrapper de `Card` con variant (default/soft/flat) + slots header/footer. Reemplaza `<Card>` directos en paginas refactorizadas   |
| `SectionHeader` | Title + subtitle + actions, 3 sizes (sm/md/lg), heading semantico ajustable                                                      |
| `StatCard`      | Label + value + delta (up/down/neutral) + icon. Para KPIs de paneles                                                             |
| `ActionCard`    | Icon + title + description + badge. Para grids de quick actions                                                                  |
| `MediaCard`     | Cover (aspect ratio 2:3 default, 16:9, 1:1) + title + subtitle + overlay tags + actions on hover. Para grids de series/peliculas |
| `Chip`          | Pills con tones (neutral/accent/success/warning/error/info), opcional toggle clickable                                           |
| `EmptyState`    | Icon + title + description + action. Para listas vacias                                                                          |

Convencion: ningun primitivo contiene texto fijo, ningun hex de marca. Todo via tokens CSS y props.

---

## Sistema de dashboards modulares

Cada vista premium se monta como un grid responsive de **widgets reordenables y resizables**. Cada usuario puede customizar su layout y se sincroniza entre dispositivos via DB.

**Stack:**

- `react-grid-layout@2.x` (~80kb gzipped). API v2 sin `WidthProvider` — usa el hook `useContainerWidth`.
- Persistencia: localStorage como cache + DB (model `UserDashboardLayout`) como source of truth cross-device.

**Arquitectura:** [src/components/dashboard/](src/components/dashboard/)

- `DashboardGrid` — wrapper de `Responsive` de react-grid-layout. Recibe `layouts` por breakpoint (lg/md/sm/xs/xxs), `widgetProps` por id, flag `editing`, callbacks `onLayoutsChange` + `onRemoveWidget`.
- `Widget` — panel premium con header (icono + title + actions), drag handle (visible solo en editing) y remove btn. Si vive en un grid, lee meta via `DashboardItemContext`; si no, acepta props.
- `WidgetRegistry` — registro singleton donde cada feature registra sus widgets con id + categoria + roles + modos + defaultSize + Component.
- `useDashboardLayout(key, defaults)` — hook con persistencia 3-capas (server > localStorage > defaults). Debounce 600ms al server. Si no auth, cae a localStorage solo.
- `DashboardEditToolbar` — toggle "Editar layout"/"Listo" + "Agregar widget" + "Reset".
- `WidgetPickerDrawer` — drawer con widgets del registry filtrados por roles/modo/categoria.

**Vistas dashboard implementadas (todas opt-in via URL alterna, la vista clasica queda intacta):**

| Vista             | Ruta                       | Widgets                                                                                                                                                                                                                                                                                                       | dashboardKey    |
| ----------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Perfil de usuario | `/perfil` (= dashboard)    | Overview, Ratings, RecentlyCompleted, Notifications, MyCases, Heatmap, GenresDonut, CompletedByYear, TopGenresList, TopCountriesList, CurrentlyWatching, TopActors, TopCompanies, TopRated, Favorites, MyReviews, MyDisputes, MyComments. Footer: ProfileSettings + SubscriptionsSection + ClientVersionInfo. | `profile-v3`    |
| Detalle de titulo | `/catalogo/[id]/dashboard` | Hero, Info, Actors, Ratings                                                                                                                                                                                                                                                                                   | `series-detail` |
| Catalogo          | `/catalogo/dashboard`      | Stats globales, RecentlyAdded                                                                                                                                                                                                                                                                                 | `catalogo`      |
| Admin home        | `/admin/dashboard`         | KPIs, Alerts                                                                                                                                                                                                                                                                                                  | `admin-home`    |

**Convencion `fade` en Widgets:** los widgets cuyo contenido puede exceder la altura del cell del grid pasan `fade={true}` al `<Widget>` para activar un degradado fade-out abajo. Reemplaza el `overflow: auto` previo (scrollbar interno feo). Casos: listas largas (RecentlyCompleted, CurrentlyWatching, Notifications, MyCases, TopActors, etc.) y MyCommentsWidget que sí mantiene scroll interno explícitamente porque su lista paginada no se presta al fade.

**Layout footer del dashboard de perfil:** abajo del grid se renderizan `ProfileSettings` + `SubscriptionsSection` + `ClientVersionInfo` como bloque fijo (no son widgets reordenables — son singletons que se esperan en una posicion estable). Ver `mb-perfil-dashboard__footer*` en [dashboard.css](src/app/perfil/dashboard/dashboard.css).

**Como agregar una vista dashboard nueva:**

1. Crear `src/app/<ruta>/dashboard/page.tsx` (Server Component) que fetchea data y pasa al Client.
2. Crear `DashboardClient.tsx` (Client) que: (a) registra los widgets en `WidgetRegistry` con `useMemo`; (b) usa `useDashboardLayout('<key>', DEFAULT_LAYOUTS)`; (c) pasa `widgetProps` a `<DashboardGrid>`.
3. Crear cada widget en `widgets/<NombreWidget>/<NombreWidget>.tsx` envolviendo el contenido en `<Widget>`. Recibir datos por props.
4. Agregar las i18n keys del dashboard (`<vista>Dashboard.*`) al shape de `messages.ts` y los 10 locales.
5. Agregar un link "Ver dashboard" desde la vista clasica.

**Persistencia DB:** [src/app/api/user/dashboards/[key]/route.ts](src/app/api/user/dashboards/[key]/route.ts) — GET/PUT/DELETE. Scoped por `session.user.id`. El hook `useDashboardLayout` hace write-through automatico cuando el usuario esta autenticado.

### Agregar una integracion externa (API de terceros)

1. Agregar la env var en `.env.example` con un comentario describiendo el uso
2. Agregar la env var en Vercel (production)
3. Crear el helper en `src/lib/<nombre>-fetcher.ts` o `src/lib/<servicio>.ts`
4. Documentar en este archivo (`context.md`) bajo "Integraciones Externas":
   - Que env var necesita
   - Que helper expone (signature + ejemplo de retorno)
   - Que casos de uso cubre y cuales NO
5. Si genera datos persistidos, mencionar el modelo Prisma destino

### Mantener `context.md` al dia

**Regla**: cada vez que se agrega una feature, integracion, modelo, env var, ruta nueva o flujo, actualizar este archivo en el mismo PR. Los flujos paralelos (ej. `/catalogo` vs `/ver`) deben quedar documentados con su scope, helpers y diferencias.

---

## Backlog (FeatureRequest)

### Triage 2026-05-13

Triage completo del backlog (`FeatureRequest`) categorizado por area funcional + scoring `effort/impact` para identificar quick wins. Detalle en [docs/backlog-triage-2026-05-13.md](docs/backlog-triage-2026-05-13.md).

- **Persistencia de categoria**: prefijo en `FeatureRequest.description` con forma `[cat:X][effort:Y][impact:Z]` (sin migracion; idempotente; reversible).
- **Categorias** (10): noticias, directores, ai, catalogo, perfil, admin, i18n, seo, cleanup, infra.
- **Effort**: S ≤2h, M ≤6h, L 1-2 dias, XL ≥3 dias. **Impact**: H/M/L. **Quick win** = `(S∧H) ∨ (S∧M) ∨ (M∧H)`.
- **Scripts**:
  - `npx tsx scripts/triage-backlog-2026-05-13.ts` — dry-run que infiere y muestra tabla por categoria.
  - `npx tsx scripts/triage-backlog-2026-05-13.ts --apply` — escribe prefijos.
  - `npx tsx scripts/triage-backlog-2026-05-13.ts --report` — regenera el .md.
  - `npx tsx scripts/audit-2026-05-13.ts [--apply]` — audit comments en items con cobertura parcial (#109/#110/#111) + creates de items del slice 1.

### Slice 1 (2026-05-13) — quick wins (4 items, ~8h)

1. **Audit + creates de items** (Item 1): `scripts/audit-2026-05-13.ts`.
2. **Triage script + report** (Item 2): `scripts/triage-backlog-2026-05-13.ts` + `docs/backlog-triage-2026-05-13.md`.
3. **Score de completitud de series** (admin/editor): [src/lib/series-completeness.ts](src/lib/series-completeness.ts) — helper puro `computeCompleteness(series) → { score, missing }`. UI: `CompletenessCard` en `/admin/series/[id]` + widget `SeriesIncompletasWidget` en `/perfil` (solo rol admin, diferido).
4. **Director links basicos**: campos `Director.aliases`, `imdbUrl`, `mdlUrl`, `wikiUrl` (migracion `add_director_aliases_and_external_links`). Render en [src/app/directores/[id]/DirectorProfileClient.tsx](src/app/directores/[id]/DirectorProfileClient.tsx) como fila de iconos + Chip list de aliases.

### Slice 2 (2026-05-13) — Director rico fase 2 (commit 0c726b9)

1. **Schema:** `Director.birthYear Int?` + `Director.awards String[] @default([])`. Migracion `add_director_birth_year_and_awards`.
2. **Admin** (`/admin/directores`): `InputNumber` (range 1900..año actual) para birthYear + `Select mode="tags"` con separador `;` para awards.
3. **Publico** (`/directores/[id]`): chip de año (`n. 1985`) + seccion "Premios" con trofeo + lista. Nueva seccion **"Obras destacadas"** entre el header y la filmografia: auto-derivada del top 3 series por `overallRating` (solo si ≥2 series tienen rating; no inventa data). Cards con borde gold + tag de rating.
4. **JSON-LD:** suma `birthDate` (año) + `award` (lista) al schema Person.

Items que se decidió **no** incluir en este slice:

- Tags sensibles → reformulado como **policy doc editorial** (no codigo), va a `docs/`.
- IMDB/MDL precarga, UserList/Collection, Command palette, Push UI, Achievements → roadmap.

---

## Notas técnicas / gotchas

- **Íconos de antd en Server Components**: importar de `@ant-design/icons` en un Server Component ROMPE el build (`createContext is not a function`): su barrel corre `createContext` sin `'use client'` y el entorno RSC no tiene `createContext`. Regla: en Server Components (page.tsx/layout/loading sin `'use client'`), importar íconos desde [src/lib/client-icons.ts](src/lib/client-icons.ts) (re-export `'use client'`). Los Client Components pueden importar de `@ant-design/icons` directo. Mismo motivo por el que el `App` de antd se usa vía [src/lib/providers/AntdApp.tsx](src/lib/providers/AntdApp.tsx), no importado en el layout server. `next.config.ts` NO debe poner `antd`/`@ant-design/icons` en `transpilePackages` (anula el barrel-optimization y reintroduce el crash); se usa `experimental.optimizePackageImports` en su lugar.
- **Headers de seguridad**: [next.config.ts](next.config.ts) `headers()` define CSP completa + `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `HSTS`. `img-src` es amplio (`'self' data: blob: https:`) a propósito: cargamos favicons externos (Google S2 via `getFaviconUrl`) y URLs de imagen legacy; restringirlo por host rompe logos/favicons (ej. /sitios). `frame-src` SÍ es lista blanca de los embeds soportados (clickjacking) — al sumar una plataforma de embed nueva, agregar su host ahí. `images.remotePatterns` (para next/image optimizado) es independiente y sí es por-host.
- **RLS (Supabase)**: toda tabla nueva del schema `public` debe recibir `ALTER TABLE "X" ENABLE ROW LEVEL SECURITY` en su migración (Prisma usa el rol owner que bypassa RLS; sin esto la anon key expone la tabla vía PostgREST). Patrón en `prisma/migrations/*_enable_rls*`.
- **Ban en API**: `requireAuth`/`requireRole` ([src/lib/auth-helpers.ts](src/lib/auth-helpers.ts)) chequean `banned` → 403. El middleware (`proxy.ts`) no cubre `/api` (su matcher lo excluye).
- **Storage de imagenes**: todo pasa por `uploadImage()` en [src/lib/supabase.ts](src/lib/supabase.ts) — es el unico punto de subida (`/api/upload`, `/api/feedback/upload` y el re-hosteo de imagenes externas). Sube a **Cloudflare R2** si estan las 5 vars `R2_*`; si no, cae a Supabase Storage con un `console.warn` (Supabase cobra egress, R2 no). `downloadAndUploadExternalImage` no re-procesa una URL que ya servimos nosotros — chequea los DOS hosts, si no cada guardado de una serie duplicaria el poster.
- **Convención `unoptimized` en `<Image>`**: `unoptimized={isDirectServedImageUrl(url)}` (lo que servimos nosotros se sirve crudo; lo externo va al optimizador). NO invertir con `!`. Desde 2026-09-09 los posters viven en Cloudflare R2 (`img.mundobl.com.ar`), no en Supabase Storage: R2 no cobra egress y ya sale por el CDN de Cloudflare con `cache-control: immutable` a un año, asi que pasarlo por el optimizador de Vercel solo gastaria cuota. El helper cubre los dos hosts porque los archivos de Supabase quedaron como respaldo.
- **Rate limiting**: [src/lib/rate-limit.ts](src/lib/rate-limit.ts) — `checkCommentRateLimit`, `checkFeatureRequestRateLimit`, `checkUserEmbedRateLimit` (cuenta filas Prisma por ventana, sin tabla auxiliar).
- **Orden de estilos antd vs. los nuestros**: con SSR, el `<style>` de antd llega en el stream después de nuestras hojas y, a igual especificidad (`:where(.css-x).ant-*`), les gana. [src/lib/providers/AntdStyleOrder.tsx](src/lib/providers/AntdStyleOrder.tsx) (adentro de `AntdRegistry`) lo mueve antes del primer `<link data-precedence>`. No usar `layer` de cssinjs: el reset `* { margin: 0; padding: 0 }` de `globals.css` sin capa pisaría todo antd.
- **Botón atrás**: [NavigationGuard](src/components/layout/NavigationGuard/NavigationGuard.tsx) inyecta una entrada "padre" cuando se entra desde afuera y la navega con el router en `popstate` (el browser solo cambia la URL). Las rutas de detalle llevan slug: los patrones son `[^/]+`, no `\d+`.
- **Para ver acá / para seguir**: `navItems.ts` agrupa la navegación por `section` (`watch`, `follow`, `explore`); Sidebar y el cajón "Más" usan los mismos grupos. `SerieData.watchableHere` sale de `getCatalogFilterIndex().watchableIds` (PERSONAL + CURATED + `HAS_WATCHABLE_EPISODE`): casi todo lo de /ver es WATCHABLE_ONLY y no está en el catálogo, así que el chip "Se ve acá" aparece poco y es correcto.
- **Avisos descartables**: `DismissibleNotice` (design system) + `useDismissedNotice(id)`, un array de ids en `localStorage['mundobl.dismissedNotices']`. Mismo id en dos páginas = mismo aviso. En el servidor cuentan como cerrados.
- **Seguimiento automático en `/ver`**: `EmbedPlayer` activa la YouTube IFrame API solo cuando recibe `onWatchProgress`. `useYouTubeWatchTime` acumula tiempo reproducido real (los saltos no cuentan), marca una parte al 80 % y avisa `ended` para avanzar únicamente a la parte siguiente del mismo capítulo. Al terminar el capítulo no reproduce otro automáticamente.
- **Progreso sin sesión**: `localStorage['mundobl.localProgress']` guarda por serie los ids vistos con schema `{ v: 1, series }`, manejado por `src/lib/local-progress.ts`. `SeriesUserStatusProvider` expone `storage: 'account' | 'local'`; `useMarkEpisodes` y el stepper escriben localmente sin mandar al login. `LocalProgressImporter`, montado en `AppLayout`, ofrece copiarlo a la cuenta después de autenticarse y borra cada serie local solo cuando su POST termina bien.

## Comandos

### Portabilidad del seguimiento (2026-09-26)

- `GET /api/user/account/export` incluye `seriesNotes` y `episodeNotes` privadas, además de los estados de serie, temporada y episodio. Las secciones nuevas son opcionales en el formato `schemaVersion: 1`.
- `POST /api/user/account/import` restaura esos tres niveles de progreso y las notas mediante `restoreTrackingBackup` en `database.ts` y el planificador puro `tracking-backup.ts`. Conserva fechas de visionado/última actividad y fechas del diario; rechaza fechas inválidas y referencias múltiples en un mismo estado.
- Es restauración por combinación: no reemplaza registros existentes, no crea contenido editorial y siempre usa el usuario de la sesión. La vista previa de seguimiento/notas descuenta duplicados tanto de la cuenta como del archivo. Estas tres secciones se guardan juntas en una transacción; las restantes secciones del importador conservan su flujo anterior.
- La vista previa en ProfileSettings identifica las secciones en los 10 idiomas y muestra advertencias de referencias ausentes y registros inválidos. Los errores de validación de notas no incluyen su contenido.
- Ver `docs/seguimiento-respaldo.md` para formato y límites. Prueba sin base de datos: `npx tsx scripts/test-tracking-backup.ts`. La importación por títulos/CSV/IA, la edición con conflictos y el historial de vueltas siguen pendientes.

### Espacio de seguimiento (2026-09-26)

- `/watching` usa `CurrentlyWatchingDashboard/` con búsqueda, filtros Viendo/Retomar, orden, vistas lista/tarjetas y series fijadas. Las preferencias se guardan por usuario en este dispositivo, sin sincronización entre dispositivos.
- `WatchingSeriesCard` marca el siguiente capítulo; solo envía las partes todavía no vistas. `WatchingEpisodeDrawer` reutiliza el control de progreso y temporadas existente, y hace explícitas las acciones Nota privada y Conversación pública. El diario existente aparece como segunda pestaña.
- `watching-collection.ts` concentra selección y progreso. Conserva la convención de próximo capítulo posterior al último marcado; si quedan huecos anteriores se informa, sin anunciar una serie completa. Las estadísticas de esta pantalla se limitan a series en curso.
- `/api/currently-watching` selecciona los campos necesarios sin reseñas ni observaciones editoriales. El diario privado usa `no-store` y enlaza los aportes USER_EMBED a `/ver`, incluyendo el episodio cuando corresponde.
- Pruebas: `npx tsx scripts/test-watching-collection.ts` y `node scripts/test-watching-ui.mjs`. La segunda necesita el servidor local en 3100 y Playwright; intercepta todas las APIs con datos sintéticos y comprueba marcado, partes, preferencias, notas, comentarios y diseño móvil. No valida persistencia real en PostgreSQL ni producción.
- Pendientes: historial de eventos/vueltas y edición de fechas, biblioteca con todos los estados, preferencias sincronizadas y espacio de comunidad. El diario de notas no equivale a un historial completo de visionado.

### Referencias editoriales en aportes (2026-09-26)

- Corrección del comportamiento histórico de `/api/colaborador/series/[id]` y `/api/user/series/embed/confirm`: estos flujos ahora solo asocian actores, etiquetas, géneros, productoras, idiomas y países existentes. No ejecutan altas ni actualizaciones sobre esas entidades compartidas, incluso si los invoca un administrador. La gestión editorial mantiene sus endpoints propios.
- `getContributionMetadata` en `database.ts` consulta las referencias; `contribution-metadata.ts` resuelve nombres sin distinguir mayúsculas, deduplica asociaciones y rechaza nombres ausentes o ambiguos. El rechazo 422 ocurre antes de mutar y los formularios conservan sus valores con una explicación persistente traducida a diez idiomas. Los nombres nuevos aún requieren incorporación editorial; no se crea una propuesta automática.
- `GET /api/contribution-metadata` requiere sesión, acepta solo cinco tipos permitidos y devuelve hasta 30 nombres por búsqueda. `ContributionMetadataField` reutiliza Ant Design Select en los formularios público y de colaborador, con búsqueda remota, cancelación de consultas y reintento. El selector permite elegir entidades existentes; no dar de alta vocabulario.
- El guard de colaboradores exige propiedad + `USER_EMBED` + `WATCHABLE_ONLY`. PATCH de ficha vuelve a comprobar esos campos en el UPDATE dentro de la transacción, incluso en ediciones que solo cambian relaciones. El alta pública guarda ficha, asociaciones, temporada, episodio y estado de seguimiento en una transacción.
- Pruebas sin base real: `node scripts/test-contribution-boundary.mjs` ejecuta los handlers con dependencias simuladas; `node scripts/test-contribution-metadata-ui.mjs` monta el selector real en Ant Design Form y lo prueba con Playwright. No prueban concurrencia real de PostgreSQL ni constituyen una auditoría de todos los permisos editoriales.

### Fechas del seguimiento y pruebas SQL (2026-09-26)

- `tracking.ts` ya no vuelve a fechar el último episodio de un lote ni una marca repetida. `markManyWatched` devuelve cuántos estados cambiaron; solo un cambio real avanza la última actividad y reanuda RETOMAR. Se conservan las fechas históricas y `null` de importaciones. Desmarcar y volver a marcar sí genera una fecha nueva; todavía no almacena múltiples visionados.
- `scripts/local-prisma-db.mjs` levanta PGlite en memoria sobre loopback, usando dependencias instaladas de Prisma. `scripts/prisma-test-runtime.mjs` limita el cliente de prueba a una conexión. No cambian la configuración ni los datos de producción.
- Se reconstruyeron las 47 migraciones y `db:check` dio cero diferencias. `test-progress.ts` y `test-tracking-database.ts` pasaron con SQL real sobre este entorno: fechas, aislamiento de cuentas, restauración sin sobrescrituras y referencias editoriales. El caso de fallo SQL/rollback se omite explícitamente en PGlite por una limitación de su transporte; requiere PostgreSQL nativo. La concurrencia nativa y el historial real siguen pendientes. Ver `docs/seguimiento-pruebas-locales.md`.

```bash
npm run dev          # Desarrollo (http://localhost:3000)
npm run build        # Build de produccion
npm run start        # Servir build de produccion
npm run lint         # Verificar codigo
npm run lint:fix     # Corregir problemas de linting
npm run format       # Formatear con Prettier
npm run type-check   # Verificar tipos TypeScript
```

### Historial privado de cambios (2026-09-26)

- `TrackingEvent` registra cambios de estado/fecha mediante un trigger transaccional de ViewStatus. Los reintentos idénticos no generan eventos. La migración `20260926192040_tracking_event_history` conserva estados anteriores como SNAPSHOT, sin inventar fechas de visionado ni acciones pasadas.
- `/api/user/tracking-history` exige sesión, filtra por propietario, pagina por fecha/id y permite borrar solo el historial. La pestaña Historial de seguimiento ofrece búsqueda, paginación y borrado confirmado. Los aportes enlazan a `/ver`. Textos en diez idiomas.
- Exportación personal, importación y reset incluyen eventos. IDs deduplicados por cuenta; el usuario del archivo no determina propiedad. Restauraciones con eventos suprimen el trigger solo dentro de esa transacción. El backup global cubre 63 modelos.
- PostgreSQL nativo local 18.4: migración generada/aplicada con migrate dev y sombra; pruebas de historial, reintentos concurrentes, rollback, progreso, importación y backup/restauración de 63 tablas aprobadas. UI Playwright aprobada con APIs simuladas. No se migró producción.
- Este historial describe cambios de seguimiento; no equivale a múltiples visionados. Siguen pendientes vueltas explícitas, edición de fecha en UI, estadísticas derivadas y comunidad agregada.

## Migraciones seguras y reconciliación (2026-09-15)

- Se reconciliaron cambios aplicados previamente fuera del historial: SeriesNote, SeriesSuggestion, Actor.funFacts, Comment.isAnonymous/parentId, FeatureRequest.category, NotificationPrefs.notifyAdminComments y Series.airDays. La migración 20260915110000_reconcile_untracked_schema reproduce esos cambios para bases nuevas, incluyendo RLS. En producción se verificó que ya existían y se registró con migrate resolve --applied; no se ejecutó su DDL allí.
- La causa recurrente incluía scripts/migrate-supabase.sh, que usaba db push. Ahora npm run migrate:supabase ejecuta scripts/migrate-supabase.mjs y solo aplica SQL versionado con migrate deploy. Conserva la lectura explícita de DIRECT_URL desde .env para Supabase; no usa .env.local.
- prisma.config.ts llama a scripts/prisma-safety.ts: migrate dev/reset y db push quedan bloqueados contra hosts remotos. Generar cambios en PostgreSQL local; nunca resetear la base compartida para resolver drift.
- .github/workflows/migrations.yml reconstruye una base vacía en cada PR que toca Prisma y ejecuta npm run db:check. Así detecta campos agregados al schema sin su migración. db:check por sí solo compara base y schema; la reconstrucción es lo que valida el historial.
- No editar migraciones ya aplicadas ni sus checksums. Para hotfixes existentes: comparar el esquema real, crear y probar una migración que los reproduzca, y marcarla aplicada únicamente en las bases donde ya existen todos sus efectos.
- scripts/audit-migration-history.mjs consulta el historial sin modificarlo; ignora intentos revertidos y admite diferencias de finales de línea al verificar checksums.

## Feedback de Flor (2026-09-15)

### Backups y QA (2026-09-15)

- Integrada la corrección del cron: escrituras independientes en tandas paralelas de diez.
- QA incluye smoke tests de lectura y anuncio de los ocho sitemaps en robots.txt.
- Backup JSON: 62 modelos, cobertura contra schema, lectura RepeatableRead y error con exit code distinto de cero. Restaurador solo local y sobre tablas vacías; CI verifica restauración con datos sintéticos.
- Bucket privado `mundobl-backups` creado. Secrets de Actions pendientes; el workflow diario exige la variable `BACKUPS_ENABLED=true`. Ver `docs/backups.md` antes de activarlo.

### Cambios del catálogo

- Perfil: Recientemente completadas muestra tres títulos y abre un modal con la lista completa, paginada de a 20. La API de perfil ya no corta ese listado a ocho registros.
- Catálogo: Retomar y Abandonada filtran el estado del usuario autenticado. GET /api/view-status conserva su respuesta original por defecto; ?all=true devuelve pares seriesId/status. Helper getUserSeriesStatuses en database.ts.
- Notas privadas de serie/episodio: pie flexible con separación y salto de línea; la fecha no pisa el contador.
- Ficha pública: un solo bloque Dónde ver, etiquetas de información de 160px en escritorio. Doramasflix disponible en el formulario; Spotify ya estaba soportado como WatchLink.
- Universo: Series.isUniverseMain identifica historia principal y portada. saveSeriesInUniverse serializa por universo y cambia la principal en una transacción; índice único parcial evita dos principales. Elegir otra principal reemplaza a la anterior; quitar universo limpia la marca. El catálogo prioriza esa serie como portada (si no hay principal visible, mantiene orden cronológico).
- Temporadas en Información: para series dentro de un universo, se cuentan los miembros de tipo serie y se muestra la posición de la ficha. getPublicUniverseSeries excluye aportes USER_EMBED, WATCHABLE_ONLY y HIDDEN; ordena principal, año, título, id. Películas y especiales no suman temporadas. La sección de episodios mantiene las temporadas internas propias de la ficha.
- Basado: se corrigió la interpretación del pedido: `manga` es válido; `Manga` es una variante duplicada. Las sugerencias vuelven a incluir manga usando la escritura más frecuente. GM continúa fuera de las sugerencias, pero todos los valores exactos se pueden gestionar en `/admin/tags?tab=based-on` (solo ADMIN).
- El directorio de Basado muestra cantidades y fichas por valor exacto. Permite renombrar, fusionar con otro valor existente y quitar la clasificación (null, sin borrar fichas). Antes de aplicar muestra las fichas afectadas; una transacción Serializable verifica sus IDs y rechaza listas desactualizadas. No necesita migraciones ni una tabla adicional: los valores nuevos nacen al editar fichas.
- POST/PUT de series reutilizan la escritura existente más frecuente sin distinguir mayúsculas ni espacios repetidos. PUT conserva basedOn cuando el payload no lo incluye. La gestión invalida catálogo y fichas. Ninguna reclasificación de producción se ejecuta como parte del despliegue.

### Metadata y expectativas de disponibilidad (2026-09-26)

- Fichas `/series/[id]`: título y descripción ofrecen información y seguimiento, sin prometer reparto completo, reseñas, subtítulos ni reproducción. Keywords se limitan a títulos, etiquetas y géneros presentes.
- `/ver` y sus fichas: eliminado el anuncio general de series completas y subtítulos en español. Se explicita que disponibilidad, idiomas y episodios dependen de cada fuente. Metadata de una ficha sin episodios publicables devuelve notFound, igual que su contenido.
- Nuevos textos `contentMetadata` en los diez locales. Las rutas públicas conservan español como idioma de metadata, sin añadir cookies que vuelvan dinámico su ISR. TypeScript y ESLint comprobados; pendiente comprobar el HTML renderizado y auditar el resto de superficies de descubrimiento.

### Portada: alcance público y fechas (2026-09-26)

- Las últimas fichas, novedades semanales, reseñas destacadas y contadores relacionados al catálogo usan un filtro común CURATED + PERSONAL + VISIBLE. Una ficha oculta no debe anunciarse en la portada ni aportar una reseña destacada allí.
- El contador semanal de episodios usa watchedDate dentro de los últimos siete días y hasta el presente; updatedAt no demuestra visionado reciente. Fechas desconocidas, antiguas o futuras no se cuentan como visionados de esta semana. El conteo sigue siendo de registros de episodio, no de vueltas ni capítulos agrupados por partes.
- Los títulos completos de fichas usan metadata.title.absolute para evitar repetir MundoBL al aplicar el template del layout.
- TypeScript y ESLint aprobados. No se cambió producción; queda pendiente la verificación de HTML y auditoría de visibilidad del resto de consultas públicas.

### Catálogo público y comprobación HTTP (2026-09-26)

- `/catalogo` filtra VISIBLE; su índice de filtros también excluye fichas ocultas. Nueva clave de caché v4 para no reutilizar listados anteriores. `getAllSeries` acepta visibilidad explícita y conserva su uso administrativo sin filtro.
- `getSeriesById`, helper público, exige CURATED + PERSONAL + VISIBLE. El workspace administrativo usa `getSeriesByIdAdmin`, conservando acceso editorial a fichas ocultas bajo el guard existente del proxy.
- HTTP local de `/ver` comprobado: título «Series BL y GL para ver | MundoBL» y descripción sobre disponibilidad/idiomas variables. HTML de detalles aún pendiente: el rol local de lectura no tiene políticas RLS que permitan ver las fichas sintéticas. La revisión automática rechazó BYPASSRLS; no se aplicó. No se tocaron permisos remotos ni producción.

### Estadísticas personales: fechas verificables (2026-09-26)

- El calendario semanal y el heatmap de `/api/user/profile` usan watchedDate, no updatedAt. Excluyen fechas desconocidas/futuras, otros usuarios, estados no vistos y marcas de serie sin episodio. Las fechas antiguas no pasan a contar hoy al importar o editar un registro.
- Recientemente completadas ordena por fecha de visionado, con desconocidas al final, y devuelve completedAt nullable real. No se usa updatedAt como sustituto. La racha recorre días UTC, consistente con las claves ISO del calendario.
- `scripts/test-profile-watch-dates.mjs` ejecuta las dos consultas SQL reales del handler contra una tabla temporal de la sesión en PostgreSQL local. Prueba reciente/antigua/desconocida/futura, aislamiento entre cuentas y tipos de marca; rollback elimina la fixture. Pasó sin cambiar permisos ni tablas de aplicación. TypeScript y ESLint también pasan.
- Pendiente: conteo de capítulos agrupados en las estadísticas globales del perfil, duraciones desconocidas explícitas y múltiples vueltas de visionado. La prueba SQL no equivale a validar el endpoint HTTP autenticado completo.

### Estadísticas personales: capítulos divididos (2026-09-26)

- El total de episodios de `/api/user/profile` ahora agrupa capítulos con el mismo helper que seguimiento. Requiere todas sus partes registradas vistas y mantiene cada serie separada. Se consultan también las partes no vistas de las series con alguna marca, evitando considerar completo un capítulo parcial.
- `countWatchedChapters` reutiliza groupIntoChapters; no representa vueltas ni certifica partes que aún faltan en el catálogo. Respeta la clasificación de extras existente del agrupador.
- `scripts/test-profile-chapters.ts` pasó: partes completas/parciales, trailer en playlist numerada, temporadas distintas, capítulos sin título y colección vacía. TypeScript y ESLint pasan. La verificación del endpoint autenticado y el coste sobre bibliotecas grandes siguen pendientes.

### Perfil: destinos de catálogo y reproducción (2026-09-26)

- `getContentUrl` centraliza destino por origin/catalogScope: USER_EMBED o WATCHABLE_ONLY abren `/ver`; las fichas curatoriales del catálogo abren `/series`, con slug del título.
- Favoritas, en curso, completadas, mejor valoradas, reseñas y suscripciones del perfil usan este helper. API de perfil/suscripciones y tipos incluyen origin/catalogScope; la consulta SQL de mejor valoradas los devuelve también. Se conserva el ancla de reseñas del catálogo.
- TypeScript y ESLint aprobados; no se cambian permisos ni contenido editorial. Pendiente recorrido visual autenticado y revisión de otros enlaces fuera del perfil.

### Marcado manual de series: reintentos (2026-09-26)

- El endpoint de estado de serie usa `setSeriesTrackingStatus` dentro de una transacción. Crear con skipDuplicates y actualizar solo estados distintos evita refechar marcas idénticas, incluyendo VISTA con watchedDate desconocida. Una transición real conserva el comportamiento previo de fechas.
- Primera suscripción y estado se guardan juntos; un reintento no vuelve a activar avisos deshabilitados. El trigger del historial no genera eventos para estados idénticos.
- `test-series-tracking-status.ts` pasó sobre PostgreSQL nativo local: cuatro primeras marcas concurrentes producen un evento, fechas históricas/desconocidas se preservan, desmarcar/remarcar fecha de nuevo, última actividad estable y sin resuscripción. Fixtures eliminadas al terminar. TypeScript y ESLint aprobados. No se migró ni desplegó producción.

### Primera entrada de comunidad (2026-09-26)

- Nueva `/comunidad`, accesible desde la navegación compartida escritorio/móvil. Lista las últimas 30 reseñas PUBLISHED de fichas VISIBLE y enlaza a su destino público según origin/catalogScope. No incluye estados de seguimiento, notas, emails ni borradores.
- Los títulos de reseñas con hasSpoilers se eliminan del DTO en servidor antes de enviarlo al cliente. La UI muestra aviso traducido. Texto e interfaz en diez idiomas; estado vacío y acceso al catálogo.
- Render dinámico para consultar el estado de publicación en cada visita. Falta invalidación en clientes ya abiertos, paginación, búsqueda y conversaciones/recomendaciones agregadas; no es un chat ni completa el objetivo de comunidad.
- TypeScript y ESLint aprobados. Navegador local verificó página vacía en móvil sin desbordamiento horizontal, captura `test-results/community-mobile.png`; revisión visual realizada. El feed poblado y sus límites de publicación requieren prueba adicional. Sin despliegue.

### Comunidad: límites públicos verificados (2026-09-26)

- El feed exige un destino público existente: ficha CURATED + PERSONAL o al menos un episodio publicable para `/ver`, además de visibilidad VISIBLE. No anuncia aportes vacíos cuya ficha de reproducción devolvería 404.
- Fechas publishedAt desconocidas quedan al final, sin desplazar reseñas fechadas recientes.
- `test-community-privacy.ts` pasó sobre PostgreSQL local con fixtures eliminadas al terminar: publicaciones visibles incluidas, borradores/fichas ocultas/aportes sin episodios excluidos, títulos spoiler eliminados del DTO, sin cuerpo ni email y retirada de reseña reflejada en la siguiente consulta. También verifica destino `/ver` de aportes. Esto prueba el helper SQL real; sigue pendiente UI poblada y recorrido HTTP autenticado completo.

### Comunidad: UI poblada (2026-09-26)

- `test-community-ui.mjs` monta CommunityFeed, LocaleProvider, traducciones y componentes reales con contenido sintético. Comprueba aviso de spoilers, enlaces `/series` con ancla y `/ver`, tres tarjetas y ausencia de overflow a 1280/390px. Pasó sin errores de navegador.
- Capturas pobladas en test-results, inspeccionadas visualmente. El montaje aislado usa los tokens reales de tema; no valida autenticación ni consultas del backend, que se prueban por separado.
- Los enlaces de lectura incluyen el título de la serie en su nombre accesible, para distinguirlos con lectores de pantalla.

### Comunidad: reseñas anteriores accesibles (2026-09-26)

- `/comunidad?page=N` muestra páginas de 30 reseñas con navegación Anterior/Siguiente y canonical propio. Consulta una fila adicional para saber si hay siguiente página. Valores inválidos y páginas vacías posteriores a la primera devuelven notFound.
- `getCommunityReviews(page)` mantiene todos los filtros públicos y devuelve items/hasNext. Orden por publicación e ID. Paginación por offset: nuevas publicaciones o retiradas pueden desplazar filas entre visitas; no se presenta como una instantánea inmutable.
- Prueba PostgreSQL ampliada con 31 reseñas: límite de 30, siguiente página, ninguna repetida en datos estables, todas alcanzables y rechazo de página cero. UI comprueba enlaces de anterior/siguiente en el componente real. TypeScript y ESLint aprobados.

### Comunidad: búsqueda por serie (2026-09-26)

- Formulario GET por título de serie, sin distinguir mayúsculas. El término se conserva en la URL y en Anterior/Siguiente; una nueva búsqueda vuelve a página uno. Input accesible y botón Ant Design, texto en los diez locales.
- El filtro se aplica en la consulta antes de paginar, mantiene publicación/visibilidad/destino válido y no busca cuerpos ni títulos con spoilers. Máximo 100 caracteres, validado también en servidor. Resultados de búsqueda marcados noindex/follow para no generar páginas SEO por cada término.
- Pruebas SQL: coincidencia sin distinguir mayúsculas, consulta sin resultados, contenido oculto y rechazo de longitud excesiva. Prueba UI real: query con caracteres especiales preservada al paginar y formulario GET que restablece la página. Ambas aprobadas, además de TypeScript y ESLint. Sin despliegue.

### Corrección de fecha por API (2026-09-26)

- `PATCH /api/user/watch-date` requiere sesión y acepta exactamente un seriesId/seasonId/episodeId, watchedDate `YYYY-MM-DD` o null y expectedDate ISO exacto o null. La identidad proviene exclusivamente de la sesión.
- Solo modifica filas VISTA del propietario cuya fecha actual coincide con expectedDate. Conflicto, fila ausente o no vista -> 409; input inválido -> 400. No cambia estado, última actividad ni suscripción; el trigger registra DATE_CHANGED privado. Fecha futura/calendario imposible rechazados; días elegidos se guardan a medianoche UTC.
- `test-watch-date.ts` pasó en PostgreSQL nativo local: validación, aislamiento, dos correcciones simultáneas (solo una gana), fecha desconocida, estado preservado e historial sin duplicar por reintento idéntico. TypeScript y ESLint aprobados.
- Falta conectar el editor de fecha a la UI; esta entrega habilita la operación de servidor, no una interfaz terminada. La fecha previa exacta está disponible en el export personal. No se desplegó.

### Editor de fechas en episodios (2026-09-26)

- EpisodeChapterList ofrece el botón de calendario para capítulos con partes vistas y sesión iniciada. Abre WatchDateEditor con selector de parte; cada parte conserva su propia fecha. Disponible también dentro del drawer de /watching.
- GET /api/user/watch-date consulta solo la marca VISTA de la cuenta actual, sin cache. El modal carga la fecha antes de editar, permite día UTC o desconocida y envía el timestamp anterior completo. Conflicto conserva el formulario y exige recargar; durante guardado se impide cerrar accidentalmente.
- Textos nuevos en diez idiomas; Ant Design, CSS separado y labels por props. `test-watch-date-ui.mjs` pasó con componente real/APIs simuladas: carga histórica, corrección, desconocida, conflicto y ancho móvil. Captura inspeccionada. TypeScript y ESLint aprobados. Sigue pendiente edición visual de fechas de serie/temporada y recorrido autenticado completo.

### Fecha de finalización desde la ficha (2026-09-26)

- TrackingPanel muestra Corregir fecha de visionado cuando la serie/película está VISTA, incluso sin episodios cargados. Usa el mismo WatchDateEditor que las partes de capítulos.
- El editor recibe targets tipados (serie/temporada/episodio) en vez de asumir episodeId. Mantiene GET privado, comparación de fecha previa, desconocida y protección ante conflictos. No cambia el progreso de episodios al corregir la fecha de la serie.
- Prueba de navegador ampliada: guardar una fecha de película envía seriesId y el timestamp previo exacto; los casos de episodio siguen pasando. TypeScript y ESLint aprobados. Temporadas aún no tienen botón propio. Sin despliegue.

### Seguimiento: recorrido integrado actualizado (2026-09-26)

- `test-watching-ui.mjs` abre el editor real de fecha desde el drawer de episodios de /watching, corrige una fecha histórica y verifica el PATCH con episodeId/fecha previa exacta. Comprueba que la colección y su progreso permanecen iguales, después continúa con nota privada y comentario público.
- La ejecución completa pasó tras integrar el editor generalizado: marcado de capítulos/partes, destinos /ver, fijados/vista persistidos, editor, diario, historial y borrar historial conservando progreso/notas, móvil sin overflow y tema claro.
- Todas las APIs de esta prueba se interceptan. Demuestra integración visual entre componentes, no el flujo autenticado completo contra PostgreSQL. Las reglas SQL se validaron por separado; siguen pendientes la comprobación conjunta del endpoint con sesión real, build de producción y despliegue.

### Handlers privados y persistencia conjunta (2026-09-26)

- `test-private-tracking-routes.mjs` ejecuta el código real de GET/PATCH watch-date y GET/DELETE tracking-history con helpers y PostgreSQL reales. Solo sustituye requireAuth para elegir identidades de prueba.
- Pasó: 401 sin sesión; 404/409 al intentar fechas ajenas; userId enviado por query/body ignorado; historial ajeno invisible y no borrable; corrección válida crea DATE_CHANGED; fecha desactualizada -> 409; fecha imposible -> 400; Cache-Control privado/no-store; borrar historial conserva VISTA.
- Fixtures propias eliminadas al terminar. No modifica políticas RLS ni permisos. Complementa las pruebas de UI con APIs simuladas, pero no prueba OAuth/cookies ni el transporte HTTP real con sesión.

### Horas de seguimiento con cobertura explícita (2026-09-26)

- `/api/user/profile` suma durationSeconds positivos, con fallback a duration positivo en minutos. Valores ausentes/cero/negativos no suman. Devuelve unknownDurationVideos para explicar la cobertura; no estima duraciones desconocidas.
- Ambos strips del perfil muestran Horas con duración registrada y, si corresponde, cantidad de videos vistos excluidos. Conservan el decimal de horas en vez de redondear otra vez a entero. Textos en diez idiomas.
- La prueba SQL del perfil usa también la consulta real de duración sobre tablas temporales: segundos prevalecen sobre minutos, fallback correcto, duraciones inválidas contadas como desconocidas y aislamiento por usuario/estado. Pasó. TypeScript y ESLint aprobados; revisión visual de estos nuevos textos pendiente.

### Cobertura de duración legible (2026-09-26)

- Las etiquetas de los dos strips ya no usan ellipsis; el aviso de videos sin duración tiene clase propia con salto de línea y tipografía normal. El strip fijo usa una grilla adaptable al ancho disponible, evitando apretar doce métricas en una sola fila.
- `test-profile-duration-ui.mjs` monta ambos componentes reales con datos sintéticos y prueba texto de cobertura, decimales, ausencia de recortes/desbordamiento a 1280 y 390 px. Pasó con reset border-box equivalente al global de la aplicación; capturas inspeccionadas. ESLint aprobado. No valida el transporte HTTP del perfil.

### Vistos este año según el seguimiento (2026-09-26)

- Corregida la métrica anual del perfil: antes leía completedByYear, agrupado por año de estreno. Ahora calcula completedThisYear desde watchedDate de las series VISTA y publica activityYear UTC para que el label use el mismo año que el servidor. Sin nueva consulta: reutiliza las filas de completadas.
- El desglose por años de estreno conserva su significado independiente. Fechas desconocidas, de años anteriores o futuras no cuentan como finalizadas este año.
- `test-tracking-statistics.ts` pasó límites de año/desconocidas/futuras. Prueba visual de ambos strips usa dos finalizaciones frente a 99 estrenos y comprueba que muestra dos. TypeScript y ESLint aprobados. Sin despliegue.

### Compilación integral de seguimiento (2026-09-26)

- `npm run build` terminó con código 0 contra PostgreSQL local mundobl_replay, sobrescribiendo DATABASE_URL y DIRECT_URL para evitar la base remota. Prisma generó el cliente, webpack compiló, TypeScript pasó y Next generó las 161 páginas estáticas. Log local ignorado: test-results/production-build.log.
- No hizo falta cambiar next.config.ts: la versión instalada separa el directorio de desarrollo `.next/dev` del build de producción. No se desplegó ni se modificaron permisos de la base.
- El lint integral inicial terminó sin errores y con 199 avisos; 191 correspondían al formato de las traducciones nuevas en messages.ts. Se aplicó Prettier únicamente a ese archivo.
- La segunda ejecución de `npm run lint` terminó con código 0: cero errores y ocho avisos en archivos ajenos a estos cambios (SeriesMetadataTab, GlosarioClient y email). Log local: test-results/full-lint.log.
- La compilación no demuestra OAuth ni el recorrido HTTP autenticado completo. Continúan pendientes esos controles y las funcionalidades del objetivo general todavía no implementadas.

### Privacidad de bloques editoriales (2026-09-26)

- La auditoría encontró que GET /api/series/[id]/info-blocks devolvía bloques de fichas HIDDEN sin sesión. Ahora usa getReadableSeriesInfoBlocks: público solo VISIBLE; ADMIN/MODERATOR conservan acceso editorial; COLLABORATOR puede leer HIDDEN únicamente si es dueño del aporte USER_EMBED/WATCHABLE_ONLY. Sesiones rechazadas no obtienen privilegios. Respuesta private/no-store.
- La condición de visibilidad/propiedad forma parte de la consulta SQL de los bloques. Ocultar una ficha o cambiar el alcance del aporte revoca el acceso en la siguiente lectura. ID inexistente y ficha inaccesible devuelven la misma lista vacía.
- test-info-block-privacy.mjs pasó con el handler real y PostgreSQL nativo local; solo simula la resolución de sesión. Incluye acceso anónimo/otro colaborador/dueño/editor, cambio de alcance, ocultar/publicar, orden e IDs inválidos. Fixtures eliminadas. TypeScript y ESLint aprobados.
- La política editorial general sigue pendiente: actualmente MODERATOR puede modificar series y taxonomías en otros endpoints. Se consultó al usuario si quiere exclusividad de Flor o delegación a ADMIN; no se asumió una identidad de Flor ni se alteraron esos roles. Este arreglo de lectura no demuestra control exclusivo de todo el catálogo. Sin despliegue.

### Corrección de fecha de temporadas (2026-09-26)

- SeasonsList ofrece el editor de fecha dentro de cada temporada VISTA para cuentas con sesión. Usa WatchDateEditor con seasonId y textos ya traducidos; mantiene fecha desconocida y comparación de la fecha previa. No requiere modificar capítulos.
- test-season-watch-date-ui.mjs monta SeasonsList y WatchDateEditor reales: abre desde la temporada, verifica PATCH con seasonId/fecha previa exacta, ausencia de acción para temporada sin ver/invitados y ancho móvil. APIs, sesión y estado simulados; paneles hijos ajenos al flujo omitidos. Captura con tema oscuro inspeccionada.
- test-watch-date.ts ampliado y aprobado en PostgreSQL nativo local: corregir temporada crea DATE_CHANGED y conserva fecha/estado del episodio y estado de la serie. TypeScript y ESLint aprobados. Sin despliegue ni prueba OAuth completa.

### Historial: destinos y días coherentes (2026-09-26)

- getTrackingHistory usa getContentUrl incluyendo catalogScope: CURATED/WATCHABLE_ONLY también enlaza a /ver; CURATED/PERSONAL a /series. Antes solo diferenciaba origin, generando enlaces al catálogo para contenido exclusivo de reproducción.
- TrackingHistory presenta watchedDate y previousWatchedDate como días UTC, coherentes con el editor. Una fecha elegida a medianoche UTC ya no aparece como el día anterior en Argentina. recordedAt conserva fecha/hora local para identificar cuándo ocurrió el cambio.
- test-tracking-history.ts pasó en PostgreSQL nativo verificando destinos después de cambiar origin/scope. test-watching-ui.mjs pasó completo con zona America/Argentina/Buenos_Aires, fechas actual/anterior a medianoche, desconocidas, paginación y borrado. APIs de navegador simuladas. TypeScript y ESLint aprobados. Sin despliegue.

### Créditos de guion: base de datos (2026-09-26)

- Modelos Writer y SeriesWriter: identidad, alias, nacionalidad, biografía, referencias externas, foto con procedencia/atribución/licencia y fuente de cada crédito. Rol separado de Director; no se fabricaron ni migraron nombres por inferencia.
- Migración 20260926204755_writer_credits generada con migrate dev --create-only, completada con RLS para ambas tablas y aplicada mediante migrate dev en mundobl_replay/shadow locales. Cliente generado; db:check sin diferencias. No se cambió ninguna base remota.
- getWriterById devuelve datos públicos y créditos de series VISIBLE del catálogo o con reproducción disponible, con enlaces según origin/scope. Excluye notas editoriales, obras ocultas y aportes sin reproducción.
- test-writer-credits.ts pasó en PostgreSQL: fuentes, privacidad, destinos, unicidad, borrado en cascada conservando la persona y RLS habilitado. Fixtures eliminadas. TypeScript y ESLint aprobados.
- Backup completo actualizado y ejecutado localmente: 65 tablas, incluidas Writer/SeriesWriter. La restauración con las nuevas tablas todavía no se ensayó. Faltan editor, ficha pública, enlaces desde series y traducciones para guionistas; el modelo no equivale a la funcionalidad terminada. Sin despliegue.

### Ficha pública de guionistas (2026-09-26)

- Nueva ruta dinámica /guionistas/[id], IDs validados, 404 de inexistentes y metadata sin promesas de reproducción. Usa el criterio de completitud de personas para noindex de fichas escasas; consulta actual para reflejar visibilidad de créditos.
- WriterProfile presenta identidad, alias, biografía, atribución/licencia de imagen, referencias y fuente de cada crédito. Obras distinguidas como ficha/seguimiento o episodios para ver con su destino correcto. URLs externas limitadas a HTTP/HTTPS. Textos nuevos en diez idiomas; CSS separado y PanelCard/AntD.
- test-writer-profile-ui.mjs pasó con componente real y datos sintéticos: fuentes, destinos, bloqueo de javascript: y móvil sin overflow. TypeScript y ESLint aprobados. Revisión de captura detectó compresión del avatar; se corrigió flex-shrink.
- Pendientes: editor de personas/créditos, enlaces desde fichas de obras e índice de guionistas; no hay contenido real cargado ni despliegue. La prueba visual no valida transporte HTTP con PostgreSQL.

### Navegación obra–guionista (2026-09-26)

- Las páginas /series/[id] y /ver/[id] incluyen WriterCredits cuando hay créditos cargados. Cada nombre enlaza a /guionistas/[id]; sin créditos no se muestra panel vacío. Componente compartido con textos existentes traducidos, PanelCard y CSS separado.
- getPublicWriterCredits consulta únicamente IDs/nombres y exige visibilidad VISIBLE. test-writer-credits.ts ampliado pasó sobre PostgreSQL local para catálogo, aportes y exclusión de ocultos.
- Prueba visual de guionistas ampliada: un solo panel para fixture con créditos más fixture vacía, destino /guionistas/1 y móvil sin overflow. TypeScript y ESLint aprobados. No hay aún editor de carga ni contenido real; sin despliegue.

### Restauración completa con guionistas (2026-09-26)

- Creada una base local nueva mundobl_restore_writer_20260926 en 127.0.0.1:55433, reconstruida con las 49 migraciones. No se borró ninguna base anterior ni se modificaron roles/RLS.
- test-backup-restore.ts ahora admite destinos locales con prefijo mundobl_restore_, agrega fixtures Writer/SeriesWriter con alias Unicode, atribución y fuentes, comprueba también la secuencia Writer y elimina sus propias fixtures del origen al terminar.
- Ensayo aprobado: 65 tablas idénticas fila por fila, restricciones activas, secuencias válidas y rechazo de destino ocupado. El destino queda ocupado como evidencia; no se puede repetir sobre él sin elegir otro destino vacío. El resultado sustituye la pendiente anterior sobre restauración de las tablas nuevas. No valida infraestructura remota ni despliegue.
