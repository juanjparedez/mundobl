# T20 — Reacciones por episodio

**Fase:** 3 · **Esfuerzo:** M · **Depende de:** T06 · **No arrancar antes de que T02 muestre W1 > 25 % dos semanas seguidas.**
**Objetivo:** primera pieza de comunidad con cero fricción: un toque, anónimo en el agregado, imposible de "farmear" con sentido. Da un dato que nadie más tiene ("el episodio 7 destrozó a 34 personas").

## Modelo (tabla nueva ⇒ RLS en la migración)

```prisma
model EpisodeReaction {
  id        Int      @id @default(autoincrement())
  emoji     String   // uno de: '😭' '🔥' '❤️' '😳' '😂'
  createdAt DateTime @default(now())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  episodeId Int
  episode   Episode  @relation(fields: [episodeId], references: [id], onDelete: Cascade)
  @@unique([userId, episodeId, emoji])
  @@index([episodeId])
}
```

Agregar las relaciones inversas en `User` y `Episode`. Migración `add_episode_reaction` con `ALTER TABLE "EpisodeReaction" ENABLE ROW LEVEL SECURITY;`.

## API

- `GET /api/episodes/[id]/reactions` (público, cache corto): `{ counts: Record<emoji, number>, mine: string[] }` (`mine` vacío sin sesión).
- `POST /api/episodes/[id]/reactions { emoji }` (toggle, `requireAuth`, validar emoji contra la lista fija; solo si el usuario tiene ese episodio en VISTA — evita reaccionar sin haber visto). Rate limit con el patrón de `src/lib/rate-limit.ts` (30/hora).
- Bulk para la lista: `GET /api/series/[id]/reactions` → `{ [episodeId]: counts }` para no hacer N requests desde `EpisodesList`.

## UI

En cada fila de `EpisodesList` (usuario común, T12): fila de 5 emojis con contador, resaltado el propio. Sin sesión: solo contadores. Episodio no visto: emojis deshabilitados con tooltip `t('reactions.watchFirst')`.

En la ficha, arriba de la lista: `t('reactions.topEpisode')` "Episodio más {emoji}: E{n}" si hay ≥ 3 reacciones.

## i18n

Bloque `reactions`: `watchFirst`, `topEpisode`, `ariaReact`.

## Criterios de aceptación

- [ ] Toggle idempotente; contadores actualizan optimistamente.
- [ ] No se puede reaccionar sin sesión ni sin haber visto el episodio.
- [ ] La lista de 12 episodios hace **una** request de reacciones.
- [ ] RLS activo en la tabla nueva (`scripts/enable-rls.ts` no la lista como pendiente).
