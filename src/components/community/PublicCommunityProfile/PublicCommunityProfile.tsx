'use client';
import Link from 'next/link';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { CommunitySpace } from '../CommunitySpace/CommunitySpace';
import { RecommendationCard } from '../RecommendationCard/RecommendationCard';
import type { RecommendationListSummary } from '@/types/community-library';
import './PublicCommunityProfile.css';
import { CommunitySafetyControls } from '../CommunitySafetyControls/CommunitySafetyControls';
import { CommunityShareLink } from '../CommunityShareLink/CommunityShareLink';

export function PublicCommunityProfile({
  profile,
  page = 1,
}: {
  profile: {
    publicId: string;
    authorId: string;
    name: string;
    bio: string;
    image: string | null;
    lists: { items: RecommendationListSummary[]; hasNext: boolean };
  };
  page?: number;
}) {
  const { t } = useLocale();
  const lists = [...profile.lists.items].sort(
    (a, b) => Number(b.kind === 'TOP_FIVE') - Number(a.kind === 'TOP_FIVE')
  );
  return (
    <CommunitySpace
      active="profile"
      title={profile.name}
      intro={profile.bio}
      actions={<Avatar size={72} src={profile.image} icon={<UserOutlined />} />}
    >
      <CommunityShareLink path={`/comunidad/perfiles/${profile.publicId}`} />
      <CommunitySafetyControls
        targetType="PROFILE"
        targetId={profile.publicId}
        authorId={profile.authorId}
      />
      <div className="public-community-profile">
        <h2>{t('communitySpace.lists')}</h2>
        {lists.length ? (
          <ul className="community-space__grid">
            {lists.map((list) => (
              <li key={list.id}>
                <RecommendationCard list={list} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={t('communitySpace.emptyProfile')} />
        )}
      </div>
      <nav className="community-space__actions">
        {page > 1 && (
          <Link
            href={`/comunidad/perfiles/${profile.publicId}?page=${page - 1}`}
          >
            {t('peopleIndex.prevPage')}
          </Link>
        )}
        {profile.lists.hasNext && (
          <Link
            href={`/comunidad/perfiles/${profile.publicId}?page=${page + 1}`}
          >
            {t('peopleIndex.nextPage')}
          </Link>
        )}
      </nav>
    </CommunitySpace>
  );
}
