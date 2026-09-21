# T11b — Onboarding: UI de 3 pasos

**Fase:** 1 · **Esfuerzo:** L · **Depende de:** T11a, T06
**Objetivo:** que nadie llegue a un `/watching` vacío. Tres pantallas, menos de un minuto, saltables.

## Ruta

`src/app/(app)/bienvenida/page.tsx` (server, `robots: noindex`, título `t('onboarding.pageTitle')`) que renderiza `<OnboardingWizard />`.

## Gate

`src/components/common/OnboardingGate/OnboardingGate.tsx` (client, sin UI), montado en el layout de `(app)` (`src/app/(app)/layout.tsx`, verificar el nombre real). Lógica:

- Solo si `status === 'authenticated'`, y la ruta actual **no** está en `['/bienvenida', '/admin', '/legal', '/privacidad', '/api']` (prefijo).
- Pide `getUserSummary()` (helper con caché de T10). Si `onboardingCompletedAt === null` **y** `trackedSeriesCount === 0` → `router.replace('/bienvenida?next=' + encodeURIComponent(pathname))`.
- Una sola vez por sesión de navegador (flag en `sessionStorage` `mundobl.onboardingChecked`), para no molestar si el usuario sale del wizard.
- Si hay una intención pendiente de T07 (`readPendingTrack()`), **no** redirigir: la ficha la va a aplicar y el usuario ya tiene su primera serie. El gate marca `onboardingCompletedAt` llamando `POST /api/user/onboarding { skipped: true }` en ese caso.

## Wizard

`src/components/onboarding/OnboardingWizard/OnboardingWizard.tsx` + `.css`. Ant `Steps` arriba, contenido por paso, botones "Saltar" (siempre visible, discreto) y "Siguiente".

**Paso 1 — "¿Qué estás viendo ahora?"** `AutoComplete` sobre `GET /api/series/search?q=` (debounce 300 ms), resultados con póster chico (`MediaCard` compacta o lista). Al elegir, pasa al paso 2. Opción "No estoy viendo nada ahora" → salta al paso 3.

**Paso 2 — "¿Por qué episodio vas?"** Reusar `WatchProgressStepper` en modo `compact` **sin** provider (variante controlada: props `value`/`onChange`, agregar esa variante al componente de T06 si no la tiene). No pega a la API todavía: guarda `{ seriesId, upToEpisodeId }` en estado local.

**Paso 3 — "¿Cuáles de estas ya viste?"** Grilla de `GET /api/series/popular?limit=30`, cards con póster y check al tocar (multi-select). Contador "3 seleccionadas".

**Fin** → `POST /api/user/onboarding { watching, completed }` → `trackFunnel('onboarding_step', { step: 'done' })` → `router.replace(next ?? '/watching')` → `message.success(t('onboarding.done'))`. "Saltar" → `POST { skipped: true }`, `onboarding_step { step: 'skip' }`, misma redirección. Cada paso mostrado dispara `onboarding_step { step: n }`.

## i18n (bloque nuevo `onboarding`)

`pageTitle`, `step1Title`, `step1Placeholder`, `step1NotWatching`, `step2Title`, `step3Title`, `step3Selected` ("{n} seleccionadas"), `skip`, `next`, `finish`, `done`, `error`.

## Criterios de aceptación

- [ ] Usuario nuevo: login → `/bienvenida` automáticamente; completa en ≤ 3 pantallas y aterriza en `/watching` con la serie y su progreso.
- [ ] "Saltar" en cualquier paso lleva a `/watching` y no vuelve a aparecer nunca.
- [ ] Usuario que ya tenía series no ve el wizard.
- [ ] Usuario que vino por el CTA de una ficha (T07) no ve el wizard.
- [ ] Funciona a 375 px sin scroll horizontal; grilla del paso 3 en 3 columnas.
- [ ] type-check, lint, build; 10 locales.
