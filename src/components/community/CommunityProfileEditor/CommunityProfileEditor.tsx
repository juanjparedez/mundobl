'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Alert, Avatar, Button, Form, Input, Modal, Switch } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { PanelCard, Chip } from '@/components/design-system';
import { CommunitySpace } from '../CommunitySpace/CommunitySpace';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useCommunityAction } from '@/hooks/useCommunityAction';
import { communityFetch } from '@/lib/community-client';
import type { CommunityProfileSettings } from '@/types/community-library';
import type { CommunityProfileInput } from '@/lib/community-library-input';
import type { CommunityAuthor } from '@/types/community';
import './CommunityProfileEditor.css';

export function CommunityProfileEditor({
  initial,
  initialBlocks,
}: {
  initial: CommunityProfileSettings;
  initialBlocks: CommunityAuthor[];
}) {
  const { t } = useLocale();
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState(initial);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [form] = Form.useForm<CommunityProfileInput>();
  const [preview, setPreview] = useState(false);
  const [pending, setPending] = useState<CommunityProfileInput | null>(null);
  const [saved, setSaved] = useState(false);
  const { busy, error, run } = useCommunityAction();
  const published = Form.useWatch('published', form);
  async function save(values: CommunityProfileInput) {
    await communityFetch('/api/community/profile', 'PATCH', {
      action: 'profile',
      ...values,
    });
    setProfile(
      await communityFetch<CommunityProfileSettings>('/api/community/profile')
    );
    setPending(null);
    setSaved(true);
    router.refresh();
  }
  return (
    <CommunitySpace
      active="profile"
      title={t('communitySpace.profile')}
      intro={t('communitySpace.profileIntro')}
      actions={
        <>
          <Button href="/comunidad/listas?mine=true">
            {t('communitySpace.myLists')}
          </Button>
          <Button
            disabled={busy}
            onClick={() =>
              run(async () => {
                const result = await communityFetch<{ id: string }>(
                  '/api/community/lists',
                  'POST',
                  {
                    title: t('communitySpace.topFive'),
                    description: '',
                    items: [],
                    kind: 'TOP_FIVE',
                  }
                );
                router.push(`/comunidad/listas/${result.id}`);
              })
            }
          >
            {t('communitySpace.topFive')}
          </Button>
        </>
      }
    >
      <div className="community-profile-editor">
        <PanelCard>
          <div className="community-profile-editor__status">
            <Chip>
              {t(
                profile.published
                  ? 'communitySpace.public'
                  : 'communitySpace.private'
              )}
            </Chip>
            {profile.moderationHidden && (
              <Chip>{t('communitySpace.moderated')}</Chip>
            )}
          </div>
          {error && (
            <Alert
              className="community-space__error"
              type="error"
              title={error}
              showIcon
            />
          )}
          {saved && <Alert type="success" title={t('communitySpace.saved')} />}
          <Form
            form={form}
            initialValues={initial}
            layout="vertical"
            onValuesChange={() => setSaved(false)}
            onFinish={(values) =>
              values.published && !profile.published
                ? setPending(values)
                : void run(() => save(values))
            }
          >
            <Form.Item
              name="displayName"
              label={t('communitySpace.displayName')}
              rules={[
                {
                  required: !!published,
                  min: published ? 2 : 0,
                  max: 60,
                  whitespace: true,
                  message: t('communityHub.required'),
                },
              ]}
            >
              <Input
                aria-label={t('communitySpace.displayName')}
                maxLength={60}
              />
            </Form.Item>
            <Form.Item name="bio" label={t('communitySpace.bio')}>
              <Input.TextArea
                aria-label={t('communitySpace.bio')}
                maxLength={1000}
                rows={4}
              />
            </Form.Item>
            <Form.Item
              name="showAvatar"
              label={t('communitySpace.showAvatar')}
              valuePropName="checked"
            >
              <Switch aria-label={t('communitySpace.showAvatar')} />
            </Form.Item>
            <Form.Item
              name="published"
              label={t('communitySpace.publishProfile')}
              valuePropName="checked"
            >
              <Switch
                aria-label={t('communitySpace.publishProfile')}
                disabled={profile.moderationHidden && !profile.published}
              />
            </Form.Item>
            <div className="community-space__actions">
              <Button type="primary" htmlType="submit" loading={busy}>
                {t('communitySpace.save')}
              </Button>
              <Button onClick={() => setPreview(true)} disabled={busy}>
                {t('communitySpace.preview')}
              </Button>
              {profile.published && !profile.moderationHidden && (
                <Button href={`/comunidad/perfiles/${profile.publicId}`}>
                  {t('communitySpace.profilePreview')}
                </Button>
              )}
            </div>
          </Form>
        </PanelCard>
        <PanelCard>
          <h2>{t('communitySpace.blocks')}</h2>
          <p>{t('communitySpace.blockHint')}</p>
          <ul className="community-profile-editor__blocks">
            {blocks.map((account) => (
              <li key={account.id}>
                <span>{account.name}</span>
                <Button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await communityFetch('/api/community/blocks', 'PATCH', {
                        targetId: account.id,
                        blocked: false,
                      });
                      setBlocks((previous) =>
                        previous.filter((row) => row.id !== account.id)
                      );
                    })
                  }
                >
                  {t('communitySpace.unblock')}
                </Button>
              </li>
            ))}
          </ul>
        </PanelCard>
      </div>
      <Modal
        open={preview}
        title={t('communitySpace.preview')}
        footer={null}
        onCancel={() => setPreview(false)}
        destroyOnHidden
      >
        <Avatar
          size={64}
          src={form.getFieldValue('showAvatar') ? session?.user?.image : null}
          icon={<UserOutlined />}
        />
        <h2>{form.getFieldValue('displayName')}</h2>
        <p className="community-profile-editor__bio">
          {form.getFieldValue('bio')}
        </p>
        <p>{t('communitySpace.profileIntro')}</p>
      </Modal>
      <Modal
        open={!!pending}
        title={t('communitySpace.publishProfile')}
        okText={t('communitySpace.publish')}
        cancelText={t('communitySpace.cancel')}
        confirmLoading={busy}
        onCancel={() => !busy && setPending(null)}
        onOk={() => pending && run(() => save(pending))}
      >
        <p>{t('communitySpace.publishConfirm')}</p>
        <p>{t('communitySpace.profileIntro')}</p>
      </Modal>
    </CommunitySpace>
  );
}
