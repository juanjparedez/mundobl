# T05 — Endpoint "hasta el episodio N"

**Fase:** 1 · **Esfuerzo:** M · **Depende de:** T03
**Objetivo:** una sola llamada para decir "voy por el episodio N": marca todo lo anterior como visto, deja la serie en VIENDO y devuelve el estado completo. Lo usan T06, T07, T11b y T13.

## Contrato

`POST /api/series/[id]/progress`

Body (una de las dos formas):

```ts
{ upToEpisodeId: number }                       // forma preferida
{ seasonNumber: number; episodeNumber: number } // alternativa para onboarding/invitado
```

Respuesta `200`:

```ts
{
  seriesStatus: 'VIENDO' | 'VISTA' | 'ABANDONADA' | 'RETOMAR' | 'SIN_VER';
  episodeStatus: Record<number, 'VISTA' | 'SIN_VER'>; // todos los episodios de la serie
  watched: number;
  total: number;
  allWatched: boolean;
}
```

Errores: `400` body inválido, `404` serie o episodio inexistente / episodio de otra serie, `401` sin sesión.

## Regla

1. Cargar todos los episodios de la serie con `(seasonNumber, episodeNumber, id)` ordenados.
2. Objetivo = episodio indicado. "Anteriores o igual" = orden por `(seasonNumber, episodeNumber)`.
3. Para esos episodios: `createMany({ data: [...], skipDuplicates: true })` con `status: 'VISTA', watchedDate: now` y luego `updateMany({ where: { userId, episodeId: { in } , status: 'SIN_VER' }, data: { status: 'VISTA', watchedDate: now } })`. **No** desmarcar los posteriores (si el usuario ya había marcado el 8 y ahora dice "voy por el 5", se respeta lo marcado; el stepper de T06 ofrece "desmarcar desde acá" aparte con `direction: 'unmark'`).
4. Opcional: body `{ upToEpisodeId, direction: 'unmark' }` → pone en `SIN_VER` los episodios **posteriores** al objetivo (`updateMany`), nada más.
5. Fila de serie: aplicar la misma regla de T03 (`markEpisode` en `src/lib/tracking.ts`); si `allWatched`, poner la serie en `VISTA` con `watchedDate: now` **solo si el body trae `completeIfAll: true`** (la UI pregunta primero).
6. Todo en `prisma.$transaction`.

## Archivos

- Nuevo: `src/app/api/series/[id]/progress/route.ts`.
- `src/lib/tracking.ts`: agregar `setProgress(client, userId, seriesId, target, options)` que implementa la regla y devuelve la respuesta. El endpoint solo valida y llama.
- `src/lib/database.ts`: helper `getSeriesEpisodesOrdered(seriesId)` si no existe uno equivalente (buscar primero con `grep -n "episodes" src/lib/database.ts`).

## Criterios de aceptación

- [ ] Serie de 8 episodios, usuario limpio, `upToEpisodeId = ep3` → 3 filas VISTA, serie VIENDO, `watched: 3, total: 8`.
- [ ] Repetir la misma llamada no crea duplicados ni falla (P2002 imposible).
- [ ] `upToEpisodeId` de otra serie → 404.
- [ ] `direction: 'unmark'` sobre ep3 deja 4..8 en SIN_VER y no toca 1..3.
- [ ] `completeIfAll: true` con el último episodio → serie VISTA.
- [ ] Probar con `curl` (cookie de sesión de dev) o con un script `scripts/test-progress.ts` siguiendo el patrón de `scripts/test-flor-feedback.ts`.
