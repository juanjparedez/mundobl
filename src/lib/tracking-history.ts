import type {
  Prisma,
  TrackingEventKind,
  WatchStatus,
} from '../generated/prisma';
import { dateValue, type TrackingBackupReferences } from './tracking-backup';

export interface TrackingHistoryItem {
  id: string;
  kind: TrackingEventKind;
  status: WatchStatus;
  previousStatus: WatchStatus | null;
  watchedDate: string | null;
  previousWatchedDate: string | null;
  recordedAt: string;
  seriesTitle: string;
  imageUrl?: string | null;
  href: string;
  seasonNumber: number | null;
  episodeNumber: number | null;
  chapterTarget?: {
    episodeId: number;
    chapterNumber: number;
    part: number;
    parts: number;
  } | null;
}

export interface TrackingHistoryPage {
  items: TrackingHistoryItem[];
  nextCursor: { id: string; recordedAt: string } | null;
}

const statuses: readonly string[] = [
  'SIN_VER',
  'VIENDO',
  'VISTA',
  'RETOMAR',
  'ABANDONADA',
];
const kinds: readonly string[] = [
  'RECORDED',
  'STATUS_CHANGED',
  'DATE_CHANGED',
  'SNAPSHOT',
];

/** History belongs to the authenticated account; ids deduplicate only inside that account. */
export function planTrackingHistoryImport(
  value: unknown,
  userId: string,
  references: TrackingBackupReferences,
  existing: ReadonlySet<string>
) {
  const rows: Prisma.TrackingEventCreateManyInput[] = [];
  const errors: string[] = [];
  const missingRefs: { section: string; reason: string; ref: unknown }[] = [];
  let skipped = 0;
  if (value === undefined)
    return { rows, errors, missingRefs, skipped, supplied: false };
  if (!Array.isArray(value))
    return {
      rows,
      errors: ['trackingEvents: invalid section'],
      missingRefs,
      skipped,
      supplied: false,
    };
  const seen = new Set(existing);
  value.forEach((item: unknown, index) => {
    const invalid = () => {
      skipped++;
      errors.push(`trackingEvents[${index}]: invalid item`);
    };
    if (!item || typeof item !== 'object' || Array.isArray(item))
      return invalid();
    const row = item as Record<string, unknown>;
    const targets = (['seriesId', 'seasonId', 'episodeId'] as const).filter(
      (key) => row[key] != null
    );
    const recordedAt = dateValue(row.recordedAt);
    const watchedDate = dateValue(row.watchedDate);
    const previousWatchedDate = dateValue(row.previousWatchedDate);
    if (
      typeof row.id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        row.id
      ) ||
      targets.length !== 1 ||
      !recordedAt ||
      watchedDate === undefined ||
      previousWatchedDate === undefined ||
      typeof row.kind !== 'string' ||
      !kinds.includes(row.kind) ||
      typeof row.status !== 'string' ||
      !statuses.includes(row.status) ||
      (row.previousStatus != null &&
        (typeof row.previousStatus !== 'string' ||
          !statuses.includes(row.previousStatus)))
    )
      return invalid();
    const target = targets[0];
    const targetId = row[target];
    if (
      typeof targetId !== 'number' ||
      !Number.isSafeInteger(targetId) ||
      targetId <= 0
    )
      return invalid();
    if (!references[target].has(targetId)) {
      skipped++;
      missingRefs.push({
        section: 'trackingEvents',
        reason: 'missing reference',
        ref: targetId,
      });
      return;
    }
    if (seen.has(row.id)) {
      skipped++;
      return;
    }
    seen.add(row.id);
    rows.push({
      id: row.id,
      userId,
      [target]: targetId,
      recordedAt,
      watchedDate,
      previousWatchedDate,
      kind: row.kind as TrackingEventKind,
      status: row.status as WatchStatus,
      previousStatus: (row.previousStatus ?? null) as WatchStatus | null,
    });
  });
  return { rows, errors, missingRefs, skipped, supplied: true };
}
