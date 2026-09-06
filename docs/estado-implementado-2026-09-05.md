# Estado implementado — repaso de requests 1, 2 y 3 (2026-09-05)

Repaso hecho para responder "¿cómo venimos?" sobre `requests/1`, `requests/2` y `requests/3`,
antes de planear la próxima iteración. Complementa a `CHANGELOG.md` (fuente de verdad de
releases) con el detalle tecnico que no entra ahi. Ver tambien `docs/pendientes-2026-09-05.md`
y `docs/plan-proxima-iteracion-2026-09-05.md`.

## Request 1 — Colaboradores externos

Decision tomada en `requests/1` ("crear un rol especifico para colaborador externo, con admin
reducido en `/ver`, sin tocar el catalogo curado") ya esta implementada de punta a punta:

- **Rol `COLLABORATOR`**: `enum Role { ADMIN, MODERATOR, COLLABORATOR, VISITOR }`
  (`prisma/schema.prisma:16-24`, con comentario explicito del flujo). Se asigna a mano desde
  `/admin/usuarios` (`PUT /api/users/[id]/role`) — nunca autoservicio.
- **Panel reducido `/admin/colaborador`**:
  - `ColaboradorClient.tsx` — lista solo las series propias (`origin=USER_EMBED`,
    `submittedById=self`): titulo/pais/año/episodios/estado, borrar, link a "ver en /ver".
  - `/admin/colaborador/importar` — importa una serie completa desde una playlist de YouTube
    usando la **YouTube Data API** (no Gemini, salvo "traducir sinopsis" opcional). Esto ya
    responde la duda abierta en `requests/1` ("no quiero darle acceso a mis AI credits... ya
    debe tener la info ahi"): el importador de colaborador no gasta creditos de IA salvo que el
    propio colaborador pida traducir. Rate limit propio: `checkCollaboratorImportRateLimit`
    (200 series/dia) en `src/lib/rate-limit.ts`. Chequeo automatico de restriccion de edad via
    `checkYouTubeAgeRestriction` (`src/lib/channel-fetcher.ts`).
  - `/admin/colaborador/[id]` (`CollaboratorSeriesForm.tsx`) — ficha reducida (titulo, sinopsis,
    poster, pais, productora, actores, tags, generos, bloques de info, tabla de episodios
    solo-lectura). Sin campos curatoriales (featured, review, overallRating, notesPrivate,
    universo, series relacionadas).
- **Guardas de acceso**: `src/proxy.ts:274-287` bloquea cualquier otra ruta `/admin/*` para
  `COLLABORATOR` y redirige siempre a `/admin/colaborador`. `src/lib/collaborator-guard.ts`
  centraliza `assertSeriesOwnership` / `assertInfoBlockOwnership`, reusable en endpoints nuevos.
- **Endpoint propio**: `src/app/api/colaborador/series/[id]/route.ts` (`PATCH` con subset seguro
  de campos editables).
- **`/ver` (catalogo de contenido externo)**: ya rediseñado como "Streaming Hub" — reusa
  `HeroBillboard` y `MediaCarousel` de `src/components/streaming/`, vista grid con filtros
  (busqueda, pais, plataforma, "solo curado"), boton "Aportar" (`/ver/agregar`) para cualquier
  usuario logueado. Reseñas y suscripcion habilitadas tambien para series `USER_EMBED` (antes
  solo resenas estaban bloqueadas).
- **Aviso a colaboradores**: el sistema de `Announcement` (`src/app/(app)/admin/anuncios/`,
  modelos `Announcement`/`AnnouncementRecipient`) ya soporta audiencia `SPECIFIC_USERS` via
  `AnnouncementRecipient` — permite avisar a un colaborador puntual tal como planteaba el amend
  de `requests/1` ("con el administrador de anuncios le vamos a avisar cuando el flujo este
  armado").
- **Notificaciones de estado de aporte**: ya se dispara una `Notification`
  (`series_approved` / `series_rejected`, con `linkPath` a `/ver/{id}`) cuando un
  ADMIN/MODERATOR cambia la visibilidad de un aporte, desde
  `src/app/api/admin/user-series/[id]/visibility/route.ts:66-96`.

## Request 2 — Glosario Cultural

Trabajo de la sesion 2026-09-04/05 (`CHANGELOG.md`, PR #3 `wip/glosario-cultural`):

- **Glosario dinamico**: los terminos salen de `GlossaryTerm` en la base, ya no estan
  hardcodeados en `src/data/cultural-glossary.ts` (ese archivo se migro via
  `scripts/seed-cultural-glossary.ts`).
- **Contribucion + moderacion**: tab "Contribute" en `GlosarioClient.tsx` →
  `POST /api/glossary-suggestions` (auth-gated) → modelo `GlossarySuggestion`
  (`PENDING/APPROVED/REJECTED`) → panel `/admin/glosario`
  (`GlosarioSuggestionsClient.tsx`) → `PATCH /api/admin/glossary-suggestions/[id]` hace
  `upsert` a `GlossaryTerm` al aprobar, preservando fuente, ejemplos de uso y errores comunes
  de traduccion.
- **Tags**: filtro por tag y chips por tarjeta en `GlosarioClient.tsx`, compartiendo el modelo
  `GlossaryTermTag` con el catalogo.
- **Recursos externos**: la tab "Resources" dejo de ser una lista hardcodeada — se gestiona
  como `RecommendedSite` (categoria "Glosario Cultural") desde `/admin/sitios`, con atribucion
  de fuente visible.
- **Logros ligados al glosario y la trivia** (alcance acotado, ver
  `docs/gamificacion-roadmap.md`): 3 logros nuevos en `/perfil` — "Voz cultural" y "Colaborador
  cultural" por `stats.approvedGlossaryTerms`, y "Sabelotodo cultural" por puntaje perfecto en
  la trivia. El mejor puntaje de la trivia ahora se guarda por usuario
  (`User.glossaryQuizBestScore`, `GET`/`PATCH /api/user/glossary-quiz-score`) sin romper el
  fallback a `localStorage` para usuarios anonimos.
- **Trivia intacta**: `GlosarioQuiz.tsx` / `QuizEngine` no se tocaron mas que para sumar la
  persistencia de puntaje — sin regresion (verificado con `tsc --noEmit`, `eslint` y build de
  produccion segun el commit).
- **Cuidado de recursos de la capa gratuita**: `revalidate = 3600` (ISR) en la pagina del
  glosario, recursos externos linkeados (no scrapeados/embebidos), envio de sugerencias
  auth-gated con limites de longitud.
- **README renovado** con presentacion mas visual del proyecto.

## Catalogo — prior art reusable para el fix del bug de `requests/3`

No es parte de lo pedido en `requests/1`/`requests/2`, pero es evidencia relevante para el
proximo paso: `MediaCarousel` (`src/components/streaming/MediaCarousel/`) y
`WatchableCarousel` (`src/components/common/WatchableCarousel/`) **ya resuelven bien** el hover
de sus cards — solo animan `transform`/`opacity` (compositor puro) y el "zoom" de imagen ocurre
dentro de un wrapper con `overflow: hidden`, sin nunca cambiar el alto real de la card. Es el
patron a copiar para arreglar el bug de `/catalogo` (ver
`docs/plan-proxima-iteracion-2026-09-05.md`).

## Request 3

Nada de lo pedido en `requests/3` (fix del carrusel, mejoras a `/ver`, cierre de herramientas
de colaborador) esta implementado todavia — es el contenido de
`docs/plan-proxima-iteracion-2026-09-05.md` y del resto de `docs/pendientes-2026-09-05.md`.
