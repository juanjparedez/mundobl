'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Alert, Button, Progress, Segmented, Skeleton, Tag } from 'antd';
import { CheckOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { EmptyState, PanelCard } from '@/components/design-system';
import { PosterPlaceholder } from '@/components/common/PosterPlaceholder/PosterPlaceholder';
import { SignupNudge } from '@/components/series/SignupNudge/SignupNudge';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import { useDismissedNotice } from '@/hooks/useDismissedNotice';
import { useLocalLibrary } from '@/hooks/useLocalLibrary';
import { isDirectServedImageUrl } from '@/lib/image-helpers';
import { setLocalEpisodesWatched } from '@/lib/local-progress';
import type { LocalLibraryItem } from '@/lib/local-library';
import { recordSeriesActivity } from '@/lib/activity-beacon';
import type { TranslationKey } from '@/i18n/messages';
import './LocalWatchingList.css';

type LocalFilter = 'active' | 'QUIERO_VER' | 'VISTA' | 'all';

const ACTIVE_STATUSES = new Set(['VIENDO', 'RETOMAR']);

const LABEL_KEYS: Record<string, TranslationKey> = {
  active: 'trackingWorkspace.continue',
  all: 'trackingWorkspace.all',
  SIN_VER: 'viewStatus.sinVer',
  VIENDO: 'viewStatus.viendo',
  VISTA: 'viewStatus.vista',
  RETOMAR: 'viewStatus.retomar',
  ABANDONADA: 'viewStatus.abandonada',
  QUIERO_VER: 'viewStatus.quieroVer',
};

function matches(item: LocalLibraryItem, filter: LocalFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'active') return ACTIVE_STATUSES.has(item.status);
  return item.status === filter;
}

/**
 * /watching sin cuenta: lo que se sigue en este navegador, con el mismo
 * "seguir viendo" y "vi el capitulo" que con cuenta. Sin cuenta todo
 * funciona; la cuenta suma guardarlo en todos lados y contar en el pedido
 * de series a las plataformas.
 */
export function LocalWatchingList() {
  const { t } = useLocale();
  const message = useMessage();
  const { items, loading, failed } = useLocalLibrary();
  const nudge = useDismissedNotice('watching-signup-nudge');
  const [filter, setFilter] = useState<LocalFilter>('active');

  const counts = useMemo(() => {
    const count = (value: LocalFilter) =>
      items.filter((item) => matches(item, value)).length;
    return {
      active: count('active'),
      QUIERO_VER: count('QUIERO_VER'),
      VISTA: count('VISTA'),
      all: items.length,
    };
  }, [items]);
  // Si no hay nada en curso, arranca en lo que si hay.
  const effectiveFilter: LocalFilter =
    counts[filter] > 0 ? filter : counts.QUIERO_VER > 0 ? 'QUIERO_VER' : 'all';
  const visible = items.filter((item) => matches(item, effectiveFilter));

  if (loading) return <Skeleton active />;

  if (items.length === 0)
    return (
      <EmptyState
        title={t('localLibrary.emptyTitle')}
        description={t('localLibrary.emptyBody')}
        action={
          <div className="local-watching__empty-actions">
            <Link href="/catalogo">
              <Button type="primary">
                {t('watchingDashboard.exploreCatalog')}
              </Button>
            </Link>
            <Button onClick={() => void signIn()}>
              {t('trackingWorkspace.signIn')}
            </Button>
          </div>
        }
      />
    );

  const code = (item: LocalLibraryItem) =>
    item.next
      ? t('progressStepper.chapterShort', {
          season: item.next.seasonNumber,
          n: item.next.number,
        })
      : '';

  const markNext = (item: LocalLibraryItem) => {
    if (!item.next) return;
    setLocalEpisodesWatched(item.summary.id, item.next.episodeIds, true);
    recordSeriesActivity(
      item.summary.id,
      'chapter',
      item.next.episodeIds[item.next.episodeIds.length - 1]
    );
    message.success(
      t('watchingDashboard.episodeMarkedMessage', { ep: code(item) })
    );
  };

  return (
    <div className="local-watching">
      <header className="local-watching__header">
        <h1>{t('localLibrary.title')}</h1>
        <p>{t('localLibrary.intro')}</p>
      </header>

      {!nudge.dismissed && (
        <SignupNudge
          title={t('tracking.signupTitle')}
          body={t('tracking.signupBody')}
          action={t('tracking.signupAction')}
          dismiss={t('tracking.signupDismiss')}
          onAction={() => void signIn()}
          onDismiss={nudge.dismiss}
        />
      )}

      {failed && (
        <Alert type="warning" showIcon title={t('localLibrary.loadFailed')} />
      )}

      <Segmented
        className="local-watching__filter"
        value={effectiveFilter}
        onChange={(value: LocalFilter) => setFilter(value)}
        options={(['active', 'QUIERO_VER', 'VISTA', 'all'] as const).map(
          (value) => ({
            value,
            label: `${t(LABEL_KEYS[value])} (${counts[value]})`,
          })
        )}
      />

      <ul className="local-watching__list">
        {visible.map((item) => {
          const { summary } = item;
          const image = summary.imageUrl;
          return (
            <li key={summary.id}>
              <PanelCard className="local-watching__card">
                <Link
                  href={summary.href}
                  className="local-watching__poster"
                  aria-label={summary.title}
                >
                  {image ? (
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="96px"
                      unoptimized={isDirectServedImageUrl(image)}
                    />
                  ) : (
                    <PosterPlaceholder title={summary.title} variant="card" />
                  )}
                </Link>
                <div className="local-watching__body">
                  <div className="local-watching__heading">
                    <h2>
                      <Link href={summary.href}>{summary.title}</Link>
                    </h2>
                    <Tag>
                      {t(LABEL_KEYS[item.status] ?? 'viewStatus.sinVer')}
                    </Tag>
                  </div>
                  {item.total > 0 && (
                    <>
                      <Progress
                        percent={Math.round((item.watched / item.total) * 100)}
                        size="small"
                        showInfo={false}
                      />
                      <span className="local-watching__count">
                        {t('localLibrary.progress', {
                          watched: item.watched,
                          total: item.total,
                        })}
                      </span>
                    </>
                  )}
                  <div className="local-watching__actions">
                    <Link href={item.nextHref}>
                      <Button type="primary" icon={<PlayCircleOutlined />}>
                        {item.next && summary.watchHref
                          ? t('localLibrary.watchChapter', {
                              code: code(item),
                            })
                          : t('watchingDashboard.openSeries')}
                      </Button>
                    </Link>
                    {item.next && item.status !== 'VISTA' && (
                      <Button
                        icon={<CheckOutlined />}
                        onClick={() => markNext(item)}
                      >
                        {t('watchingDashboard.markNextCode', {
                          code: code(item),
                        })}
                      </Button>
                    )}
                  </div>
                </div>
              </PanelCard>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
