'use client';

import { useEffect, useState } from 'react';
import { Spin, Tag } from 'antd';
import { BugOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './MyCasesWidget.css';

interface FeedbackCase {
  id: number;
  title: string;
  status: string;
  priority: string;
  type: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'blue',
  IN_PROGRESS: 'orange',
  COMPLETED: 'green',
  REJECTED: 'red',
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'orange',
  CRITICAL: 'red',
};

/** Vista compact de los casos de feedback del user — top 8 ordenados por
 *  createdAt desc. Lista vertical con title + status + priority. El detalle
 *  completo + edicion + comments vive en /feedback (link al footer del
 *  widget). Antes este widget montaba MyCasesSection entero con Ant Table
 *  y Modals, que desbordaba el widget cell — single-purpose ahora. */
export function MyCasesWidget() {
  const { t } = useLocale();
  const [cases, setCases] = useState<FeedbackCase[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/feedback/my-cases?pageSize=8&page=1')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { cases?: FeedbackCase[] } | null) => {
        if (cancelled) return;
        if (data?.cases) setCases(data.cases);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Widget
      title={t('profileDashboard.widgetMyCases')}
      icon={<BugOutlined />}
      noPadding
      fade={cases.length > 5}
    >
      {!loaded ? (
        <div className="mb-my-cases-widget__loading">
          <Spin size="small" />
        </div>
      ) : cases.length === 0 ? (
        <EmptyState
          title={t('profileDashboard.widgetMyCasesEmpty')}
          variant="soft"
          fullHeight={false}
        />
      ) : (
        <ul className="mb-my-cases-widget__list">
          {cases.map((c) => (
            <li key={c.id} className="mb-my-cases-widget__item">
              <Link
                href={`/feedback?case=${c.id}`}
                className="mb-my-cases-widget__link"
              >
                <span className="mb-my-cases-widget__title" title={c.title}>
                  {c.title}
                </span>
                <span className="mb-my-cases-widget__tags">
                  <Tag color={STATUS_COLORS[c.status] ?? 'default'}>
                    {c.status}
                  </Tag>
                  {PRIORITY_COLORS[c.priority] && (
                    <Tag color={PRIORITY_COLORS[c.priority]}>{c.priority}</Tag>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  );
}
