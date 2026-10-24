import type { EpisodePlatform } from './episode-platforms';

export interface OfficialVideoPublisher {
  platform: Exclude<EpisodePlatform, 'YouTube'>;
  /** Stable provider ID, never a client-supplied display name. */
  ownerId: string;
  name: string;
  profileUrl: string;
  evidenceUrl: string;
  /** Individually verified films; a publisher may also upload third-party work. */
  videoIds: readonly string[];
}

export const OFFICIAL_VIDEO_PUBLISHERS: readonly OfficialVideoPublisher[] = [
  {
    platform: 'Vimeo',
    ownerId: '7732934',
    name: 'WU ZI-EN',
    profileUrl: 'https://vimeo.com/wuzien',
    evidenceUrl: 'https://irisprize.org/film/yu-and-rachel/',
    videoIds: ['129009162'],
  },
];

export function findOfficialVideoPublisher(
  platform: OfficialVideoPublisher['platform'],
  ownerId: string,
  videoId: string,
  publishers: readonly OfficialVideoPublisher[] = OFFICIAL_VIDEO_PUBLISHERS
): OfficialVideoPublisher | undefined {
  return publishers.find(
    (publisher) =>
      publisher.platform === platform &&
      publisher.ownerId === ownerId &&
      publisher.videoIds.includes(videoId)
  );
}
