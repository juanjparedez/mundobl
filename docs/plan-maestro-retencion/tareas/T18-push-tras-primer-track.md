# T18 — Pedir push/PWA después del primer episodio marcado

**Fase:** 2 · **Esfuerzo:** S · **Depende de:** T01
**Objetivo:** hay 1 suscripción push en toda la base porque nunca se pide en un momento de valor. Pedirla justo después de que el usuario marcó algo por primera vez, una sola vez, sin modal.

## Contexto

- Cliente: `enablePush()`, `isPushSubscribed()`, `getPushPermission()` en `src/lib/web-push-prefs.ts`. Existen `public/sw.js` y `src/app/manifest.ts` (genera `/manifest.webmanifest`).
- Servidor: `GET /api/push/subscribe` (ya existe) dice si el usuario tiene suscripción.

## Componente

`src/components/common/PostTrackPrompt/PostTrackPrompt.tsx` + `.css`, montado en el layout de `(app)`. Escucha un evento de ventana `mundobl:episode-marked` (dispararlo con `window.dispatchEvent(new CustomEvent(...))` desde el mismo lugar donde T01 llama `trackFunnel('episode_marked', …)`; crear el helper `emitEpisodeMarked()` en `src/lib/analytics.ts` para no duplicarlo).

Al recibir el evento, mostrar el prompt solo si **todas**:

1. Hay sesión.
2. `getPushPermission() === 'default'` (ni concedido ni denegado).
3. `localStorage['mundobl.pushPromptShown']` no existe.
4. `GET /api/user/me/summary` (T10) dice `trackedSeriesCount >= 1`.

UI: una tarjeta fija abajo (no modal), `PanelCard` chica: `t('pushPrompt.title')` "¿Te avisamos cuando salga el siguiente?" · `t('pushPrompt.body')` "Solo episodios de tus series. Nada más." · botones `t('pushPrompt.yes')` y `t('pushPrompt.later')`. "Sí" → `enablePush()` y `message.success`; cualquiera de los dos setea `mundobl.pushPromptShown`.

En iOS Safari sin PWA instalada `enablePush()` no funciona: si `getPushPermission() === 'unsupported'`, cambiar el texto por `t('pushPrompt.installHint')` "En iPhone, agregá MundoBL a la pantalla de inicio para recibir avisos" con link a `/acerca#instalar` (crear el ancla si no existe; texto corto).

## Criterios de aceptación

- [ ] Usuario nuevo: marca su primer episodio → aparece la tarjeta; acepta → `PushSubscription` creada.
- [ ] Recargar y marcar otro episodio: no vuelve a aparecer.
- [ ] Usuario con permiso denegado: nunca aparece.
- [ ] Anónimo: nunca aparece.
- [ ] type-check, lint, build; 10 locales.
