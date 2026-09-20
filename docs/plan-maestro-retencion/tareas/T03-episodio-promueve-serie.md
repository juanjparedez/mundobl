# T03 — Marcar un episodio promueve la serie a VIENDO

**Fase:** 1 · **Esfuerzo:** S · **Depende de:** nada · **Hacer primero.**
**Objetivo:** que nadie más marque episodios y vea `/watching` vacío. Hoy 12 pares usuario/serie (9 usuarios) tienen episodios en VISTA sin fila de serie, porque `POST /api/episodes/[id]/view-status` no toca la fila de serie ni `lastWatchedAt`.

## Regla de negocio (exacta)

Al hacer `POST /api/episodes/[id]/view-status` con `status: 'VISTA'`:

1. Se upsertea la fila de episodio (como hoy).
2. Se busca la fila de serie del usuario (`userId + seriesId`, el `seriesId` sale de `episode.season.seriesId`).
3. Si **no existe** o su `status` es `SIN_VER` → se crea/actualiza con `status: 'VIENDO'`, `lastWatchedAt: now`.
4. Si existe con `VIENDO` o `RETOMAR` → `status: 'VIENDO'`, `lastWatchedAt: now`.
5. Si existe con `VISTA` o `ABANDONADA` → **solo** `lastWatchedAt: now`, no se cambia el `status` (el usuario lo decidió a mano).
6. Si tras el upsert **todos** los episodios de la serie están en VISTA (contar episodios de todas las temporadas vs. filas VISTA del usuario) → la respuesta incluye `allWatched: true`. **No** se pasa la serie a VISTA automáticamente; eso lo pregunta la UI (T06).

Con `status: 'SIN_VER'`: solo se upsertea la fila de episodio. No se toca la serie.

## Archivos a tocar

- `src/app/api/episodes/[id]/view-status/route.ts` (POST). Hacer las escrituras dentro de `prisma.$transaction([...])` o secuenciales con `upsert`; incluir `season: { select: { seriesId: true } }` en el `findUnique` del episodio.
- Extraer la regla a `src/lib/tracking.ts` → `export async function markEpisode(client, userId, episodeId, status): Promise<{ episode: ViewStatus; series: ViewStatus | null; allWatched: boolean }>` para que T05 la reutilice. `client` es `PrismaClient | Prisma.TransactionClient`.
- Respuesta del endpoint: `{ ...episodeViewStatus, series: { status, lastWatchedAt } | null, allWatched }`. Mantener los campos actuales en el nivel raíz para no romper `EpisodesList` ni `CurrentlyWatchingDashboard`.

## Script de corrección (dry-run por defecto)

`scripts/backfill-series-viendo.ts`: para cada par `(userId, seriesId)` con ≥ 1 episodio VISTA y sin fila de serie (o con `SIN_VER`), crea/actualiza la fila con `VIENDO` y `lastWatchedAt = max(watchedDate)` de sus episodios. Si todos los episodios están vistos, en vez de VIENDO pone `VISTA` con `watchedDate = max(watchedDate)`. Imprime la tabla de cambios; solo escribe con `--apply`. Seguir el patrón de `scripts/merge-duplicate-tags.ts`.

## Criterios de aceptación

- [ ] Marcar un episodio de una serie sin fila → aparece en `/watching` al recargar.
- [ ] Marcar un episodio de una serie en ABANDONADA no la cambia de estado pero sí actualiza `lastWatchedAt`.
- [ ] Desmarcar un episodio no toca la serie.
- [ ] La respuesta trae `allWatched` correcto (probar con una serie de 2 episodios).
- [ ] El script en dry-run lista 12 pares en producción; con `--apply` los corrige y al volver a correr lista 0.
- [ ] type-check, lint, build en verde.
