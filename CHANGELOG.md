# Changelog

Todas las versiones notables del proyecto se documentan aqui.

> **Este archivo es la fuente de verdad.** `/api/changelog` lo lee del repo en
> cada deploy y lo muestra en `/novedades`, el tab Changelog de `/feedback` y la
> landing. Para publicar novedades: agregar la entrada aca y deployar. La DB
> (`ChangelogItem`, `/admin/changelog`) quedo como fallback solo si este archivo
> esta vacio.

## 2026-07 — Seguridad, performance y mejoras de feedback

### Seguridad

- **RLS en toda la base**: Row Level Security activado en las 16 tablas publicas que faltaban (marcadas por el advisor de Supabase). Cierra el acceso publico via PostgREST sin afectar la app (Prisma usa el rol owner).
- **Privacidad en votos**: el board de feedback ya no expone quien voto cada solicitud; solo se calcula si vos votaste.
- **CSP**: se habilitan favicons externos (`img-src https:`) — los logos de `/sitios` volvieron a cargar.

### Performance

- **Indices en toda la DB**: indices de cobertura en las 30 claves foraneas que no los tenian, acelerando joins y borrados en cascada.
- Alta de series en el admin con llamadas paralelizadas.

### Features

- **Badge "Del equipo"** en `/feedback`: los items del roadmap oficial se distinguen de los aportes de la comunidad.
- **Precarga IA** al crear series reutiliza el vocabulario existente de tags y generos (menos duplicados).

### Fixes

- Card de serie "watchable" sin portada muestra el titulo (antes: rectangulo vacio).
- Dedup case/space-insensitive de actores y tags, con scripts de merge.
- Admin: conteos de tags/generos/productoras/universos con scope curado; highlight de la pagina activa; tags que linkean a sus series.
- Tanda de bugs reportados por Flor (estados, imagenes, series).

## 2026-05-19 — Completitud del catalogo (#112) y pulido del perfil

### Features

- **Score de completitud** de cada serie: indicador publico en la ficha, panel de gestion en el admin y widget configurable en el perfil.

### Fixes

- Perfil: corregida una race al cambiar de modo/personalizar; FAB de edicion mas estable (renderizado via portal al body para evitar recortes).

## 2026-05-15 — Pulido post-launch: /perfil, catalogo, novedades, sitios (3 iters)

### Fixes

- **BUG CRITICO catalogo**: el catalogo mostraba series marcadas "Visto" que el usuario nunca vio. El cache global servia el `viewStatus` del primer visitante (Flor) a todos. Ahora `getAllSeries`/`getSeriesById` filtran el estado por usuario y el cache es scoped por `userId`.
- **Roles**: el rol USER (visitante) ya no ve botones de editar/borrar episodios y temporadas (helper `canEditCatalog` gatea la UI; el backend ya lo rechazaba). Aportar series via `/ver/agregar` sigue habilitado para todos.
- **Modos del perfil** (Basica/Avanzada/Admin): al cambiar de modo se aplica el preset de widgets correcto. Antes se quedaba con el layout del modo anterior y parecia que los botones no hacian nada.
- **Personalizar perfil**: reactivar una seccion oculta vuelve a mostrarla (antes desactivaba pero no reactivaba — el widget se perdia del layout al ocultarlo).
- **Layout admin**: `/admin/noticias` se renderiza dentro del layout admin. El boton "Editar layout" de `/admin` se integro al hero en vez de quedar flotando.
- **Accesos**: gestion de usuarios accesible desde el menu admin (grupo Sistema). Modal de feedback sin inputs de archivo nativos duplicados.

### Features

- **Estadisticas del perfil** como widget removible y configurable: cada mini-stat (vistas, viendo, favoritos, etc.) se muestra/oculta individualmente.
- **Widget "Mis feedbacks"** recuperado en el perfil. Aportar una serie via `/ver/agregar` la deja automaticamente en "Viendo ahora".
- **Carrusel de series completas** (estilo Netflix) en landing y `/novedades`: scroll horizontal con portada, click directo al reproductor.

### UX

- Novedades: "Nuevas temporadas" con portada de la serie (antes solo texto). Changelog renderizado con formato real (listas, negritas, links) via `react-markdown`.
- Sitios de interes: cada sitio muestra su favicon (logo propio o el del dominio). Header del perfil reorganizado con la version del cliente arriba.
- Mobile: en `/perfil` se oculta la barra superior casi vacia. Handles de widgets mas grandes para touch.

### i18n

- Nuevas claves de interfaz traducidas a los 10 idiomas (es/en/it/de/fr/ja/ko/zh-CN/zh-TW/th).

### Infra

