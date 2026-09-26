import type { Prisma } from '../generated/prisma';

type TargetField = 'seriesId' | 'seasonId' | 'episodeId';
type Section = 'viewStatuses' | 'seriesNotes' | 'episodeNotes';

export interface TrackingBackupReferences {
  seriesId: ReadonlySet<number>;
  seasonId: ReadonlySet<number>;
  episodeId: ReadonlySet<number>;
}

export interface TrackingBackupExisting {
  viewStatuses: ReadonlySet<string>;
  seriesNotes: ReadonlySet<string>;
  episodeNotes: ReadonlySet<string>;
}

export interface TrackingBackupPlan {
  viewStatuses: Prisma.ViewStatusCreateManyInput[];
  seriesNotes: Prisma.SeriesNoteCreateManyInput[];
  episodeNotes: Prisma.EpisodeNoteCreateManyInput[];
  skipped: Record<Section, number>;
  missingRefs: { section: Section; reason: string; ref: unknown }[];
  errors: string[];
}

const TARGETS: readonly TargetField[] = ['seriesId', 'seasonId', 'episodeId'];
const STATUSES = [
  'SIN_VER',
  'VIENDO',
  'VISTA',
  'ABANDONADA',
  'RETOMAR',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Accept exported UTC timestamps and explicit calendar dates, never Date's rollover. */
export function dateValue(value: unknown): Date | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return undefined;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  const iso = date.toISOString();
  return value === iso ||
    (/^\d{4}-\d{2}-\d{2}$/.test(value) && iso.slice(0, 10) === value)
    ? date
    : undefined;
}

export function trackingBackupKey(
  target: Partial<Record<TargetField, number | null>>
): string {
  return TARGETS.filter((field) => target[field] != null)
    .map((field) => `${field}:${target[field]}`)
    .join('|');
}

/** A restore only inserts missing personal records. Payload ownership is never trusted. */
export function planTrackingBackup(
  payload: Record<string, unknown>,
  userId: string,
  references: TrackingBackupReferences,
  existing: TrackingBackupExisting
): TrackingBackupPlan {
  const plan: TrackingBackupPlan = {
    viewStatuses: [],
    seriesNotes: [],
    episodeNotes: [],
    skipped: { viewStatuses: 0, seriesNotes: 0, episodeNotes: 0 },
    missingRefs: [],
    errors: [],
  };

  for (const section of [
    'viewStatuses',
    'seriesNotes',
    'episodeNotes',
  ] as const) {
    const values = payload[section];
    if (values === undefined) continue; // Existing version-1 backups have no notes.
    if (!Array.isArray(values)) {
      plan.errors.push(`${section}: invalid section`);
      continue;
    }
    const seen = new Set(existing[section]);
    values.forEach((value: unknown, index: number) => {
      const invalid = () => {
        plan.skipped[section]++;
        plan.errors.push(`${section}[${index}]: invalid item`);
      };
      if (!isRecord(value)) return invalid();
      const fields = TARGETS.filter((field) => value[field] != null);
      if (fields.length !== 1) return invalid();
      const field = fields[0];
      if (
        (section === 'seriesNotes' && field !== 'seriesId') ||
        (section === 'episodeNotes' && field !== 'episodeId')
      )
        return invalid();
      const id = value[field];
      if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0)
        return invalid();
      const target = { [field]: id };
      if (!references[field].has(id)) {
        plan.skipped[section]++;
        plan.missingRefs.push({
          section,
          reason: `${field}-not-found`,
          ref: target,
        });
        return;
      }
      const key = trackingBackupKey(target);
      if (seen.has(key)) {
        plan.skipped[section]++;
        return;
      }

      if (section === 'viewStatuses') {
        const status = STATUSES.find((candidate) => candidate === value.status);
        const watchedDate = dateValue(value.watchedDate);
        const lastWatchedAt = dateValue(value.lastWatchedAt);
        if (!status || watchedDate === undefined || lastWatchedAt === undefined)
          return invalid();
        plan.viewStatuses.push({
          userId,
          ...target,
          status,
          watchedDate,
          lastWatchedAt,
        });
      } else {
        const body = value.body;
        const createdAt = dateValue(value.createdAt);
        const updatedAt = dateValue(value.updatedAt);
        if (
          typeof body !== 'string' ||
          !body.trim() ||
          body.length > 5000 ||
          createdAt === undefined ||
          updatedAt === undefined ||
          (createdAt && updatedAt && updatedAt < createdAt)
        )
          return invalid();
        // Preserve diary dates from the backup; omitted dates use database defaults.
        const note = {
          userId,
          body,
          ...(createdAt ? { createdAt } : {}),
          ...(updatedAt ? { updatedAt } : {}),
        };
        if (section === 'seriesNotes')
          plan.seriesNotes.push({ ...note, seriesId: id });
        else plan.episodeNotes.push({ ...note, episodeId: id });
      }
      seen.add(key);
    });
  }
  return plan;
}
