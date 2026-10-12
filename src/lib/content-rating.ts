/** Editorial classification. Importers must never write these fields. */
export const CONTENT_RATINGS = ['UNREVIEWED', 'GENERAL', 'ADULT18'] as const;
export type ContentRating = (typeof CONTENT_RATINGS)[number];
export const CONTENT_WARNINGS = [
  'SEX',
  'NUDITY',
  'VIOLENCE',
  'ABUSE',
  'SELF_HARM',
] as const;
export type ContentWarning = (typeof CONTENT_WARNINGS)[number];

export function parseContentClassification(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  if (
    !CONTENT_RATINGS.includes(data.rating as ContentRating) ||
    !Array.isArray(data.warnings) ||
    data.warnings.length > CONTENT_WARNINGS.length ||
    !data.warnings.every((w) =>
      CONTENT_WARNINGS.includes(w as ContentWarning)
    ) ||
    typeof data.source !== 'string' ||
    data.source.trim().length > 500 ||
    !Number.isSafeInteger(data.editVersion) ||
    Number(data.editVersion) < 0
  )
    return null;
  return {
    rating: data.rating as ContentRating,
    warnings: [...new Set(data.warnings)] as ContentWarning[],
    source: data.source.trim(),
    editVersion: Number(data.editVersion),
  };
}
