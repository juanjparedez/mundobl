'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Form, Input, Modal, Popconfirm, Select } from 'antd';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useCommunityAction } from '@/hooks/useCommunityAction';
import { communityFetch } from '@/lib/community-client';
import './CommunitySafetyControls.css';

export function CommunitySafetyControls({
  targetType,
  targetId,
  authorId,
}: {
  targetType: 'TOPIC' | 'REPLY' | 'LIST' | 'PROFILE';
  targetId: string;
  authorId?: string | null;
}) {
  const { t } = useLocale();
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const { busy, error, run } = useCommunityAction();
  if (!session?.user?.id || session.user.id === authorId) return null;
  return (
    <div className="community-safety">
      {error && !open && <Alert type="error" title={error} showIcon />}
      {reported && <span role="status">{t('communitySpace.reportSent')}</span>}
      <div className="community-safety__actions">
        <Button
          type="text"
          disabled={busy || reported}
          onClick={() => setOpen(true)}
        >
          {t('communitySpace.report')}
        </Button>
        {authorId && (
          <Popconfirm
            title={t('communitySpace.block')}
            description={t('communitySpace.blockHint')}
            okText={t('communitySpace.block')}
            cancelText={t('communitySpace.cancel')}
            onConfirm={() =>
              run(async () => {
                await communityFetch('/api/community/blocks', 'PATCH', {
                  targetId: authorId,
                  blocked: true,
                });
                router.push('/comunidad');
                router.refresh();
              })
            }
          >
            <Button type="text" danger disabled={busy}>
              {t('communitySpace.block')}
            </Button>
          </Popconfirm>
        )}
      </div>
      <Modal
        open={open}
        title={t('communitySpace.report')}
        footer={null}
        destroyOnHidden
        onCancel={() => !busy && setOpen(false)}
      >
        <p>{t('communitySpace.reportPrivacy')}</p>
        {error && <Alert type="error" title={error} showIcon />}
        <Form<{
          reason: 'SPAM' | 'HARASSMENT' | 'SPOILERS' | 'OTHER';
          detail?: string;
        }>
          layout="vertical"
          initialValues={{ reason: 'OTHER' }}
          onFinish={(values) =>
            void run(async () => {
              await communityFetch('/api/community/reports', 'POST', {
                targetType,
                targetId,
                ...values,
              });
              setReported(true);
              setOpen(false);
            })
          }
        >
          <Form.Item
            name="reason"
            label={t('communitySpace.reportReason')}
            rules={[{ required: true }]}
          >
            <Select
              aria-label={t('communitySpace.reportReason')}
              options={(
                ['SPAM', 'HARASSMENT', 'SPOILERS', 'OTHER'] as const
              ).map((value) => ({
                value,
                label: t(`communitySpace.reason${value}`),
              }))}
            />
          </Form.Item>
          <Form.Item name="detail" label={t('communitySpace.reportDetail')}>
            <Input.TextArea
              aria-label={t('communitySpace.reportDetail')}
              maxLength={2000}
              rows={4}
            />
          </Form.Item>
          <Button htmlType="submit" type="primary" loading={busy}>
            {t('communitySpace.report')}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
