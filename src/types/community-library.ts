import type { CommunityAuthor, CommunitySeries } from './community';

export interface RecommendationItem {
  seriesId: number;
  position: number;
  note: string;
  hasSpoilers: boolean;
  series: CommunitySeries;
}
export interface RecommendationListDetail {
  id: string;
  title: string;
  description: string;
  kind: 'STANDARD' | 'TOP_FIVE';
  visibility: 'PRIVATE' | 'PUBLIC';
  moderationHidden: boolean;
  revision: number | null;
  own: boolean;
  author: CommunityAuthor & { profileId: string | null };
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  items: RecommendationItem[];
}
export interface RecommendationListSummary extends RecommendationListDetail {
  itemCount: number;
}
export interface CommunityProfileSettings {
  publicId: string | null;
  published: boolean;
  displayName: string;
  bio: string;
  showAvatar: boolean;
  moderationHidden: boolean;
  promptChoice: 'NEW' | 'LATER' | 'DISMISSED' | 'STARTED';
  promptEligible: boolean;
}
