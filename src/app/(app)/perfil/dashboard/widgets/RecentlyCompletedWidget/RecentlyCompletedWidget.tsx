'use client';

import { useState } from 'react';
import { Button, Modal, Pagination } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { isDirectServedImageUrl, cardImageUrl } from '@/lib/image-helpers';
import type { ProfileData } from '../../../types';
import './RecentlyCompletedWidget.css';

export interface RecentlyCompletedWidgetProps {
  items: ProfileData['recentlyCompleted'];
}

export function RecentlyCompletedWidget({
  items,
}: RecentlyCompletedWidgetProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const renderItems = (items: RecentlyCompletedWidgetProps['items']) =>
    items.map(({ seriesId, series }) => {
      if (!series) return null;
      return (
        <li key={seriesId}>
          <Link
            href={`/series/${series.id}`}
            className="mb-recently-completed-widget__item"
          >
            <span className="mb-recently-completed-widget__cover">
              {cardImageUrl(series) ? (
                <Image
                  src={cardImageUrl(series)!}
                  alt=""
                  width={40}
                  height={56}
                  unoptimized={isDirectServedImageUrl(cardImageUrl(series))}
                />
              ) : (
                <span className="mb-recently-completed-widget__cover-placeholder" />
              )}
            </span>
            <span className="mb-recently-completed-widget__body">
              <span className="mb-recently-completed-widget__title">
                {series.title}
              </span>
              <span className="mb-recently-completed-widget__meta">
                {series.year ?? ''}
                {series.year && series.country?.name ? ' · ' : ''}
                {series.country?.name ?? ''}
              </span>
            </span>
          </Link>
        </li>
      );
    });

  return (
    <>
      <Widget
        title={t('profileDashboard.widgetRecentlyCompleted')}
        icon={<CheckCircleOutlined />}
        actions={
          items.length > 0 ? (
            <Button
              type="link"
              size="small"
              onClick={() => {
                setPage(1);
                setOpen(true);
              }}
            >
              {interpolateMessage(t('profile.overviewViewAllCount'), {
                count: String(items.length),
              })}
            </Button>
          ) : undefined
        }
        noPadding
      >
        {items.length === 0 ? (
          <EmptyState
            title={t('profileDashboard.recentlyCompletedEmpty')}
            variant="soft"
            fullHeight={false}
          />
        ) : (
          <ul className="mb-recently-completed-widget">
            {renderItems(items.slice(0, 3))}
          </ul>
        )}
      </Widget>
      <Modal
        title={t('profileDashboard.widgetRecentlyCompleted')}
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        <ul className="mb-recently-completed-widget mb-recently-completed-widget--full">
          {renderItems(items.slice((page - 1) * pageSize, page * pageSize))}
        </ul>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={items.length}
          onChange={setPage}
          showSizeChanger={false}
          hideOnSinglePage
        />
      </Modal>
    </>
  );
}
