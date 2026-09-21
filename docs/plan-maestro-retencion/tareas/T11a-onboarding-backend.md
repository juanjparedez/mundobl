# T11a — Onboarding: backend

**Fase:** 1 · **Esfuerzo:** M · **Depende de:** T05
**Objetivo:** dar al onboarding de T11b todo lo que necesita del servidor: saber si hay que mostrarlo, listar series populares para elegir rápido, y marcar varias series de una vez.

## Migración

`npx prisma migrate dev --name add_user_onboarding_completed_at`

```prisma
model User {
  // …
  onboardingCompletedAt DateTime?
}
```

Tabla existente: no hace falta RLS extra.

## Endpoints

1. `GET /api/user/me/summary` (T10) → devolver `onboardingCompletedAt` real.

2. `GET /api/series/popular?limit=30` (nuevo, público, cacheable con `revalidate = 3600` vía `unstable_cache` o `export const revalidate`). Series `origin = 'CURATED'`, `catalogScope = 'PERSONAL'`, `visibility = 'VISIBLE'`, ordenadas por cantidad de filas de serie en `ViewStatus` con status `VIENDO` o `VISTA` (usar `groupBy` sobre `ViewStatus` + `findMany` con `id in`). Responder `Array<{ id, title, year, imageThumbUrl, episodeCount }>` donde `episodeCount` es el total de episodios de todas las temporadas. Excluir series sin episodios (hay 99 así).

3. `POST /api/user/onboarding` (nuevo, `requireAuth`). Body:

```ts
{
  watching?: { seriesId: number; upToEpisodeId: number | null };  // paso 1+2
  completed?: number[];                                          // paso 3: seriesIds ya vistas
  skipped?: boolean;                                             // "saltar"
}
```

Lógica: `watching` → `setProgress()` de `src/lib/tracking.ts` (o `view-status VIENDO` si `upToEpisodeId` es null); `completed` → para cada serie, `viewStatus.upsert` con `status: 'VISTA', watchedDate: now` (máximo 50 ids; ignorar ids inexistentes). Al final, siempre `user.update({ onboardingCompletedAt: now })`. Responder `{ ok: true, viendoCount, completedCount }`.

Todo idempotente: repetir el POST no duplica ni falla.

## Búsqueda

Para el paso 1 usar el endpoint existente `GET /api/series/search?q=` (ver `src/app/api/series/search/route.ts`). Si no devuelve `episodeCount` ni `seasons[].episodes[]`, agregarlo al `select` (solo `id`, `seasonNumber`, `episodeNumber`) sin romper a los consumidores actuales de ese endpoint (`grep -rn "series/search" src`).

## Criterios de aceptación

- [ ] `GET /api/series/popular` devuelve 30 series con episodios, en menos de 500 ms en caliente.
- [ ] `POST /api/user/onboarding` con `watching` + 3 `completed` deja 1 serie VIENDO con episodios marcados, 3 VISTA y `onboardingCompletedAt` seteado.
- [ ] `{ skipped: true }` solo setea `onboardingCompletedAt`.
- [ ] Repetir cualquier POST no falla.
- [ ] `npm run db:check` sin diferencias tras migrar.
