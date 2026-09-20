# T10 — Home logueado → /watching

**Fase:** 1 · **Esfuerzo:** S · **Depende de:** nada
**Objetivo:** para quien ya sigue series, la primera pantalla es su lista. La landing es para anónimos.

## Restricción

`src/app/page.tsx` es ISR y no puede llamar `auth()`. La decisión se toma en cliente.

## Endpoint liviano

`GET /api/user/me/summary` (nuevo, `src/app/api/user/me/summary/route.ts`, `requireAuth`). Responde:

```ts
{ viendoCount: number; trackedSeriesCount: number; onboardingCompletedAt: string | null }
```

`viendoCount` = filas de serie con `VIENDO`; `trackedSeriesCount` = filas de serie con cualquier status distinto de `SIN_VER` **más** series con algún episodio VISTA (unión, `distinct seriesId`). `onboardingCompletedAt` viene de T11a; hasta que exista, devolver `null`.

Este endpoint lo reutilizan T11b y T18. Cachearlo en cliente por sesión (ver abajo).

## Cliente

`src/components/common/LoggedInHomeRedirect/LoggedInHomeRedirect.tsx` (client, sin UI). Montarlo al inicio de `LandingPage.tsx`.

- Si `useSession().status === 'authenticated'`: pedir `/api/user/me/summary` (helper `src/lib/user-summary-client.ts` con caché en `sessionStorage` key `mundobl.userSummary`, TTL 5 min, `try/catch`).
- Si `viendoCount > 0` → `router.replace('/watching')`.
- Si `viendoCount === 0` → no hacer nada (la landing con el botón "Ir a mis series" de T09 alcanza; T11b agrega el onboarding).
- Si el usuario llegó con `?stay=1` en la URL, no redirigir (para poder ver la landing estando logueado).

## Criterios de aceptación

- [ ] Usuario con una serie en VIENDO entra a `/` y en menos de 1 s está en `/watching` (sin parpadeo de layout roto: la landing puede mostrarse un instante).
- [ ] Usuario sin series ve la landing normal.
- [ ] `/?stay=1` no redirige.
- [ ] Anónimo: cero requests a `/api/user/me/summary`.
- [ ] La home sigue siendo ISR (verificar que `page.tsx` no cambió de modo: `npm run build` la lista como estática/ISR, no `ƒ`).
