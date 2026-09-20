# T08 — Botón "+1" claro en /watching

**Fase:** 1 · **Esfuerzo:** S · **Depende de:** T03
**Objetivo:** que la acción principal de `/watching` sea marcar el siguiente episodio, no navegar a la ficha.

## Contexto

`src/components/watching/CurrentlyWatchingDashboard.tsx` ya tiene `handleMarkNextEpisode` (línea ~330) conectado a un botón de ícono `CheckOutlined` con tooltip `watchingDashboard.markEpisodeTooltip` (línea ~600), y un botón primario `continueButton` que va a la ficha.

## Cambios

1. Invertir jerarquía: el botón **primario y con texto** pasa a ser "Vi el {n}" (`t('watchingDashboard.markNextLabel')` interpolado con el número del siguiente episodio: "Vi el ep. 4"). El botón "Continuar/Detalles" pasa a `type="default"`.
2. Cuando ya no queda siguiente (todo visto): el primario pasa a `t('watchingDashboard.markCompleteLabel')` "Terminé la serie" → `POST /api/series/[id]/view-status { status: 'VISTA' }` con `Popconfirm`. Al confirmar, la card sale de la lista con `message.success`.
3. Optimista: al tocar "Vi el n", actualizar el progreso local de la card antes de la respuesta; revertir si falla.
4. Reordenar la lista tras marcar si el orden es `lastWatched` (la serie pasa arriba), usando `lastWatchedAt` de la respuesta de T03 (`series.lastWatchedAt`).
5. Analytics (T01): `episode_marked { source: 'watching' }`, `series_status_set { status: 'VISTA', source: 'watching' }`.

## i18n

Bajo `watchingDashboard`: `markNextLabel` ("Vi el ep. {n}"), `markCompleteLabel`, `markCompleteConfirm` ("¿Marcar {title} como terminada?").

## Criterios de aceptación

- [ ] En móvil el botón "Vi el ep. n" es lo primero que se ve en cada card y tiene ≥ 44 px.
- [ ] Marcar sube la serie al tope con orden "última vista".
- [ ] Al terminar el último episodio aparece "Terminé la serie" y al confirmar desaparece de `/watching`.
- [ ] type-check, lint, build; 10 locales.
