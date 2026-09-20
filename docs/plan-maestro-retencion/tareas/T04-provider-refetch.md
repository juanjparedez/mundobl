# T04 — `refetch()` en SeriesUserStatusProvider

**Fase:** 1 · **Esfuerzo:** S · **Depende de:** nada
**Objetivo:** que un cambio masivo de estado (stepper de T06, intención de T07, onboarding) se refleje en todos los componentes de la ficha sin recargar.

## Contexto

`src/components/series/SeriesUserStatusProvider.tsx` hace un solo `fetch('/api/series/[id]/my-status')` al montar y expone `{ seriesStatus, seasonStatus, episodeStatus, subscribed, loaded }`. Por diseño no tiene setters; los consumidores (`ViewStatusToggle`, `EpisodesList`, `SeasonsList`, `ReviewsSection`, `SeriesSubscribeButton`) siembran su estado local con `useEffect` cuando `loaded` pasa a `true`.

## Cambio

1. Agregar al contexto `refetch: () => Promise<void>` que vuelve a pedir `my-status` y reemplaza el valor (con `loaded: true`). Debe ignorar respuestas viejas si se llama dos veces seguidas (contador de request).
2. Agregar `version: number` que se incrementa en cada carga exitosa. Los consumidores que siembran estado local pasan de depender de `[loaded, ...]` a depender de `[version, ...]` en su `useEffect`, así re-siembran tras un `refetch()`.
3. Actualizar los consumidores que hoy siembran con `loaded`: `ViewStatusToggle.tsx` (`useEffect` sobre `seriesStatus`) y `EpisodesList.tsx` (siembra `episodeStatus`, ver el `useEffect` cerca de la línea 95). Los demás solo si también siembran (verificar con `grep -n "loaded" src/components/series/*.tsx`).

## Criterios de aceptación

- [ ] Llamar `refetch()` desde la consola (exponer temporalmente) actualiza el `Select` de estado y los checks de episodios sin recargar.
- [ ] Dos `refetch()` seguidos no dejan el estado en la respuesta más vieja.
- [ ] Sin sesión, `refetch()` es no-op.
- [ ] Sin cambios visuales. type-check, lint, build en verde.