- Notificaciones push: codigo listo, falta configurar las VAPID keys del servidor (tarea de infraestructura).

## 2026-05-12 — /ver: aporte de series por users registrados + panel admin de moderacion

- **Nueva ruta `/ver/agregar`** (login-gated): cualquier usuario logueado pega una URL de canal oficial (YouTube / Vimeo / Bilibili / Dailymotion) y la IA precarga title, year, country, sinopsis, cast, productora, idiomas, subs, tags, generos. Confianza expuesta (high / medium / low) y warnings si Gemini no respondio o devolvio JSON dudoso. Form editable antes de confirmar; al guardar aparece al instante en `/ver` con badge `@nickname`.
- **Helper `buildEmbedPreview`** en `src/lib/user-embed-preview.ts`: oEmbed nativo de cada plataforma (titulo / canal / thumbnail confiables) + Gemini con shape JSON estricta para el resto. Plataformas no soportadas (Netflix, TikTok, etc.) → 422.
- **Dedupes + rate limit**: dedupe global por `Episode.embedUrl` (409 redirige al existente), dedupe submitter+title+year, max 5 aportes/h y 20/dia por user (429 + `Retry-After`).
- **Schema**: `Series.origin` (`CURATED` / `USER_EMBED`), `Series.visibility` (`VISIBLE` / `HIDDEN`), `Series.submittedById`. Migration `add_series_origin_visibility_submittedby`. Defaults preservan todo el catalogo existente como CURATED+VISIBLE.
- **Panel admin `/admin/series/user-submitted`**: tabla de aportes con thumb, @submitter, plataformas, embeds, visibility. Acciones HIDE/SHOW (oculta de `/ver` post-hoc sin borrar), DELETE (cascade), LINK con una serie CURATED (transaccion que mueve Episodes con embedUrl al Season equivalente del target, crea Season si falta, enriquece episode destino sin embed, y borra el aporte). Nuevo item "Aportes" en AdminNav (groupCatalog).
- **Fix anti-leak transversal**: las series `USER_EMBED` no aparecen en `/catalogo`, `/series/[id]`, homepage, `/novedades`, `/actores/[id]`, `/tags/[id]`, sitemap-series, `/api/series`, `/api/search`, `/api/stats/public`. Listings de actores/tags filtran `_count.series` por curadas (cero contaminacion). `/ver` y sitemap-ver SI las incluyen si `visibility=VISIBLE`.
- **VerSerieClient**: badge "Aporte de @user" cuando origin=USER_EMBED, oculta el link a `/series/[id]` (esa pagina da 404 para user-embed), reemplaza el boton "Mover a catalogo" admin por "Linkear con curada" → `/admin/series/user-submitted`. Fix flicker auth (espera `status==='authenticated'` antes de mostrar acciones admin).
- **/ver `VerPage`**: CTA "Agregar una serie" en hero (solo authenticated). Toggle "Solo curadas por Flor" en filtros. Badge `@nickname` en cards user-embed.
- **Endpoints rechazo 422 para USER_EMBED**: `POST /api/series/[id]/subscribe` y `POST /api/reviews` (no se suscribe ni resena un aporte hasta que admin lo linkea con una curada).

Cobertura parcial de los items #109 (pagina agregar serie con AI), #110 (full AI integration en creacion) y #111 (precarga IMDB/MDL/YouTube): el lado user-embed (`/ver/agregar`) esta listo; el lado admin (catalogScope=PERSONAL con AI + fetch IMDB/MDL) queda pendiente. Comentarios de progreso en las 3 features.



## 2026-05 — i18n masivo, SEO, import YouTube, paletas y nickname (deployado)

### Features
- **Internacionalizacion completa**: 10 idiomas reales (es, en, it, de, fr, ja, ko, zh-CN, zh-TW, th). Antes 8 eran aliases de ingles, ahora cada uno tiene ~1500 strings traducidos via Gemini API. Selector honesto en sidebar.
- **Auto-i18n tooling** (`scripts/audit-i18n.ts`, `scripts/auto-i18n-file.ts`, `scripts/translate-locales.ts`): scanner detecta strings hardcoded, Gemini reescribe componentes para usar `useLocale().t()`, regenera todos los locales automaticamente. 31 componentes migrados en una pasada.
- **t(key, params)** ahora soporta interpolacion nativa (`t('paginationTotal', { total: 42 })` → "Total: 42"), antes habia que usar `interpolateMessage()` aparte.
- **6 paletas de acento nuevas**: emerald, coral, indigo, crimson, slate (12 totales). AccentPicker en sidebar las auto-detecta.
- **Import de series por playlist YouTube** en `/admin/series/importar`: pegar URL → extrae metadata, parsea episodios (EP.X, S1E12, [1/4], etc.), traduce sinopsis con Gemini, crea Series + Season + Episodes en una transaccion. Helpers en `src/lib/playlist-importer.ts`.
- **`SeriesInfoBlock` genérico**: cards labeladas libres por serie ("Basado en", "Curiosidades", "Premios"...). Editables desde el admin, render publico solo si tienen contenido. Schema flexible — Flor agrega bloques nuevos sin migracion.
- **Nickname publico opcional** para privacidad: cada usuario puede setear un nickname desde `/perfil`. En contextos publicos (comentarios, reseñas, feedback) se muestra el nickname o `"Nombre I."` (inicial del apellido) en vez del nombre completo de Google OAuth.

