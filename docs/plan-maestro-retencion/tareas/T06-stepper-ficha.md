# T06 — Stepper "Voy por el episodio N" en la ficha

**Fase:** 1 · **Esfuerzo:** M · **Depende de:** T04, T05
**Objetivo:** que marcar progreso sea un gesto de un toque en el móvil, en vez de un checkbox por fila. Es la interacción principal del producto.

## Dónde

En `src/app/(app)/series/[id]/page.tsx`, hoy se renderiza `<ViewStatusToggle seriesId seasons />` (línea ~293) dentro del header. El stepper va **al lado** del `Select` de estado, dentro del mismo bloque, y reemplaza la barra `Progress` pasiva cuando hay sesión.

## Componente nuevo

`src/components/series/WatchProgressStepper/WatchProgressStepper.tsx` + `.css`. Named export `WatchProgressStepper`. Props:

```ts
interface WatchProgressStepperProps {
  seriesId: number;
  episodes: Array<{ id: number; seasonNumber: number; episodeNumber: number }>; // ya ordenados
  source: 'stepper' | 'onboarding'; // para analytics (T01)
  compact?: boolean;                 // para reutilizar en onboarding/cards
}
```

Lee `episodeStatus` y `refetch` de `useSeriesUserStatus()` (T04). Estado derivado: `current` = índice del último episodio en VISTA (contiguo desde el inicio; si hay huecos, el último marcado).

UI (Ant Design):

- Fila: botón `−` · texto `t('progressStepper.at')` interpolado: "Voy por el **3** de 8" · botón `+` · barra `Progress` fina abajo (la misma que hoy, pero viva).
- Tocar el número abre un `Select` (o `InputNumber`) con la lista `T1·E1 … T2·E5` para saltar directo.
- `+` → `POST /api/series/[id]/progress { upToEpisodeId: siguiente }`. `−` → `{ upToEpisodeId: anterior, direction: 'unmark' }` (si `current` es 0, `−` está deshabilitado).
- Optimista: actualizar el número al instante, revertir si falla, `message.error(t('progressStepper.error'))`.
- Tras `200` → `refetch()` del provider y `trackFunnel('episode_marked', { source, status })`.
- Si la respuesta trae `allWatched: true` → mostrar un `Popconfirm`/`PanelModal` chico: `t('progressStepper.finishedTitle')` "¿Terminaste **{title}**?" con botones `t('progressStepper.markComplete')` (→ `POST /api/series/[id]/view-status { status: 'VISTA' }`, luego `refetch()`) y `t('progressStepper.notYet')`. Nunca cambiar a VISTA sin confirmación.

Sin sesión: no renderizar nada (T07 se encarga del anónimo).

## Cambios en `ViewStatusToggle.tsx`

- Con sesión: reemplazar el bloque `<Progress>` por `<WatchProgressStepper …>`. Pasar los episodios aplanados y ordenados a partir de la prop `seasons` (agregar `seasonNumber` y `episodeNumber` al tipo de la prop; ajustar el `select` en `page.tsx` si no los trae).
- Sin sesión: no tocar (T07).

## i18n (bloque nuevo `progressStepper`)

`at` ("Voy por el {current} de {total}"), `next` ("Vi el siguiente"), `prev`, `jumpTo`, `error`, `finishedTitle`, `markComplete`, `notYet`, `ariaNext`, `ariaPrev`.

## Criterios de aceptación

- [ ] En móvil (375 px) el stepper entra en una línea y los botones tienen ≥ 44 px de alto.
- [ ] `+` tres veces seguidas deja 3 episodios en VISTA, la serie en VIENDO y `/watching` la muestra.
- [ ] Al llegar al último episodio aparece la pregunta; "Todavía no" deja la serie en VIENDO.
- [ ] Los checkboxes de `EpisodesList` reflejan el cambio sin recargar (vía `refetch`).
- [ ] Cero hex en el CSS; tokens de `variables.css`.
- [ ] type-check, lint, build; 10 locales.
