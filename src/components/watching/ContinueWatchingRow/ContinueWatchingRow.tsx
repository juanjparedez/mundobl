'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { PlayCircleFilled } from '@ant-design/icons';
import { PosterPlaceholder } from '@/components/common/PosterPlaceholder/PosterPlaceholder';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useLocalLibrary } from '@/hooks/useLocalLibrary';
import { isDirectServedImageUrl } from '@/lib/image-helpers';
import { ROUTES } from '@/constants/navigation';
import './ContinueWatchingRow.css';

const MAX_ITEMS = 6;
const ACTIVE_STATUSES = new Set(['VIENDO', 'RETOMAR']);

/**
 * "Seguir viendo" en la home sin cuenta: lo que se dejo a mitad en este
 * navegador, a un toque del proximo capitulo. Con cuenta no hace falta: la
 * home ya lleva a /watching (LoggedInHomeRedirect).
 */
export function ContinueWatchingRow() {
  const { t } = useLocale();
  const { status } = useSession();
  const { items } = useLocalLibrary(status === 'unauthenticated');
  const active = items
    .filter((item) => item.next && ACTIVE_STATUSES.has(item.status))
    .slice(0, MAX_ITEMS);

  if (status !== 'unauthenticated' || active.length === 0) return null;

  return (
    <section
      className="continue-watching"
      aria-labelledby="continue-watching-title"
    >
      <div className="continue-watching__header">
        <h2 id="continue-watching-title">{t('watchingDashboard.watchNow')}</h2>
        <Link href={ROUTES.WATCHING}>{t('localLibrary.seeAll')}</Link>
      </div>
      <ul className="continue-watching__list">
        {active.map((item) => {
          const { summary, next } = item;
          const code = next
            ? t('progressStepper.chapterShort', {
                season: next.seasonNumber,
                n: next.number,
              })
            : '';
          return (
            <li key={summary.id}>
              <Link href={item.nextHref} className="continue-watching__item">
                <span className="continue-watching__poster">
                  {summary.imageUrl ? (
                    <Image
                      src={summary.imageUrl}
                      alt=""
                      fill
                      sizes="140px"
                      unoptimized={isDirectServedImageUrl(summary.imageUrl)}
                    />
                  ) : (
                    <PosterPlaceholder title={summary.title} variant="card" />
                  )}
                  <PlayCircleFilled
                    className="continue-watching__play"
                    aria-hidden
                  />
                </span>
                <span className="continue-watching__title">
                  {summary.title}
                </span>
                <span className="continue-watching__next">
                  {summary.watchHref
                    ? t('localLibrary.watchChapter', { code })
                    : t('localLibrary.progress', {
                        watched: item.watched,
                        total: item.total,
                      })}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
