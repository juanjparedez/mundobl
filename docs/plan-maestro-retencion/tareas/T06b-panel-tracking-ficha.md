# T06b — Panel de tracking en la ficha (corrección de T06)

**Fase:** 1 · **Esfuerzo:** M · **Depende de:** T06, T07 (ya mergeadas)
**Objetivo:** que el tracking sea **lo primero que se entiende** en la ficha, sin ir a `/watching`. Lo que quedó de T06 funciona pero es chico, se trunca y desaparece en 98 fichas.

## Qué está mal hoy (revisión 2026-09-20)

1. El texto del stepper se ve como "Voy por e…": el bloque `.view-status-toggle` es `inline-flex` con el `Select` a 200 px, y el label del stepper queda con ~100 px entre dos botones de 44 px.
2. En las 98 series del catálogo **sin episodios cargados** (29 cortos, 32 películas, 14 especiales, 20 series, 3 anime) el stepper no se renderiza (`orderedEpisodes.length > 0`) y solo queda el `Select`. Ejemplo: `/series/1-avi`. La ficha de `.avi` y la de `Always Meet Again` tienen que verse como el mismo componente.
3. El bloque no dice cuál es el **siguiente episodio** ni su título, que es lo que la persona quiere saber al volver.

## Diseño nuevo del bloque (con sesión)

Un solo panel `.tracking-panel` (nuevo componente `src/components/series/TrackingPanel/TrackingPanel.tsx` + `.css`, que reemplaza el render con sesión de `ViewStatusToggle.tsx`; `ViewStatusToggle` queda solo para la rama anónima o se renombra, a criterio, sin romper `page.tsx`). Ocupa **todo el ancho de la columna del póster en desktop y todo el ancho en móvil**. Layout en tres filas:

1. **Estado**: el `Select` actual (SIN_VER / VIENDO / VISTA / ABANDONADA / RETOMAR) a ancho completo.
2. **Progreso** (solo si hay episodios): fila `[−] [ Ep. 2 / 8 ] [+]`, con el label en dos partes: número grande (`Ep. 2`) y total chico (`/ 8`). Key nueva `progressStepper.short` = "Ep. {current} / {total}"; el texto largo `progressStepper.at` pasa a `aria-label` y tooltip. Debajo, la barra. Debajo de la barra, una línea `t('trackingPanel.next')` "Siguiente: **T1·E3** — {título del episodio si existe}", o `t('trackingPanel.allWatched')` "Viste todos los episodios" cuando corresponde.
3. **Sin episodios cargados**: en lugar de la fila 2, un botón a ancho completo `t('trackingPanel.markWatched')` "Ya la vi" (→ `POST view-status { status: 'VISTA' }`) que cambia a `t('trackingPanel.markUnwatched')` "Marcar como no vista" cuando el estado es VISTA. Para cortos y películas, este botón **es** el tracking. Texto secundario `t('trackingPanel.noEpisodes')`: "Esta ficha no tiene episodios cargados; podés marcarla completa."

El label del stepper nunca se trunca: `min-width: 0` en el contenedor y `font-variant-numeric: tabular-nums`; en anchos < 360 px los botones bajan a 40 px.

## Anónimo (T07)

Mismo panel, misma posición y ancho, con el `ActionCard` + stepper local + botón "Empezar a seguir". Si la serie no tiene episodios, sin stepper y el botón dice `t('trackCta.buttonNoEpisodes')` "Marcarla como vista" (guarda la intención con `upToEpisodeId: null` y `markWatched: true`; `PendingTrackApplier` aplica `VISTA` en vez de `VIENDO` en ese caso; agregar el campo opcional a `PendingTrack`).

## Archivos

- Nuevo `TrackingPanel/` (+ CSS con tokens).
- `ViewStatusToggle.tsx` / `.css`: rama con sesión delega en `TrackingPanel`; quitar `inline-flex` y el `min-width: 200px` del `Select`.
- `WatchProgressStepper.tsx` / `.css`: label corto + `aria-label` largo; prop `nextEpisodeLabel?: string` opcional para mostrar la línea "Siguiente".
- `src/lib/pending-track.ts`, `PendingTrackApplier.tsx`: campo `markWatched`.
- `page.tsx` de la ficha: pasar `title` de los episodios en el `select` de `seasons.episodes` si no viene ya (`grep -n "episodes" src/app/(app)/series/[id]/page.tsx`).

## i18n

Bloque nuevo `trackingPanel`: `next`, `allWatched`, `markWatched`, `markUnwatched`, `noEpisodes`. En `progressStepper`: `short`. En `trackCta`: `buttonNoEpisodes`.

## Criterios de aceptación

- [ ] `/series/1-avi` y `/series/237-always-meet-again` muestran el mismo panel, en el mismo lugar, con el mismo ancho; en `.avi` la segunda fila es el botón "Ya la vi".
- [ ] A 375 px y a 1280 px el texto del stepper se lee completo ("Ep. 2 / 8"), nunca con puntos suspensivos.
- [ ] Debajo de la barra se lee "Siguiente: T1·E3" con el título del episodio cuando existe.
- [ ] Anónimo en `.avi`: CTA sin stepper; al volver del login la serie queda en VISTA.
- [ ] Cambiar el `Select` a VISTA en una serie con episodios no marca episodios (comportamiento actual, sin cambios).
- [ ] type-check, lint, build; 10 locales.
