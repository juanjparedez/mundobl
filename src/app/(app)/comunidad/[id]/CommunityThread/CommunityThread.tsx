'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Alert, Avatar, Button, Input, Popconfirm, Switch } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { PanelCard, Chip, EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { getContentUrl, getSeriesUrl } from '@/lib/slug';
import type { CommunityTopicDetail } from '@/types/community';
import './CommunityThread.css';

export function CommunityThread({
  topic,
  page,
}: {
  topic: CommunityTopicDetail;
  page: number;
}) {
  const { t, locale } = useLocale();
  const { data: session } = useSession();
  const router = useRouter();
  const [body, setBody] = useState('');
  const [spoilers, setSpoilers] = useState(false);
  const [revealed, setRevealed] = useState(!topic.hasSpoilers);
  const [revealedReplies, setRevealedReplies] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const moderator =
    session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';
  const owner = session?.user?.id === topic.author?.id && !!session?.user?.id;
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeZone: 'UTC',
    }).format(new Date(value));
  async function mutate(method: string, suffix = '', payload?: unknown) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(
        `/api/community/topics/${topic.id}${suffix}`,
        {
          method,
          headers: { 'Content-Type': 'application/json' },
          ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
        }
      );
      if (!response.ok) {
        setError(
          t(
            response.status === 429
              ? 'communityHub.rateLimit'
              : response.status === 409
                ? 'communityHub.closed'
                : 'communityHub.error'
          )
        );
        return false;
      }
      return true;
    } catch {
      setError(t('communityHub.error'));
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function reply() {
    if (!body.trim()) return;
    if (await mutate('POST', '/replies', { body, hasSpoilers: spoilers })) {
      setBody('');
      setSpoilers(false);
      const lastPage = Math.ceil((topic.replyCount + 1) / 30);
      router.push(
        `/comunidad/${topic.id}${lastPage > 1 ? `?page=${lastPage}` : ''}`
      );
      router.refresh();
    }
  }
  return (
    <article className="community-thread">
      <Link href="/comunidad">← {t('community.title')}</Link>
      {error && <Alert type="error" title={error} showIcon />}
      <PanelCard className="community-thread__topic">
        <div className="community-thread__meta">
          <Chip>{t(`communityHub.${topic.kind}`)}</Chip>
          {topic.closed && <Chip>{t('communityHub.closed')}</Chip>}
        </div>
        {topic.series && (
          <Link
            className="community-thread__series"
            href={getContentUrl(topic.series)}
          >
            {topic.series.title}
            {topic.episode &&
              ` · ${t('communityHub.episodeFormat').replace('{season}', String(topic.episode.seasonNumber)).replace('{episode}', String(topic.episode.episodeNumber))}`}
          </Link>
        )}
        <h1>{revealed ? topic.title : t('community.spoilers')}</h1>
        <div className="community-thread__meta">
          <Avatar size={28} src={topic.author?.image} icon={<UserOutlined />} />
          <span>{topic.author?.name ?? t('communityHub.anonymous')}</span>
          <time dateTime={topic.createdAt}>{date(topic.createdAt)}</time>
        </div>
        {revealed ? (
          <p className="community-thread__body">{topic.body}</p>
        ) : (
          <Button onClick={() => setRevealed(true)}>
            {t('communityHub.showSpoilers')}
          </Button>
        )}
        <div className="community-thread__actions">
          {topic.kind === 'REVIEW_REQUEST' && topic.series && (
            <Button
              href={`${topic.series.origin === 'CURATED' ? getSeriesUrl(topic.series.id, topic.series.title) : getContentUrl(topic.series)}?review=new#series-section-reviews`}
            >
              {t('communityHub.writeReview')}
            </Button>
          )}
          {(owner || moderator) && (
            <>
              <Button
                disabled={busy}
                onClick={async () => {
                  if (await mutate('PATCH', '', { closed: !topic.closed }))
                    router.refresh();
                }}
              >
                {t(topic.closed ? 'communityHub.reopen' : 'communityHub.close')}
              </Button>
              <Popconfirm
                title={t('communityHub.deleteConfirm')}
                onConfirm={async () => {
                  if (await mutate('DELETE')) {
                    router.push('/comunidad');
                    router.refresh();
                  }
                }}
              >
                <Button danger disabled={busy}>
                  {t('communityHub.delete')}
                </Button>
              </Popconfirm>
            </>
          )}
        </div>
      </PanelCard>
      {revealed && (
        <section aria-label={t('communityHub.replies')}>
          <h2>
            {topic.replyCount} {t('communityHub.replies')}
          </h2>
          {!topic.replies.length && (
            <EmptyState title={t('communityHub.noReplies')} />
          )}
          <ol className="community-thread__replies">
            {topic.replies.map((reply) => (
              <li key={reply.id} id={`reply-${reply.id}`}>
                <PanelCard>
                  <div className="community-thread__meta">
                    <Avatar
                      size={28}
                      src={reply.author?.image}
                      icon={<UserOutlined />}
                    />
                    <strong>
                      {reply.author?.name ?? t('communityHub.anonymous')}
                    </strong>
                    <time dateTime={reply.createdAt}>
                      {date(reply.createdAt)}
                    </time>
                  </div>
                  {reply.hasSpoilers && !revealedReplies.includes(reply.id) ? (
                    <Button
                      onClick={() =>
                        setRevealedReplies((prev) => [...prev, reply.id])
                      }
                    >
                      {t('communityHub.showSpoilers')}
                    </Button>
                  ) : (
                    <p className="community-thread__body">{reply.body}</p>
                  )}
                  {(moderator ||
                    (!!session?.user?.id &&
                      session.user.id === reply.author?.id)) && (
                    <Popconfirm
                      title={t('communityHub.deleteConfirm')}
                      onConfirm={async () => {
                        if (
                          await mutate('DELETE', `/replies?replyId=${reply.id}`)
                        ) {
                          router.push(`/comunidad/${topic.id}`);
                          router.refresh();
                        }
                      }}
                    >
                      <Button danger type="text" disabled={busy}>
                        {t('communityHub.delete')}
                      </Button>
                    </Popconfirm>
                  )}
                </PanelCard>
              </li>
            ))}
          </ol>
          {(page > 1 || topic.hasMore) && (
            <nav className="community-thread__actions">
              {page > 1 && (
                <Link href={`/comunidad/${topic.id}?page=${page - 1}`}>
                  {t('peopleIndex.prevPage')}
                </Link>
              )}
              {topic.hasMore && (
                <Link href={`/comunidad/${topic.id}?page=${page + 1}`}>
                  {t('peopleIndex.nextPage')}
                </Link>
              )}
            </nav>
          )}
          {topic.closed ? (
            <Alert title={t('communityHub.closed')} type="info" />
          ) : session?.user ? (
            <PanelCard>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void reply();
                }}
              >
                <label htmlFor="community-reply">
                  {t('communityHub.reply')}
                </label>
                <Input.TextArea
                  id="community-reply"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  maxLength={5000}
                  rows={4}
                  placeholder={t('communityHub.replyPlaceholder')}
                />
                <div className="community-thread__actions">
                  <Switch
                    id="reply-spoilers"
                    checked={spoilers}
                    onChange={setSpoilers}
                  />
                  <label htmlFor="reply-spoilers">
                    {t('communityHub.spoilers')}
                  </label>
                  <Button
                    htmlType="submit"
                    type="primary"
                    loading={busy}
                    disabled={!body.trim()}
                  >
                    {t('communityHub.reply')}
                  </Button>
                </div>
              </form>
            </PanelCard>
          ) : (
            <Button
              type="primary"
              onClick={() =>
                signIn('google', { callbackUrl: window.location.href })
              }
            >
              {t('communityHub.login')}
            </Button>
          )}
        </section>
      )}
    </article>
  );
}
