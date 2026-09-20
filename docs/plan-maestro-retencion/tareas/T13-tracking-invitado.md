# T13 — Tracking como invitado (localStorage)

**Fase:** 1 · **Esfuerzo:** L · **Depende de:** T05, T07 · **Última de la fase**
**Objetivo:** dejar probar el tracker sin cuenta. Hoy el 98,7 % de los visitantes se va sin registrarse. Cuando el invitado se loguea, todo lo que marcó se fusiona con su cuenta.

## Alcance

- Solo **progreso por serie** (`upToEpisodeId` o "empezada"), no notas, ratings ni favoritos.
- Máximo 50 series como invitado; al superar, pedir login.

## Módulo

`src/lib/guest-tracking.ts` (funciones puras sobre `localStorage`, key `mundobl.guestTracking`, versión `v1`, `try/catch` en todo):

```ts
export interface GuestEntry { seriesId: number; upToEpisodeId: number | null; updatedAt: number }
export function getGuestEntries(): GuestEntry[]
export function setGuestProgress(seriesId: number, upToEpisodeId: number | null): void
export function removeGuestEntry(seriesId: number): void
export function clearGuestTracking(): void
```

Y un hook `useGuestTracking(seriesId)` que devuelve `{ entry, setProgress }` y se sincroniza con el evento `storage`.

## UI

- En la ficha, anónimo: el `WatchProgressStepper` de T07 deja de ser solo visual y persiste en `guest-tracking`. Debajo, texto discreto `t('guest.notice')`: "Guardado en este navegador. Iniciá sesión para no perderlo y verlo en tu lista." con link a login (misma intención de T07).
- `/watching` anónimo: en vez del `loginPrompt`, mostrar las series del invitado (pedir `GET /api/series/bulk?ids=` — crear si no existe, público, devuelve `id, title, imageThumbUrl, episodeCount`) con el mismo `CurrentlyWatchingDashboard` en modo `guest` (sin botones de estado, solo "+1" local y el aviso de login arriba). Si no hay entradas, `EmptyState` con CTA al catálogo.
- Barra fija inferior (solo si hay ≥ 1 entrada como invitado y no hay sesión): "Tenés {n} series guardadas en este navegador · Iniciar sesión". Cerrable por sesión de navegador.

## Fusión al loguearse

`src/components/common/GuestTrackingMerger/GuestTrackingMerger.tsx` (client, sin UI) en el layout de `(app)`: cuando `status` pasa a `authenticated` y hay entradas → `POST /api/user/tracking/import` con el array. Endpoint nuevo (`requireAuth`): por cada entrada llama `setProgress()` (T05) o `view-status VIENDO`; **nunca** baja un progreso que el usuario ya tenía más alto en su cuenta (comparar `(seasonNumber, episodeNumber)` del último VISTA). Responde `{ imported, skipped }`. Tras éxito: `clearGuestTracking()`, `message.success(t('guest.merged'))` con `n`, `refetch()` si estamos en una ficha. Idempotente.

Con la fusión funcionando, el gate de onboarding (T11b) debe tratar `trackedSeriesCount > 0` tras la importación como "no mostrar wizard" (ya lo hace por la regla general).

## i18n (bloque nuevo `guest`)

`notice`, `bar` ("Tenés {n} series guardadas en este navegador"), `barLogin`, `merged` ("Importamos {n} series a tu cuenta"), `limitReached`, `watchingTitle` ("Tus series (sin cuenta)").

## Criterios de aceptación

- [ ] Anónimo marca "voy por el 3" en dos series, cierra el navegador, vuelve: `/watching` las muestra.
- [ ] Al loguearse, las dos series aparecen en la cuenta con el progreso correcto y `localStorage` queda vacío.
- [ ] Si la cuenta ya tenía la serie en el episodio 6, la importación no la baja a 3.
- [ ] Con `localStorage` bloqueado nada explota; el stepper vuelve al modo solo visual de T07.
- [ ] type-check, lint, build; 10 locales.
