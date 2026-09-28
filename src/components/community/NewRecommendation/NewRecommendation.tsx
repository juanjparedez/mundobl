'use client';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useCommunityAction } from '@/hooks/useCommunityAction';
import { communityFetch } from '@/lib/community-client';
import { CommunitySpace } from '../CommunitySpace/CommunitySpace';
import { RecommendationEditor } from '../RecommendationEditor/RecommendationEditor';
import './NewRecommendation.css';

export function NewRecommendation() {
  const { t } = useLocale();
  const router = useRouter();
  const { busy, error, run } = useCommunityAction();
  return (
    <CommunitySpace
      active="mine"
      title={t('communitySpace.newList')}
      intro={t('communitySpace.emptyListsHint')}
    >
      <div className="new-recommendation">
        <RecommendationEditor
          busy={busy}
          error={error}
          onCancel={() => router.push('/comunidad/listas?mine=true')}
          onSave={(input) =>
            void run(async () => {
              const result = await communityFetch<{ id: string }>(
                '/api/community/lists',
                'POST',
                input
              );
              router.push(`/comunidad/listas/${result.id}`);
              router.refresh();
            })
          }
        />
      </div>
    </CommunitySpace>
  );
}
