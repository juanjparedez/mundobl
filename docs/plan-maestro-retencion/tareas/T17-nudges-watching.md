# T17 — Nudges "casi terminás" / "en pausa" en /watching

**Fase:** 2 · **Esfuerzo:** S · **Depende de:** T08
**Objetivo:** que `/watching` le diga al usuario qué hacer con lo que tiene, con una acción de un toque. Todo se calcula en cliente con datos que la página ya carga.

## Reglas (mismas que T15, para que app y email digan lo mismo)

- **Casi terminás**: `total - watched` ∈ [1, 2] y `total ≥ 4`.
- **En pausa**: `lastWatchedAt` más viejo que 21 días y quedan episodios sin ver.
- **Hoy toca capítulo**: ya existe (`getAirDayStatus`); dejarlo.

Si T15 ya movió `getAirDayStatus` a `src/lib/air-days.ts`, agregar ahí `getNudge(card): 'almostDone' | 'paused' | null` y reutilizarla.

## UI en `CurrentlyWatchingDashboard.tsx`

- `Chip` del design-system arriba del título de la card: `t('watchingDashboard.nudgeAlmostDone')` "Te faltan {n}" (tono success) o `t('watchingDashboard.nudgePaused')` "Sin actividad hace {days} días" (tono warning).
- En pausa: dos botones chicos debajo del chip, `t('watchingDashboard.resume')` "Retomar" (→ `POST view-status { status: 'VIENDO' }`, que actualiza `lastWatchedAt` y saca el chip) y `t('watchingDashboard.drop')` "Abandonar" (→ `{ status: 'ABANDONADA' }` con `Popconfirm`; la card sale de la lista).
- Filtro/orden: agregar `SortOption` `'nudge'` que pone primero "casi terminás", después "en pausa", después el resto por `lastWatched`. Hacerlo el orden por defecto **solo** si hay al menos una card con nudge.

## i18n

`watchingDashboard.nudgeAlmostDone`, `nudgePaused`, `resume`, `drop`, `dropConfirm`, `sortNudge`.

## Criterios de aceptación

- [ ] Serie de 8 con 7 vistos → chip "Te faltan 1" y queda primera.
- [ ] Serie sin actividad hace 30 días → chip de pausa con los dos botones; "Retomar" lo saca sin recargar.
- [ ] Ningún chip en series con todo visto o sin episodios cargados.
- [ ] type-check, lint, build; 10 locales.
