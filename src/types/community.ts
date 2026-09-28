export const COMMUNITY_KINDS = [
  'DISCUSSION',
  'REVIEW_REQUEST',
  'RECOMMENDATION',
] as const;
export type CommunityKind = (typeof COMMUNITY_KINDS)[number];
export type CommunityFilter = 'all' | CommunityKind | 'unanswered';
export interface CommunitySeries {
  id: number;
  title: string;
  origin: string;
  catalogScope: string;
  imageUrl: string | null;
}
export interface CommunityAuthor {
  id: string;
  name: string;
  image: string | null;
}
export interface CommunityTopicItem {
  id: number;
  kind: CommunityKind;
  title: string | null;
  excerpt: string | null;
  hasSpoilers: boolean;
  closed: boolean;
  createdAt: string;
  author: CommunityAuthor | null;
  series: CommunitySeries | null;
  episode: { id: number; episodeNumber: number; seasonNumber: number } | null;
  replyCount: number;
}
export interface CommunityReviewItem {
  id: number;
  title: string | null;
  excerpt: string | null;
  author: CommunityAuthor | null;
  publishedAt: string | null;
  helpfulCount: number;
  series: CommunitySeries;
}
export interface CommunityReplyItem {
  id: number;
  body: string;
  hasSpoilers: boolean;
  createdAt: string;
  author: CommunityAuthor | null;
}
export interface CommunityTopicDetail extends CommunityTopicItem {
  title: string;
  body: string;
  replies: CommunityReplyItem[];
  hasMore: boolean;
}
export interface CommunityTopicInput {
  kind: CommunityKind;
  title: string;
  body: string;
  hasSpoilers: boolean;
  seriesId: number | null;
  episodeId: number | null;
}
