# T01 — Eventos de embudo en analytics

**Fase:** 0 · **Esfuerzo:** S · **Depende de:** nada
**Objetivo:** poder responder "cuántos de los que ven un CTA terminan marcando un episodio" sin adivinar. Hoy solo existen `locale_switch` y `quick_preview_open`.

## Contexto

- Helper: `src/lib/analytics.ts` → `trackEvent(name, props)`. Ya es no-op fuera de producción.
- Regla del helper: solo datos no personales, y cada evento tiene que justificar su costo (límite del plan gratuito de Vercel).

## Eventos a agregar (exactamente estos nombres y props)

| Evento               | Props                                              | Dónde se dispara |
| -------------------- | -------------------------------------------------- | ---------------- |
| `episode_marked`     | `{ source: 'list' \| 'stepper' \| 'watching' \| 'onboarding', status: 'VISTA' \| 'SIN_VER' }` | cada vez que se marca/desmarca un episodio con éxito |
| `series_status_set`  | `{ status: 'VIENDO' \| 'VISTA' \| 'ABANDONADA' \| 'RETOMAR' \| 'SIN_VER', source: 'toggle' \| 'watching' \| 'auto' }` | cambio de estado de serie con éxito |
| `track_cta_click`    | `{ where: 'series_anon' \| 'home' }`               | clic en un CTA de "empezá a trackear" siendo anónimo (T07 y T09 lo usan; acá se define) |
| `onboarding_step`    | `{ step: 1 \| 2 \| 3 \| 'done' \| 'skip' }`        | T11b lo usa; acá se define el contrato |

No agregar más. No incluir `seriesId`, `userId` ni títulos.

## Archivos a tocar

- `src/lib/analytics.ts`: agregar un tipo `FunnelEvent` con los cuatro nombres y una función `trackFunnel(event: FunnelEvent, props)` tipada, para que nadie escriba el nombre a mano. `trackEvent` queda como está.
- `src/components/series/EpisodesList.tsx` → en `handleToggleWatched` y `handleBulkToggleWatched`, después del `response.ok`: `trackFunnel('episode_marked', { source: 'list', status })`.
- `src/components/series/ViewStatusToggle.tsx` → en `handleStatusChange` tras éxito: `trackFunnel('series_status_set', { status: newStatus, source: 'toggle' })`.
- `src/components/watching/CurrentlyWatchingDashboard.tsx` → en `handleMarkNextEpisode` tras éxito: `episode_marked` con `source: 'watching'`; en `handleRemoveFromWatching`: `series_status_set` con `source: 'watching'`.

## Criterios de aceptación

- [ ] Los cuatro nombres existen como union type; usar otro nombre no compila.
- [ ] Marcar un episodio desde la ficha y desde `/watching` dispara `episode_marked` con el `source` correcto (verificar con `console.log` temporal en dev o con el panel de Vercel tras deploy).
- [ ] Ningún evento lleva ids de usuario, emails ni títulos.
- [ ] `npm run type-check`, `npm run lint`, `npm run build` en verde.

## Fuera de alcance

Dashboards de eventos, cambios de UI.