### SEO
- **Sitemap segmentado** con `generateSitemaps()`: `/sitemap.xml` ahora es sitemap-index automatico, con sub-sitemaps por dominio (static, series, noticias, ver, actores, directores, tags). `lastModified` real desde DB para acelerar re-crawl.
- **Robots fortalecido**: bloqueos por seccion (admin, api, perfil, notificaciones, watching, auth, scanners) y declara `host` canonico.
- **JSON-LD enriquecido**: TVSeries con `numberOfSeasons`, `numberOfEpisodes`, `inLanguage`, `productionCompany`. Nuevos schemas en `/catalogo`, `/ver`, `/sitios` (CollectionPage). `WatchAction` en `/ver/[id]`. Breadcrumbs JSON-LD en todas las paginas con migas.
- **Meta titles keyword-first** en paginas de entidad: "Bad Buddy (2021) | Reseña, Reparto y Episodios — Serie BL" en lugar de generico. Mejora CTR en queries tipo "[serie] reseña" y "[actor] filmografia".

### Auth y dominio
- **Dominio canonico** ahora `mundobl.com.ar` (era `mundobl.win`). Redirect a nivel Cloudflare DNS, no en codigo.
- **NextAuth `trustHost: true`** para que el flow OAuth funcione en local dev sin necesidad de cambiar `NEXTAUTH_URL`.

### Fixes
- **antd v6 deprecations**: `Drawer.width` → `styles.wrapper.width`, `Modal.maskClosable` → `mask.closable`, `Spin.tip` → `description`, `Alert.message` → `title`. Limpieza completa de warnings.
- **CSS Modules `:global()`**: removido de `CategoryRater.css` (Next.js 16 ya no lo tolera fuera de modulos CSS).
- **Image quality whitelist**: `quality={60}` agregado a `images.qualities` en `next.config.ts`.
- **Regresion seasonLabel**: la auto-migracion habia reemplazado una prop dinamica por una constante; restaurada.

### Refactor / housekeeping
- 25 items de roadmap migrados de `ideas.md`/`retomar.md` (que se borraron) a la tabla `FeatureRequest` para tracking real.
- Trim de `README.md` (de 11 KB a 1 KB) — el changelog inline ya esta en DB y la doc tecnica en `context.md`.
- PII removida de notas: emails de admin reemplazados por roles "Flor"/"Juan" sin contacto.

### Suscripciones (deployado antes)
- Suscripciones a series: boton de campana en pagina de serie permite suscribirse para recibir avisos cuando hay novedades.
- Modelo `SeriesSubscription` con dispatch automatico de notificaciones in-app a suscriptores cuando se agregan temporadas, contenido embebido o se publica una resena.
- Helper `notifySeriesSubscribers` no-bloqueante e idempotente reutilizable en cualquier endpoint.
- Campana de notificaciones renderizada en sidebar (desktop) y BottomNav (mobile) con badge de no leidas.
- Hook `useUnreadNotifications` con poll cada 30s, refresh inmediato al volver a la pestaña y pausa cuando esta oculta.
- Catalogo: chips adicionales en cada card (plataforma, genero) para mejor identificacion visual.
- Mobile: rediseno cinematografico del header de serie — poster full-width con fade-out, contenido emerge debajo.
- Pagina /novedades reorganizada: changelog en orden cronologico (mas reciente primero), layout mas compacto.

### Performance
- Preconnect a Supabase storage en root layout (ahorra 100-200ms en primera carga de imagenes).
- DNS-prefetch a hosts de YouTube (i.ytimg.com, img.youtube.com).

## 2026-04 — Catalogo, news, feedback y PWA (deployado)

