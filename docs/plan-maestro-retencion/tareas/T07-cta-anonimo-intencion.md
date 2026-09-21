# T07 — CTA para anónimos en la ficha + intención pendiente

**Fase:** 1 · **Esfuerzo:** M · **Depende de:** T05, T06
**Objetivo:** la ficha es la landing real (Google manda ahí). Hoy el anónimo ve un tag pasivo "Sin ver · 0 de 8 episodios". Tiene que ver una invitación concreta, y al volver del login no tener que repetir el gesto.

## UI para anónimos (en `ViewStatusToggle.tsx`, rama `!session?.user`)

Reemplazar `Tag + Progress` por un `ActionCard` compacto del design-system:

- Título: `t('trackCta.title')` → "¿La estás viendo?"
- Texto: `t('trackCta.subtitle')` → "Marcá por qué episodio vas y seguila desde tu lista."
- Botón primario: `t('trackCta.button')` → "Empezar a seguir".
- Debajo, un `Select`/stepper **visual** (mismo `WatchProgressStepper` en modo `compact` pero sin sesión: solo cambia un número local) para que la persona elija "voy por el 3" **antes** de loguearse. Si no elige, la intención es "empezar" (serie en VIENDO sin episodios).

Al tocar el botón:

1. `trackFunnel('track_cta_click', { where: 'series_anon' })`.
2. Guardar la intención: `savePendingTrack({ seriesId, upToEpisodeId: elegido | null, createdAt: Date.now() })`.
3. `signIn('google', { callbackUrl: window.location.pathname })`.

## Módulo de intención

`src/lib/pending-track.ts` (sin `'use client'`; solo funciones puras sobre `sessionStorage`, guardadas con `try/catch`):

```ts
export interface PendingTrack { seriesId: number; upToEpisodeId: number | null; createdAt: number }
export function savePendingTrack(p: PendingTrack): void
export function readPendingTrack(): PendingTrack | null   // null si no hay o si createdAt > 30 min
export function clearPendingTrack(): void
```

Key: `mundobl.pendingTrack`.

## Aplicador

`src/components/series/PendingTrackApplier/PendingTrackApplier.tsx` (client, sin UI propia). Montarlo dentro de `SeriesUserStatusProvider` en `page.tsx`. Lógica en un `useEffect`:

- Si `sessionStatus === 'authenticated'` y `readPendingTrack()?.seriesId === seriesId`:
  - con `upToEpisodeId` → `POST /api/series/[id]/progress { upToEpisodeId }`;
  - sin él → `POST /api/series/[id]/view-status { status: 'VIENDO' }`.
  - Tras éxito: `clearPendingTrack()`, `refetch()`, `message.success(t('trackCta.applied'))` interpolado con el título si está disponible, y `trackFunnel('episode_marked', { source: 'stepper', status: 'VISTA' })` solo si hubo episodios.
- Guardar un `ref` para no aplicar dos veces en Strict Mode.

## i18n (bloque nuevo `trackCta`)

`title`, `subtitle`, `button`, `applied` ("Listo, ya estás siguiendo esta serie"), `chooseEpisode` ("¿Por qué episodio vas?").

## Criterios de aceptación

- [ ] Anónimo en móvil ve la tarjeta arriba del pliegue (junto al póster, no debajo de "Dónde ver").
- [ ] Elegir "voy por el 3" → login → vuelve a la misma ficha con 3 episodios marcados, serie VIENDO, sin tocar nada más.
- [ ] Sin elegir episodio → vuelve con la serie en VIENDO.
- [ ] Una intención de otra serie no se aplica en esta ficha y sí en la suya.
- [ ] Intención de más de 30 minutos se descarta.
- [ ] Si `sessionStorage` está bloqueado, el botón igual lleva al login sin romper.
- [ ] type-check, lint, build; 10 locales.
