import {
  communityId,
  communityObject,
  communityText,
  CommunityError,
} from './community-input';

export interface RecommendationListInput {
  title: string;
  description: string;
  items: { seriesId: number; note: string; hasSpoilers: boolean }[];
}

export function communityKey(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value))
    throw new CommunityError(400, 'invalid');
  return value;
}

export function communityBoolean(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new CommunityError(400, 'invalid');
  return value;
}

export function parseRecommendationList(
  value: unknown
): RecommendationListInput {
  const data = communityObject(value);
  if (!Array.isArray(data.items) || data.items.length > 100)
    throw new CommunityError(400, 'invalid');
  const items = data.items.map((raw) => {
    const item = communityObject(raw);
    return {
      seriesId: communityId(item.seriesId),
      note: communityText(item.note ?? '', 0, 1000),
      hasSpoilers:
        item.hasSpoilers === undefined
          ? false
          : communityBoolean(item.hasSpoilers),
    };
  });
  if (new Set(items.map((item) => item.seriesId)).size !== items.length)
    throw new CommunityError(400, 'duplicate');
  return {
    title: communityText(data.title, 2, 100),
    description: communityText(data.description ?? '', 0, 1500),
    items,
  };
}

export interface CommunityProfileInput {
  displayName: string;
  bio: string;
  showAvatar: boolean;
  published: boolean;
}

export function parseCommunityProfile(value: unknown): CommunityProfileInput {
  const data = communityObject(value);
  const published = communityBoolean(data.published);
  return {
    displayName: communityText(data.displayName, published ? 2 : 0, 60),
    bio: communityText(data.bio ?? '', 0, 1000),
    showAvatar: communityBoolean(data.showAvatar),
    published,
  };
}
