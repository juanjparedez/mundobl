import { prisma } from './database';
import {
  loadSeriesForSave,
  recordSeriesRevision,
  SeriesEditConflictError,
} from './series-save';
import { parseContentClassification } from './content-rating';

export async function saveEditorialClassification(
  seriesId: number,
  userId: string,
  raw: unknown
) {
  const input = parseContentClassification(raw);
  if (!input) throw new Error('INVALID_CLASSIFICATION');
  return prisma.$transaction(async (tx) => {
    const editor = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true, banned: true },
    });
    if (editor?.role !== 'ADMIN' || editor.banned) throw new Error('FORBIDDEN');
    const current = await loadSeriesForSave(tx, seriesId);
    if (!current) throw new Error('NOT_FOUND');
    // Reject even when the supplied version happens to match a concurrent save
    // that committed after our snapshot was read.
    if (current.editVersion !== input.editVersion)
      throw new SeriesEditConflictError();
    const updated = await tx.series.updateMany({
      where: { id: seriesId, editVersion: input.editVersion },
      data: {
        contentRating: input.rating,
        contentWarnings: input.warnings,
        contentRatingSource: input.source || null,
        contentReviewedAt: new Date(),
        contentReviewedBy: userId,
        editVersion: { increment: 1 },
      },
    });
    if (updated.count !== 1) throw new SeriesEditConflictError();
    await recordSeriesRevision(tx, current, userId, 'admin-form');
    return {
      id: current.id,
      title: current.title,
      editVersion: input.editVersion + 1,
    };
  });
}
