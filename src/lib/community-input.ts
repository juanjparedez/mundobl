import { COMMUNITY_KINDS, type CommunityTopicInput } from '@/types/community';

export class CommunityError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}
export function communityId(value: unknown): number {
  const id =
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  if (
    typeof id !== 'number' ||
    !Number.isSafeInteger(id) ||
    id < 1 ||
    id > 2147483647
  )
    throw new CommunityError(400, 'invalid');
  return id;
}
export function communityText(
  value: unknown,
  min: number,
  max: number
): string {
  if (
    typeof value !== 'string' ||
    value.trim().length < min ||
    value.trim().length > max
  )
    throw new CommunityError(400, 'invalid');
  return value.trim();
}
export function communityObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new CommunityError(400, 'invalid');
  return value as Record<string, unknown>;
}
export function parseCommunityTopic(value: unknown): CommunityTopicInput {
  const data = communityObject(value);
  const kind = COMMUNITY_KINDS.find((k) => k === data.kind);
  if (!kind) throw new CommunityError(400, 'invalid');
  const seriesId = data.seriesId == null ? null : communityId(data.seriesId);
  const episodeId = data.episodeId == null ? null : communityId(data.episodeId);
  if (
    (kind !== 'RECOMMENDATION' && !seriesId) ||
    (episodeId && (!seriesId || kind !== 'DISCUSSION'))
  )
    throw new CommunityError(400, 'invalid');
  return {
    kind,
    title: communityText(data.title, 5, 140),
    body: communityText(data.body, 10, 5000),
    hasSpoilers: data.hasSpoilers === true || episodeId !== null,
    seriesId,
    episodeId,
  };
}
/** Plain-text preview only; never render user Markdown as HTML in discovery. */
export function communityExcerpt(body: string): string {
  return body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/[#*_`>~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);
}
