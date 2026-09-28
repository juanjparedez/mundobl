'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Form, Input, Modal, Popconfirm, Switch } from 'antd';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useCommunityAction } from '@/hooks/useCommunityAction';
import { communityFetch } from '@/lib/community-client';
import type { CommunityTopicDetail } from '@/types/community';
import './CommunityTopicOwnerControls.css';

export function CommunityTopicOwnerControls({
  topic,
}: {
  topic: CommunityTopicDetail;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const { busy, error, run } = useCommunityAction();
  const [editing, setEditing] = useState(false);
  const refresh = () => {
    router.push(`/comunidad/${topic.id}`);
    router.refresh();
  };
  function publish(published: boolean) {
    return run(async () => {
      await communityFetch(`/api/community/topics/${topic.id}`, 'PATCH', {
        action: 'visibility',
        published,
        updatedAt: topic.updatedAt,
      });
      refresh();
    });
  }
  return (
    <div className="topic-owner-controls">
      {error && <Alert type="error" title={error} showIcon />}
      {topic.moderationHidden && (
        <Alert type="warning" title={t('communitySpace.moderated')} showIcon />
      )}
      <div className="topic-owner-controls__actions">
        <Button disabled={busy} onClick={() => setEditing(true)}>
          {t('communitySpace.edit')}
        </Button>
        {topic.visibility === 'PRIVATE' ? (
          <Popconfirm
            title={t('communitySpace.topicPublishConfirm')}
            okText={t('communityHub.publish')}
            cancelText={t('communitySpace.cancel')}
            onConfirm={() => publish(true)}
          >
            <Button type="primary" disabled={busy || topic.moderationHidden}>
              {t('communityHub.publish')}
            </Button>
          </Popconfirm>
        ) : (
          <Button disabled={busy} onClick={() => publish(false)}>
            {t('communitySpace.unpublish')}
          </Button>
        )}
      </div>
      <Modal
        open={editing}
        title={t('communitySpace.edit')}
        footer={null}
        onCancel={() => !busy && setEditing(false)}
        destroyOnHidden
      >
        <Form<{ title: string; body: string; hasSpoilers: boolean }>
          layout="vertical"
          initialValues={{
            title: topic.title,
            body: topic.body,
            hasSpoilers: topic.hasSpoilers,
          }}
          onFinish={(values) =>
            void run(async () => {
              await communityFetch(
                `/api/community/topics/${topic.id}`,
                'PATCH',
                {
                  ...values,
                  action: 'edit',
                  updatedAt: topic.updatedAt,
                  kind: topic.kind,
                  seriesId: topic.series?.id ?? null,
                  episodeId: topic.episode?.id ?? null,
                }
              );
              setEditing(false);
              refresh();
            })
          }
        >
          {error && <Alert type="error" title={error} showIcon />}
          <Form.Item
            name="title"
            label={t('communityHub.topicTitle')}
            rules={[
              {
                required: true,
                min: 5,
                max: 140,
                whitespace: true,
                message: t('communityHub.titleHint'),
              },
            ]}
          >
            <Input aria-label={t('communityHub.topicTitle')} maxLength={140} />
          </Form.Item>
          <Form.Item
            name="body"
            label={t('communityHub.body')}
            rules={[
              {
                required: true,
                min: 10,
                max: 5000,
                whitespace: true,
                message: t('communityHub.bodyHint'),
              },
            ]}
          >
            <Input.TextArea
              aria-label={t('communityHub.body')}
              rows={5}
              maxLength={5000}
            />
          </Form.Item>
          <Form.Item
            name="hasSpoilers"
            label={t('communityHub.spoilers')}
            valuePropName="checked"
          >
            <Switch disabled={!!topic.episode} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={busy}>
            {t('communitySpace.save')}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
