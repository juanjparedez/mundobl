/**
 * Tracking core: pure functions over plain data. No database, no DOM, no
 * imports from outside this folder (enforced by eslint.config.mjs), so it
 * runs the same on the server, in the browser and in a Worker. Storage stays
 * with the caller: MundoBL applies the results with Prisma (tracking.ts) or
 * localStorage (local-progress.ts).
 */

export {
  TRACKING_STATUSES,
  isTrackingStatus,
  statusAfterWatch,
  datesForStatus,
  type TrackingStatus,
  type StatusDates,
} from './status';
export {
  parseEpisodeTitle,
  inferSeriesTitle,
  type ParsedEpisodeTitle,
} from './titles';
export {
  groupIntoChapters,
  toTrackedChapters,
  countWatchedChapters,
  countChapters,
  type EpisodeRow,
  type Chapter,
  type TrackedChapter,
} from './chapters';
export {
  findFurthestWatchedIndex,
  findNextEpisode,
  crossedMilestone,
  PROGRESS_MILESTONES,
} from './position';
export {
  findProgressTarget,
  planProgress,
  type OrderedEpisode,
  type ProgressTarget,
  type ProgressPlan,
  type ProgressPlanOptions,
} from './progress-plan';
export {
  pairLinkedChapters,
  linkedEpisodesToSync,
  type LinkedChapterPair,
} from './linked';
