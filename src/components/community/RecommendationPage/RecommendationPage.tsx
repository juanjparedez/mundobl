'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Button, Popconfirm } from 'antd';
import { Chip } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useCommunityAction } from '@/hooks/useCommunityAction';
import { communityFetch } from '@/lib/community-client';
import { CommunitySpace } from '../CommunitySpace/CommunitySpace';
import { RecommendationContents } from '../RecommendationContents/RecommendationContents';
import { RecommendationEditor } from '../RecommendationEditor/RecommendationEditor';
import type { RecommendationListDetail } from '@/types/community-library';
import './RecommendationPage.css';
import { CommunitySafetyControls } from '../CommunitySafetyControls/CommunitySafetyControls';
import { CommunityShareLink } from '../CommunityShareLink/CommunityShareLink';

export function RecommendationPage({
  initial,
}: {
  initial: RecommendationListDetail;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [editing, setEditing] = useState(
    initial.own && initial.items.length === 0
  );
  const { busy, error, run } = useCommunityAction();
  const api = `/api/community/lists/${list.id}`;
  async function visibility(published: boolean) {
    await communityFetch(api, 'PATCH', {
      action: 'visibility',
      revision: list.revision,
      published,
    });
    setList(await communityFetch<RecommendationListDetail>(api));
    router.refresh();
  }
  return (
    <CommunitySpace
      active={list.own ? 'mine' : 'lists'}
      title={list.title}
      intro={list.description}
    >
      <Link
        href={list.own ? '/comunidad/listas?mine=true' : '/comunidad/listas'}
      >
        {t('communitySpace.back')}
      </Link>
      <div className="recommendation-page__status">
        <Chip>
          {t(
            list.visibility === 'PRIVATE'
              ? 'communitySpace.private'
              : 'communitySpace.public'
          )}
        </Chip>
        {list.kind === 'TOP_FIVE' && <Chip>{t('communitySpace.topFive')}</Chip>}
        {list.author.profileId ? (
          <Link href={`/comunidad/perfiles/${list.author.profileId}`}>
            {list.author.name}
          </Link>
        ) : (
          <span>{list.author.name}</span>
        )}
      </div>
      {list.moderationHidden && (
        <Alert type="warning" title={t('communitySpace.moderated')} showIcon />
      )}
      {list.visibility === 'PUBLIC' && !list.moderationHidden && (
        <CommunitySafetyControls
          targetType="LIST"
          targetId={list.id}
          authorId={list.author.id}
        />
      )}
      {error && (
        <Alert
          className="community-space__error"
          type="error"
          title={error}
          showIcon
        />
      )}
      {editing ? (
        <RecommendationEditor
          key={`${list.id}-${list.revision}`}
          initial={list}
          busy={busy}
          error=""
          onCancel={() => setEditing(false)}
          onSave={(input) =>
            void run(async () => {
              await communityFetch(api, 'PATCH', {
                ...input,
                action: 'edit',
                revision: list.revision,
              });
              setList(await communityFetch<RecommendationListDetail>(api));
              setEditing(false);
              router.refresh();
            })
          }
        />
      ) : (
        <>
          <div className="community-space__actions">
            {list.own && (
              <>
                <Button onClick={() => setEditing(true)} disabled={busy}>
                  {t('communitySpace.edit')}
                </Button>
                {list.visibility === 'PRIVATE' ? (
                  <Popconfirm
                    title={t('communitySpace.publishConfirm')}
                    okText={t('communitySpace.publish')}
                    cancelText={t('communitySpace.cancel')}
                    onConfirm={() => run(() => visibility(true))}
                  >
                    <Button
                      type="primary"
                      disabled={
                        busy || !list.items.length || list.moderationHidden
                      }
                    >
                      {t('communitySpace.publish')}
                    </Button>
                  </Popconfirm>
                ) : (
                  <Button
                    onClick={() => run(() => visibility(false))}
                    disabled={busy}
                  >
                    {t('communitySpace.unpublish')}
                  </Button>
                )}
                <Popconfirm
                  title={t('communitySpace.deleteConfirm')}
                  okText={t('communityHub.delete')}
                  cancelText={t('communitySpace.cancel')}
                  onConfirm={() =>
                    run(async () => {
                      await communityFetch(api, 'DELETE');
                      router.push('/comunidad/listas?mine=true');
                      router.refresh();
                    })
                  }
                >
                  <Button danger disabled={busy}>
                    {t('communityHub.delete')}
                  </Button>
                </Popconfirm>
              </>
            )}
            {list.visibility === 'PUBLIC' && !list.moderationHidden && (
              <CommunityShareLink path={`/comunidad/listas/${list.id}`} />
            )}
          </div>
          <RecommendationContents items={list.items} />
        </>
      )}
    </CommunitySpace>
  );
}
