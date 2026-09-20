# T15 — Cálculo del digest (lib pura)

**Fase:** 2 · **Esfuerzo:** M · **Depende de:** T03
**Objetivo:** una función determinista que, dado un usuario y una fecha, dice qué contarle esta semana. Separada del envío para poder probarla sin mandar nada.

## Archivo

`src/lib/digest.ts`

```ts
export interface DigestSeries { id: number; title: string; slugUrl: string; imageThumbUrl: string | null; watched: number; total: number }
export interface WeeklyDigest {
  airingThisWeek: Array<DigestSeries & { airDays: string[] }>; // VIENDO con airDays y episodios pendientes
  almostDone: DigestSeries[];        // VIENDO con total - watched ∈ [1, 2] y total ≥ 4
  paused: DigestSeries[];            // VIENDO, lastWatchedAt < now - 21 días, con episodios pendientes
  newSinceLastVisit: DigestSeries[]; // VIENDO cuya serie tuvo episodios creados (Episode.createdAt) después de lastWatchedAt
  totalWatching: number;
}
export async function buildWeeklyDigest(userId: string, now: Date): Promise<WeeklyDigest | null>
```

Devuelve `null` cuando `totalWatching === 0` **o** cuando las cuatro listas están vacías. Una serie aparece en **una sola** lista, con esta prioridad: `newSinceLastVisit` > `airingThisWeek` > `almostDone` > `paused`. Máximo 5 por lista. `slugUrl` con `getSeriesUrl()` de `src/lib/slug.ts`.

Separar en dos capas para que sea testeable sin base:

- `computeDigest(input: DigestInput, now: Date): WeeklyDigest | null` — pura, recibe las filas ya cargadas.
- `buildWeeklyDigest(userId, now)` — carga con Prisma (`viewStatus.findMany` VIENDO con `series.seasons.episodes` y las filas VISTA del usuario, como hace `/api/currently-watching`) y llama a `computeDigest`.

`airDays` se parsea con el mismo `DAY_MAP` que `CurrentlyWatchingDashboard.tsx`: **mover** `DAY_MAP` y `getAirDayStatus` a `src/lib/air-days.ts` y hacer que el dashboard los importe de ahí (sin cambiar comportamiento).

## Script de prueba

`scripts/test-digest.ts` (patrón de `scripts/test-flor-feedback.ts`): construye 4 casos de `DigestInput` a mano (usuario sin series → `null`; serie a 1 episodio de terminar → `almostDone`; serie sin actividad hace 30 días → `paused`; serie con episodio nuevo → `newSinceLastVisit` y no en las otras) y falla con `process.exit(1)` si algo no coincide. Además, con `--user <id>` corre `buildWeeklyDigest` real y lo imprime.

## Criterios de aceptación

- [ ] `npx tsx scripts/test-digest.ts` pasa los 4 casos.
- [ ] `--user` sobre un usuario con series VIENDO imprime un digest coherente en menos de 1 s.
- [ ] El dashboard de `/watching` sigue mostrando "hoy toca capítulo" igual que antes tras mover `DAY_MAP`.
- [ ] type-check, lint, build.
