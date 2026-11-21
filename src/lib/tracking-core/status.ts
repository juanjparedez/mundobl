/**
 * Series-level tracking status and the one rule that moves it on its own.
 *
 * A person picks `planned`, `completed`, `paused` or `dropped` by hand.
 * `watching` and `none` come from progress: marking a chapter moves the
 * series to `watching`, except when the person already closed it by hand
 * (`completed` or `dropped`): that choice is never overwritten.
 */

export const TRACKING_STATUSES = [
  'none',
  'planned',
  'watching',
  'completed',
  'paused',
  'dropped',
] as const;

export type TrackingStatus = (typeof TRACKING_STATUSES)[number];

export function isTrackingStatus(value: unknown): value is TrackingStatus {
  return TRACKING_STATUSES.some((status) => status === value);
}

/** Statuses closed by hand, which progress never overwrites. */
const CLOSED_BY_HAND: ReadonlySet<TrackingStatus> = new Set([
  'completed',
  'dropped',
]);

/** The series status after a chapter is newly marked as watched. */
export function statusAfterWatch(
  current: TrackingStatus | null | undefined
): TrackingStatus {
  if (current && CLOSED_BY_HAND.has(current)) return current;
  return 'watching';
}

export interface StatusDates {
  /** `null` clears it; absent leaves it as it was. */
  completedAt?: Date | null;
  lastWatchedAt?: Date;
}

/** Dates that change when a series is set to `status` by hand at `now`. */
export function datesForStatus(status: TrackingStatus, now: Date): StatusDates {
  if (status === 'completed') return { completedAt: now };
  if (status === 'none') return { completedAt: null };
  if (status === 'watching') return { lastWatchedAt: now };
  return {};
}
