/**
 * "I'm on episode N": which episodes to mark or unmark, as a plan over plain
 * data. The caller applies it to its own storage.
 */

export interface OrderedEpisode<Id> {
  id: Id;
  seasonNumber: number;
  episodeNumber: number;
}

export type ProgressTarget<Id> =
  | { episodeId: Id }
  | { seasonNumber: number; episodeNumber: number };

export interface ProgressPlanOptions {
  /** Unmark the episodes after the target instead of marking up to it. */
  direction?: 'unmark';
  /** With 'unmark': unmark the target too (back to "none watched"). */
  inclusive?: boolean;
}

export type ProgressPlan<Id> =
  | { kind: 'mark'; episodeIds: Id[] }
  | { kind: 'unmark'; episodeIds: Id[] };

/** Index of the target in `ordered`, or -1 when it is not there. */
export function findProgressTarget<Id>(
  ordered: readonly OrderedEpisode<Id>[],
  target: ProgressTarget<Id>
): number {
  return 'episodeId' in target
    ? ordered.findIndex((episode) => episode.id === target.episodeId)
    : ordered.findIndex(
        (episode) =>
          episode.seasonNumber === target.seasonNumber &&
          episode.episodeNumber === target.episodeNumber
      );
}

/**
 * `ordered` must be in watching order (season, then episode). Returns null
 * when the target is not one of its episodes.
 */
export function planProgress<Id>(
  ordered: readonly OrderedEpisode<Id>[],
  target: ProgressTarget<Id>,
  options: ProgressPlanOptions = {}
): ProgressPlan<Id> | null {
  const index = findProgressTarget(ordered, target);
  if (index === -1) return null;
  if (options.direction === 'unmark') {
    return {
      kind: 'unmark',
      episodeIds: ordered
        .slice(options.inclusive ? index : index + 1)
        .map((episode) => episode.id),
    };
  }
  return {
    kind: 'mark',
    episodeIds: ordered.slice(0, index + 1).map((episode) => episode.id),
  };
}
