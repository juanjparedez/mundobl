# Plan de proxima iteracion — chunk de `requests/3` (2026-09-05)

Arco acotado y prudente, recortado de `docs/pendientes-2026-09-05.md`, pensado para resolverse
en una sola ronda sin tocar todavia las piezas mas grandes o que necesitan una decision de
producto propia (esas quedan listadas al final como explicitamente fuera de este chunk).

Prioridad sugerida: 1 → 5 (el fix del bug es independiente y de bajo riesgo; 2-5 comparten area
de trabajo — `/ver` y `/admin/colaborador` — asi que conviene encadenarlos).

## 1. Fix del bug de carrusel en `/catalogo`

**Causa raiz confirmada** (no es el `transform` de la card, ese es inofensivo):

- `.serie-card-secondary-meta` anima `max-height: 0 → 44px` en `:hover`
  (`src/app/(app)/catalogo/catalogo.css:523,540`) — `max-height` es una propiedad de layout,
  no de compositor, asi que dispara reflow real.
- `.catalog-carousel-row__track` es `display:flex` sin `align-items` explicito
  (`CatalogCarouselRow.css:51-58`) → default `align-items: stretch`, y el track no tiene altura
  fija ni `overflow-y: hidden`.
- Resultado: al crecer una sola card, la fila entera se estira (`stretch`) y, como las filas del
  catalogo se apilan en columna, **empuja hacia abajo todas las filas siguientes** — exactamente
  el reporte ("se expande toda la linea... otras lineas son afectadas").
- **Mobile**: en `≤480px` ya esta mitigado — `catalogo.css:1106-1110` fuerza
  `opacity:1; max-height:none` (el bloque queda siempre visible, sin animacion). Pero
  `@media (hover: none)` (linea 343) solo cubre `.serie-card-actions`, no
  `.serie-card-secondary-meta` — en tablets/touch entre 481px y 768px+ un tap con "sticky hover"
  todavia puede disparar el reflow.

**Fix propuesto**: aplicar el mismo patron que ya usan bien `MediaCarousel`
(`src/components/streaming/MediaCarousel/MediaCarousel.css`) y `WatchableCarousel`
(`src/components/common/WatchableCarousel/WatchableCarousel.css`) — revelar el bloque de
metadata solo con `transform`/`opacity` reservando el espacio siempre (sin animar
`max-height`), y extender `@media (hover: none)` para que tambien neutralice
`.serie-card-secondary-meta`, no solo `.serie-card-actions`.

**Archivos**: `src/app/(app)/catalogo/catalogo.css`,
`src/app/(app)/catalogo/carousel/CatalogCarouselRow/CatalogCarouselRow.css`.

## 2. Unificar la card visual entre `/catalogo` y `/ver`

Hoy hay dos implementaciones de card hechas a mano: `ver-card` en
`src/app/(app)/ver/VerPage.tsx` (~lineas 369-485) y `serie-card` en
`src/app/(app)/catalogo/CatalogoClient.tsx` (`renderSingleCard`, ~linea 694). Migrar ambas a
`MediaCard` de `src/components/design-system/` — es el punto explicito de `requests/3`
("tratemos de reusar todo lo posible del catalogo principal... reusable en ambos catalogos") y
mejora directo la vista `/ver` que hoy esta "descuidada".

**Alcance de este chunk**: solo la card. La unificacion completa del *motor* de carrusel
(`CatalogCarouselRow` vs `MediaCarousel`) es un cambio mayor — queda fuera, ver abajo.

## 3. Filtros en "Mis series" del panel de colaborador

`src/app/(app)/admin/colaborador/ColaboradorClient.tsx` hoy solo tiene un buscador de texto
libre. Agregar filtro por estado/visibilidad, pais y rango de fecha, reusando
`AdminTableToolbar` de `src/components/admin/` (mismo componente que ya usa este panel para el
resto de la UI de admin).

## 4. Estadisticas propias sin leak

Nueva funcion `getCollaboratorStats(userId)` en `src/lib/database.ts`, clonando el patron de
agregacion anonima ya usado en `src/app/api/stats/public/route.ts` (`Promise.all` de
`count`/`groupBy`), pero filtrando por `submittedById = self` en vez de excluir `USER_EMBED`:
vistas (`ViewStatus`), favoritos (`UserFavorite`), comentarios (`Comment`), reseñas (`Review`),
suscripciones (`SeriesSubscription`) — agregado por serie propia. Mostrar con `StatCard` del
design-system dentro de `/admin/colaborador`.

**Cuidado explicito**: nunca devolver identidad de los usuarios que generaron esas
interacciones, y nunca tocar `AccessLog` (tiene `userId`/`ip`/`userAgent`, sensible). Reusar
`assertSeriesOwnership` de `src/lib/collaborator-guard.ts` en el endpoint nuevo.

## 5. Vista de notificaciones dentro del panel de colaborador

La infraestructura ya existe y ya dispara: `src/app/api/admin/user-series/[id]/visibility/route.ts:66-96`
crea una `Notification` (`series_approved`/`series_rejected`) cuando cambia el estado de un
aporte. Falta una vista dentro de `/admin/colaborador` que las liste, reusando
`/api/notifications/*` (`src/app/api/notifications/`). **Sin crear tipos nuevos todavia** —
esta ronda es solo darle visibilidad a lo que ya se genera.

---

## Explicitamente fuera de este chunk

Documentado pero pospuesto a una iteracion posterior — no forman parte de este plan:

- Unificacion completa del motor de carrusel (`CatalogCarouselRow` vs `MediaCarousel`).
- Canal de comunicacion privado colaborador ↔ equipo de curaduria (necesita definir modelo de
  privacidad antes de tocar codigo).
- Documentacion/guias para colaboradores (es contenido a redactar, no solo codigo).
- Soporte tecnico dedicado (evaluar si extender `FeatureRequest` con visibilidad restringida o
  crear un canal nuevo).
- Cableado automatico de `Announcement` a eventos del flujo de colaborador + audiencia por rol
  `COLLABORATORS`.
- Todo lo pendiente del Glosario Cultural (`requests/2`) — ver
  `docs/pendientes-2026-09-05.md`.
- Limpieza de recursos de Vercel (`requests/1`) — pospuesta por decision explicita del usuario.

## Verificacion al implementar este chunk

- `npm run lint:fix` y `npm run build` despues de tocar `catalogo.css`/`CatalogCarouselRow.css`
  (punto 1) y de introducir `MediaCard` en `/ver` y `/catalogo` (punto 2).
- Probar el hover del bug manualmente en `/catalogo` (desktop) y con emulacion touch en
  DevTools (para el caso `hover:none` entre 481-768px) antes/despues del fix.
- Confirmar que las nuevas queries de estadisticas (punto 4) nunca devuelven `userId`/`ip` de
  terceros — revisar el shape de la respuesta del endpoint a mano.
- Los textos nuevos de UI (filtros, stats, notificaciones en el panel) son "user-facing nuevo"
  → agregar sus keys a `src/i18n/messages.ts` y a los 10 locales, por `CLAUDE.md`.
