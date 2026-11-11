// ============================================
// Reacciones con emoji por serie (SeriesReactionCount)
// ============================================
//
// La base guarda solo el total por serie y emoji. Que reacciono cada uno
// vive en su navegador (ver SeriesReactions), igual que el "Me gusta" viejo:
// funciona sin cuenta y no deja historial por persona en el servidor.
//
// El orden de esta lista es el orden en pantalla. Las claves estan tambien
// en el CHECK de la migracion 20261111030000_series_reactions: agregar una
// reaccion necesita migracion.
export const SERIES_REACTIONS = [
  { key: 'laugh', emoji: '😂' },
  { key: 'love', emoji: '❤️' },
  { key: 'fire', emoji: '🔥' },
  { key: 'cry', emoji: '😭' },
  { key: 'mindblown', emoji: '🤯' },
  { key: 'clap', emoji: '👏' },
  { key: 'wow', emoji: '😮' },
  { key: 'hot', emoji: '🥵' },
  { key: 'smirk', emoji: '😏' },
  { key: 'kiss', emoji: '💋' },
] as const;

export type SeriesReactionKey = (typeof SERIES_REACTIONS)[number]['key'];
export type SeriesReactionCounts = Partial<Record<SeriesReactionKey, number>>;

export function isSeriesReactionKey(
  value: unknown
): value is SeriesReactionKey {
  return SERIES_REACTIONS.some((reaction) => reaction.key === value);
}

/** Filas de la base -> { clave: total }, ignorando claves viejas o en 0. */
export function toReactionCounts(
  rows: ReadonlyArray<{ reaction: string; count: number }>
): SeriesReactionCounts {
  const counts: SeriesReactionCounts = {};
  for (const row of rows) {
    if (isSeriesReactionKey(row.reaction) && row.count > 0)
      counts[row.reaction] = row.count;
  }
  return counts;
}
