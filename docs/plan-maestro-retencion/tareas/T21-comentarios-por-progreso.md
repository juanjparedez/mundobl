# T21 — Comentarios de episodio protegidos por progreso

**Fase:** 3 · **Esfuerzo:** M · **Depende de:** T20
**Objetivo:** que el hilo de un episodio sea "la gente que va por el mismo punto que vos". Anti-spoiler por construcción, sin moderación extra.

## Contexto

Ya existen comentarios por episodio (`GET/POST /api/episodes/[id]/comments`, `CommentsList` en `src/components/common/CommentsList.tsx`) y `SpoilerGate` en `src/components/common/SpoilerGate/`.

## Regla

- Con sesión y episodio en VISTA: hilo completo, se puede escribir.
- Con sesión y episodio no visto: se ven solo los **contadores** ("14 comentarios") y un `SpoilerGate` con `t('episodeComments.gated')` "Marcá el episodio como visto para leer y comentar". Botón que lo marca (usa el endpoint de T03) y abre el hilo.
- Sin sesión: contador + CTA de login (reusar `trackCta` de T07 con `where: 'series_anon'`).

Aplicarla en **cliente** (el dato de progreso ya está en `useSeriesUserStatus()`), y en **servidor** para escribir: `POST /api/episodes/[id]/comments` rechaza con `403` si el usuario no tiene ese episodio en VISTA (los admins quedan exentos).

## Extra chico

Al lado del avatar en cada comentario de episodio, un `Chip` "vio hasta E{n}" calculado del progreso del autor en esa serie (incluir en el `select` del endpoint de comentarios un conteo de VISTA del autor para la serie). Solo si el autor no es anónimo.

## i18n

Bloque `episodeComments`: `gated`, `markAndOpen`, `seenUpTo` ("vio hasta E{n}").

## Criterios de aceptación

- [ ] Usuario sin ver el episodio no lee el hilo y el `POST` devuelve 403.
- [ ] Marcarlo desde el gate abre el hilo sin recargar.
- [ ] Admin puede comentar siempre.
- [ ] type-check, lint, build; 10 locales.
