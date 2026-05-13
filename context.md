# MundoBL - Contexto del Proyecto

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

| origin / scope | /catalogo | /ver (si tiene embedUrl) | /series/[id] | sitemap series | sitemap ver |
| -------------- | --------- | ------------------------ | ------------ | -------------- | ----------- |
| CURATED + PERSONAL | ✓ | ✓ | ✓ | ✓ | ✓ |
| CURATED + WATCHABLE_ONLY | — | ✓ | ✓ | — | ✓ |
| USER_EMBED + WATCHABLE_ONLY (VISIBLE) | — | ✓ | 404 (excepto submitter/admin) | — | ✓ |
| USER_EMBED + WATCHABLE_ONLY (HIDDEN) | — | — | 404 (excepto submitter/admin) | — | — |

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
- `AccessLog` - Registro de visitas y acciones
- `BannedIp` - IPs bloqueadas

**Enums:**

- `Role` - USER, MODERATOR, ADMIN
- `WatchStatus` - SIN_VER, VIENDO, VISTA, ABANDONADA, RETOMAR

### Migraciones

```bash
# Generar cliente Prisma despues de cambios al schema
npx prisma generate

# Crear migracion despues de cambios al schema
npx prisma migrate dev --name descripcion_del_cambio

# Aplicar migraciones en produccion (Vercel lo hace automaticamente en build)
npx prisma migrate deploy

# Ver estado de migraciones
npx prisma migrate status

# Sincronizar schema sin migraciones (desarrollo)
npx prisma db push

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

| Vista             | Ruta                       | Widgets                                                                                                                                                                                                                                                                  | dashboardKey    |
| ----------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| Perfil de usuario | `/perfil` (= dashboard)    | Overview, Ratings, RecentlyCompleted, Notifications, MyCases, Heatmap, GenresDonut, CompletedByYear, TopGenresList, TopCountriesList, CurrentlyWatching, TopActors, TopCompanies, TopRated, Favorites, MyReviews, MyDisputes, MyComments. Footer: ProfileSettings + SubscriptionsSection + ClientVersionInfo. | `profile-v3`    |
| Detalle de titulo | `/catalogo/[id]/dashboard` | Hero, Info, Actors, Ratings                                                                                                                                                                                                                                              | `series-detail` |
| Catalogo          | `/catalogo/dashboard`      | Stats globales, RecentlyAdded                                                                                                                                                                                                                                            | `catalogo`      |
| Admin home        | `/admin/dashboard`         | KPIs, Alerts                                                                                                                                                                                                                                                             | `admin-home`    |

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
3. **Score de completitud de series** (admin/editor): [src/lib/series-completeness.ts](src/lib/series-completeness.ts) — helper puro `computeCompleteness(series) → { score, missing }`. UI: `CompletenessCard` en `/admin/series/[id]` + widget `SeriesIncompletasWidget` en `/perfil` (solo rol admin).
4. **Director links basicos**: campos `Director.aliases`, `imdbUrl`, `mdlUrl`, `wikiUrl` (migracion `add_director_aliases_and_external_links`). Render en [src/app/directores/[id]/DirectorProfileClient.tsx](src/app/directores/[id]/DirectorProfileClient.tsx) como fila de iconos + Chip list de aliases.

Items que se decidió **no** incluir en este slice:
- Tags sensibles → reformulado como **policy doc editorial** (no codigo), va a `docs/`.
- IMDB/MDL precarga, UserList/Collection, Command palette, Push UI, Achievements → roadmap.

---

## Comandos

```bash
npm run dev          # Desarrollo (http://localhost:3000)
npm run build        # Build de produccion
npm run start        # Servir build de produccion
npm run lint         # Verificar codigo
npm run lint:fix     # Corregir problemas de linting
npm run format       # Formatear con Prettier
npm run type-check   # Verificar tipos TypeScript
```
