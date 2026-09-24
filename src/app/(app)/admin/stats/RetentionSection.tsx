'use client';

import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import {
  RiseOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import {
  PanelCard,
  SectionHeader,
  StatCard,
  DataTable,
  EmptyState,
  type DataTableColumn,
} from '@/components/design-system';
import { LineChart } from '@/components/charts';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { RetentionCohort, RetentionResponse } from '@/lib/retention-stats';
import './RetentionSection.css';

/** 'YYYY-MM-DD' → 'DD/MM', para que entren 16 ticks en el eje. */
function shortWeek(week: string): string {
  return `${week.slice(8, 10)}/${week.slice(5, 7)}`;
}

function percent(part: number, total: number): string {
  if (total === 0) return '—';
  return `${Math.round((part / total) * 100)}%`;
}

export function RetentionSection() {
  const { t } = useLocale();
  const [data, setData] = useState<RetentionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch('/api/admin/stats/retention')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: RetentionResponse) => setData(json))
      .catch((err) => {
        console.error('Error loading retention stats:', err);
        setFailed(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const columns: DataTableColumn<RetentionCohort>[] = [
    {
      title: t('adminStats.retentionWeek'),
      dataIndex: 'week',
      key: 'week',
      mobile: 'title',
    },
    {
      title: t('adminStats.retentionSignups'),
      dataIndex: 'signups',
      key: 'signups',
    },
    {
      title: t('adminStats.retentionW1'),
      key: 'w1',
      render: (_: unknown, row: RetentionCohort) => (
        <span>
          {row.w1}{' '}
          <span className="retention-cohorts__pct">
            ({percent(row.w1, row.signups)})
          </span>
        </span>
      ),
    },
    {
      title: t('adminStats.retentionW2'),
      dataIndex: 'w2',
      key: 'w2',
    },
    {
      title: t('adminStats.retentionW3'),
      dataIndex: 'w3plus',
      key: 'w3plus',
    },
    {
      title: t('adminStats.retentionTrackedW0'),
      dataIndex: 'trackedW0',
      key: 'trackedW0',
    },
    {
      title: t('adminStats.retentionTrackedW1'),
      key: 'trackedW1',
      render: (_: unknown, row: RetentionCohort) => (
        <span>
          {row.trackedW1}{' '}
          <span className="retention-cohorts__pct">
            ({percent(row.trackedW1, row.signups)})
          </span>
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <section className="retention-section">
        <SectionHeader
          title={t('adminStats.retentionTitle')}
          icon={<RiseOutlined />}
        />
        <div className="retention-section__loading">
          <Spin />
        </div>
      </section>
    );
  }

  if (failed || !data) {
    return (
      <section className="retention-section">
        <SectionHeader
          title={t('adminStats.retentionTitle')}
          icon={<RiseOutlined />}
        />
        <PanelCard>
          <EmptyState
            title={t('adminStats.retentionError')}
            fullHeight={false}
          />
        </PanelCard>
      </section>
    );
  }

  const cohorts = data.cohorts.filter((row) => row.signups > 0);

  return (
    <section className="retention-section">
      <SectionHeader
        title={t('adminStats.retentionTitle')}
        icon={<RiseOutlined />}
      />

      <div className="retention-section__totals">
        <StatCard
          label={t('adminStats.retentionTotalUsers')}
          value={data.totals.usersNonAdmin.toLocaleString()}
          icon={<TeamOutlined />}
        />
        <StatCard
          label={t('adminStats.retentionUsersTracking')}
          value={data.totals.usersWithAnyTracking.toLocaleString()}
          hint={percent(
            data.totals.usersWithAnyTracking,
            data.totals.usersNonAdmin
          )}
          icon={<CheckCircleOutlined />}
        />
        <StatCard
          label={t('adminStats.retentionTrackers7d')}
          value={data.totals.trackersLast7d.toLocaleString()}
          icon={<ThunderboltOutlined />}
        />
        <StatCard
          label={t('adminStats.retentionTrackers30d')}
          value={data.totals.trackersLast30d.toLocaleString()}
          icon={<CalendarOutlined />}
        />
      </div>

      <div className="retention-section__panels">
        <PanelCard
          header={
            <SectionHeader
              title={t('adminStats.retentionCohorts')}
              size="sm"
              as="h3"
            />
          }
        >
          <DataTable
            dataSource={cohorts}
            columns={columns}
            rowKey="week"
            pageSize={false}
            size="small"
          />
        </PanelCard>

        <PanelCard
          header={
            <SectionHeader
              title={t('adminStats.retentionWau')}
              size="sm"
              as="h3"
            />
          }
        >
          <LineChart
            data={data.wau}
            xAxisKey="week"
            series={[
              {
                dataKey: 'visitors',
                name: t('adminStats.retentionVisitors'),
              },
              {
                dataKey: 'trackers',
                name: t('adminStats.retentionTrackers'),
              },
            ]}
            height={260}
            smooth
            xAxisTickFormatter={(value) => shortWeek(String(value))}
            tooltipFormatter={(value, name) => [
              value === undefined ? '' : String(value),
              name,
            ]}
            tooltipLabelFormatter={(label) =>
              label === undefined ? '' : String(label)
            }
          />
        </PanelCard>
      </div>
    </section>
  );
}
