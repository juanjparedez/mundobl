'use client';
import Link from 'next/link';
import { CommentOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { getCommunityUrl } from '@/lib/community-url';
import './CommunityWorkLink.css';

export function CommunityWorkLink({
  seriesId,
  episodeId,
}: {
  seriesId: number;
  episodeId?: number;
}) {
  const { t } = useLocale();
  return (
    <Link
      className="community-work-link"
      href={getCommunityUrl(1, '', 'all', { seriesId, episodeId })}
    >
      <CommentOutlined aria-hidden />
      {t(
        episodeId
          ? 'communitySpace.discussEpisode'
          : 'communityHub.conversations'
      )}
    </Link>
  );
}
