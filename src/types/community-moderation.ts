export interface CommunityFeatureSettings {
  conversationsEnabled: boolean;
  listsEnabled: boolean;
  profilesEnabled: boolean;
  promptEnabled: boolean;
}
export type CommunityModerationAction =
  | 'HIDE'
  | 'RESTORE'
  | 'RESOLVE'
  | 'DISMISS';
export interface CommunityModerationQueue {
  hasNext: boolean;
  items: {
    id: string;
    targetType: 'TOPIC' | 'REPLY' | 'LIST' | 'PROFILE';
    targetId: string;
    reason: 'SPAM' | 'HARASSMENT' | 'SPOILERS' | 'OTHER';
    detail: string;
    status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
    createdAt: string;
    actions: {
      id: string;
      action: CommunityModerationAction;
      reason: string;
      createdAt: string;
    }[];
    content: {
      ownerId: string | null;
      title: string;
      body: string;
      hidden: boolean;
      href: string;
    } | null;
  }[];
}
