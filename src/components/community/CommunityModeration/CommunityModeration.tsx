'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Alert, Button, Form, Input, Modal, Switch } from 'antd';
import { PanelCard, Chip, EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useCommunityAction } from '@/hooks/useCommunityAction';
import { communityFetch } from '@/lib/community-client';
import type {
  CommunityFeatureSettings,
  CommunityModerationQueue,
  CommunityModerationAction,
} from '@/types/community-moderation';
import './CommunityModeration.css';

export function CommunityModeration({
  initial,
  settings,
  canConfigure,
  page,
  resolved,
}: {
  initial: CommunityModerationQueue;
  settings: CommunityFeatureSettings;
  canConfigure: boolean;
  page: number;
  resolved: boolean;
}) {
  const { t, locale } = useLocale();
  const [queue, setQueue] = useState(initial);
  const [pending, setPending] = useState<{
    reportId: string;
    action: CommunityModerationAction;
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const { busy, error, run } = useCommunityAction();
  const href = (targetPage: number, done = resolved) =>
    `/admin/comunidad?page=${targetPage}&resolved=${done}`;
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  async function reload() {
    setQueue(
      await communityFetch<CommunityModerationQueue>(
        `/api/admin/community?page=${page}&resolved=${resolved}`
      )
    );
  }
  return (
    <section className="community-moderation">
      <header>
        <h1>{t('communitySpace.moderation')}</h1>
        <p>{t('communitySpace.moderationHint')}</p>
      </header>
      {error && !pending && <Alert type="error" title={error} showIcon />}
      <nav className="community-moderation__actions">
        <Link
          href={href(1, false)}
          aria-current={!resolved ? 'page' : undefined}
        >
          {t('communitySpace.openReports')}
        </Link>
        <Link href={href(1, true)} aria-current={resolved ? 'page' : undefined}>
          {t('communitySpace.closedReports')}
        </Link>
      </nav>
      {!queue.items.length && (
        <EmptyState title={t('communitySpace.noReports')} />
      )}
      {queue.items.map((report) => (
        <PanelCard key={report.id}>
          <div className="community-moderation__actions">
            <Chip>{t(`communitySpace.target${report.targetType}`)}</Chip>
            <Chip>{t(`communitySpace.reason${report.reason}`)}</Chip>
            <time dateTime={report.createdAt}>{date(report.createdAt)}</time>
          </div>
          <h2>
            {report.content?.title ||
              t(`communitySpace.target${report.targetType}`)}
          </h2>
          {report.content ? (
            <div className="community-moderation__content">
              {!report.content.hidden && (
                <Link href={report.content.href}>{t('communityHub.open')}</Link>
              )}
              <p>{report.content.body}</p>
              {report.content.hidden && (
                <Chip>{t('communitySpace.moderated')}</Chip>
              )}
            </div>
          ) : (
            <Alert type="info" title={t('communitySpace.contentUnavailable')} />
          )}
          {report.detail && (
            <p className="community-moderation__content">
              <strong>{t('communitySpace.reportDetail')}: </strong>
              {report.detail}
            </p>
          )}
          <div className="community-moderation__actions">
            {(['HIDE', 'RESTORE', 'RESOLVE', 'DISMISS'] as const).map(
              (action) => (
                <Button
                  key={action}
                  disabled={
                    busy ||
                    (action === 'HIDE' &&
                      (!report.content || report.content.hidden))
                  }
                  danger={action === 'HIDE'}
                  onClick={() => setPending({ reportId: report.id, action })}
                >
                  {t(`communitySpace.action${action}`)}
                </Button>
              )
            )}
          </div>
          {!!report.actions.length && (
            <details>
              <summary>{t('communitySpace.audit')}</summary>
              <ol>
                {report.actions.map((action) => (
                  <li key={action.id}>
                    <strong>
                      {t(`communitySpace.action${action.action}`)}
                    </strong>{' '}
                    · {date(action.createdAt)}
                    <p className="community-moderation__content">
                      {action.reason}
                    </p>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </PanelCard>
      ))}
      {(page > 1 || queue.hasNext) && (
        <nav className="community-moderation__actions">
          {page > 1 && (
            <Link href={href(page - 1)}>{t('peopleIndex.prevPage')}</Link>
          )}
          {queue.hasNext && (
            <Link href={href(page + 1)}>{t('peopleIndex.nextPage')}</Link>
          )}
        </nav>
      )}
      {canConfigure && (
        <PanelCard>
          <h2>{t('communitySpace.communitySettings')}</h2>
          <p>{t('communitySpace.settingsHint')}</p>
          {saved && <Alert type="success" title={t('communitySpace.saved')} />}
          <Form<CommunityFeatureSettings>
            layout="vertical"
            initialValues={settings}
            onFinish={(values) =>
              void run(async () => {
                await communityFetch('/api/admin/community', 'PATCH', {
                  action: 'settings',
                  ...values,
                });
                setSaved(true);
              })
            }
          >
            {(
              [
                'conversationsEnabled',
                'listsEnabled',
                'profilesEnabled',
                'promptEnabled',
              ] as const
            ).map((key) => (
              <Form.Item
                key={key}
                name={key}
                valuePropName="checked"
                label={t(`communitySpace.${key}`)}
              >
                <Switch
                  aria-label={t(`communitySpace.${key}`)}
                  disabled={busy}
                />
              </Form.Item>
            ))}
            <Button type="primary" htmlType="submit" loading={busy}>
              {t('communitySpace.save')}
            </Button>
          </Form>
        </PanelCard>
      )}
      <Modal
        open={!!pending}
        title={pending ? t(`communitySpace.action${pending.action}`) : ''}
        footer={null}
        destroyOnHidden
        onCancel={() => !busy && setPending(null)}
      >
        {error && <Alert type="error" title={error} showIcon />}
        <Form<{ reason: string }>
          key={`${pending?.reportId}:${pending?.action}`}
          layout="vertical"
          onFinish={(values) =>
            void run(async () => {
              if (!pending) return;
              await communityFetch('/api/admin/community', 'PATCH', {
                ...pending,
                ...values,
              });
              await reload();
              setPending(null);
            })
          }
        >
          <Form.Item
            name="reason"
            label={t('communitySpace.actionReason')}
            rules={[
              {
                required: true,
                min: 5,
                max: 1000,
                whitespace: true,
                message: t('communitySpace.actionReasonHint'),
              },
            ]}
          >
            <Input.TextArea
              aria-label={t('communitySpace.actionReason')}
              rows={4}
              maxLength={1000}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={busy}>
            {t('communitySpace.save')}
          </Button>
        </Form>
      </Modal>
    </section>
  );
}