### Features
- Panel de administracion de changelog en `/admin/changelog`
- CRUD completo de novedades desde DB (`/api/admin/changelog`)
- Endpoint publico de changelog (`/api/changelog`) ahora prioriza DB y usa fallback a archivo
- Boton para importar changelog historico desde `CHANGELOG.md` al panel admin
- Feedback: nueva pestaña "Mis solicitudes" para seguimiento de casos del usuario
- Feedback: hilo de comentarios por solicitud con carga lazy y publicacion inline
- Feedback: gestion completa de casos del usuario en perfil (editar, replicar, comentar, eliminar, cambiar estado)
- Feedback: nuevos endpoints para CRUD de casos y comentarios
- Sidebar admin: acceso directo a "Novedades" y "Casos"
- Noticias BL: Fase 1 completa con panel admin `/admin/noticias`, generacion de resumen con IA y feed publico `/noticias`
- Noticias BL: modelo `News` + `NewsTag` con estados editoriales (`DRAFT | REVIEW | APPROVED | PUBLISHED | REJECTED`)
- Mapeo completo de paises del mundo (~200) con codigos ISO para banderas automaticas
- Rediseno de lista de episodios: layout compacto tipo tabla con seleccion masiva
- Endpoint de borrado masivo de episodios y acciones masivas (marcar vistos/no vistos, eliminar)
- Nuevas categorias de rating: Direccion, Guion, Produccion, Quimica de pareja principal/secundaria
- Banner de bienvenida para visitantes no logueados en el catalogo
- Parejas de protagonistas ordenadas por numero de grupo
- Banderitas de pais en tarjetas de Universos
- Vista de logs responsive con cards para mobile
- Boton "Limpiar scanners" en la pagina de admin logs

### Fixes
- Notificaciones movidas desde el acceso separado del sidebar al panel de configuracion de usuario
- Correciones de i18n en admin/feedback para nuevas claves de navegacion y seguimiento
- Ajustes de tipado y validaciones para soporte de comentarios en feature requests
- Fix: dialogo "Deseas abandonar el sitio" al editar temporadas (beforeunload falso positivo)
- Fix mobile: boton de perfil en BottomNav ya no cierra sesion por error
- Fix landing: estabilizacion de imagen hero en mobile
- Fix PWA: correccion de manifest para instalacion
- Fix PWA: eliminado `head.tsx` incorrecto que apuntaba a `/manifest.json` (404)
- Fix Next.js 16: route handlers dinamicos de feedback actualizados

### Seguridad
- Filtro de paths de scanners en middleware
- Extraccion de IP real del cliente via `CF-Connecting-IP` (Cloudflare)
- No loguear assets/PWA (icons, manifest, sw.js)
- Endpoint para limpiar logs de scanners
- Endpoints `/api/genres` y `/api/episodes/[id]/view-status` ahora con auth correcta

## 2026-03 — Sitios, suggestions y mantenimiento (deployado)

- Nuevas categorias de sitios: Oficiales, Productoras, YouTube
- Constantes de sitios centralizadas en `src/constants/sitios.ts`
- Modelo `SuggestedSite` y API de sitios sugeridos
- Fix: watchLinks no se cargaban al editar una serie
- Fix: "Currently Watching" ahora filtra por usuario autenticado
- Fix: boton "Editar" en watching solo visible para admin/mod
- Logos/imagenes en cards de sitios
- Thumbnails en tabla admin de contenido embebible
- Deteccion y filtro de contenido duplicado en admin
- Filtros clickeables en logs (usuario, accion, ruta, IP)
- Alineamiento de cards en pagina de contenido
- Limpieza de archivos obsoletos
- Baseline de migraciones Prisma (historial limpio)

## 22ba64c

- Mejora en flujo de sitios visitados

## 41e684d

- Fix carga inicial de contenido

## ee34bfa

- Actualizacion de pagina de feedback

## c05d71a

- Mejora del sistema de versiones

## 575649c

- Fix estilos de modales

## 8b32c37

- Fix redirect del router despues de crear contenido

## f9133fe

- Agregar chequeo de version (StaleVersionNotifier)

## e669a65

- Fix flujo de creacion de contenido

## c0dfc93

- Mejoras en formulario de series

## 9402261

- Agregar contenido embebido a la pagina de series

## d1abf70

- Permitir crear universos al vuelo desde el formulario de series

## d397580

- Agregar importacion de canales

## 137c773

- Mejorar pagina de contenido y sitios recomendados

## 4fc5a11

- Soporte para contenido embebido (YouTube, etc.)

## f9534b1

- Agregar pagina de logs de acceso

## c0c5648

- Agregar paginas internas de administracion

## ff31a03

- Tareas de Flor + Supabase Storage + imagenes en feedback

## 7bf8de0

- Mejorar tarjetas de universo

## 6a0eab4

- Agregar posicionador de imagenes

## 297ba4f

- Login con OAuth

## dfa7505

- Primera version funcional
