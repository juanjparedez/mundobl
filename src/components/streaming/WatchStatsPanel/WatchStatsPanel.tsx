'use client';

import Link from 'next/link';
import { Alert } from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  HeartOutlined,
  ExportOutlined,
  EyeOutlined,
  LineChartOutlined,
  VideoCameraOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { StatCard, PanelCard, EmptyState } from '@/components/design-system';
import { LineChart } from '@/components/charts';
import type { WatchSectionStats } from '@/lib/series-activity-stats';
import './WatchStatsPanel.css';

export interface WatchStatsPanelLabels {
  sectionTitle: string;
  sectionSubtitle: string;
  playStarts: string;
  completedPlays: string;
  completionRate: string;
  completionRateHint: string;
  communityLikes: string;
  outboundClicks: string;
  outboundClicksHint: string;
  playerVisits: string;
  dailyTrendTitle: string;
  startsLabel: string;
  completionsLabel: string;
  topSeriesTitle: string;
  topSeriesEmpty: string;
  startsUnit: string;
  completionsUnit: string;
  transparencyBadge: string;
  transparencyNote: string;
  privacyLinkText: string;
}

export interface WatchStatsPanelProps {
  stats: WatchSectionStats;
  labels: WatchStatsPanelLabels;
  formatNumber: (n: number) => string;
}

export function WatchStatsPanel({
  stats,
  labels,
  formatNumber,
}: WatchStatsPanelProps) {
  const { totals, playsByDay, topSeries } = stats;

  return (
    <section className="watch-stats-panel" aria-label={labels.sectionTitle}>
      <header className="watch-stats-panel__header">
        <h2 className="watch-stats-panel__title">
          <PlayCircleOutlined aria-hidden /> {labels.sectionTitle}
        </h2>
        <p className="watch-stats-panel__subtitle">{labels.sectionSubtitle}</p>
      </header>

      {/* KPI Grid con StatCards */}
      <div className="watch-stats-panel__kpi-grid">
        <StatCard
          label={labels.playStarts}
          value={formatNumber(totals.playStarts)}
          icon={<PlayCircleOutlined />}
        />
        <StatCard
          label={labels.completedPlays}
          value={formatNumber(totals.completedPlays)}
          hint={labels.completionRateHint}
          icon={<CheckCircleOutlined />}
        />
        <StatCard
          label={labels.completionRate}
          value={`${totals.completionRate}%`}
          icon={<RiseOutlined />}
        />
        <StatCard
          label={labels.communityLikes}
          value={formatNumber(totals.communityLikes)}
          icon={<HeartOutlined />}
        />
        <StatCard
          label={labels.outboundClicks}
          value={formatNumber(totals.outboundClicks)}
          hint={labels.outboundClicksHint}
          icon={<ExportOutlined />}
        />
        <StatCard
          label={labels.playerVisits}
          value={formatNumber(totals.playerVisits)}
          icon={<EyeOutlined />}
        />
      </div>

      {/* Fila con Gráfico de Tendencia y Top Series */}
      <div className="watch-stats-panel__rows">
        <PanelCard
          header={
            <h3 className="app-panel__title">
              <LineChartOutlined aria-hidden /> {labels.dailyTrendTitle}
            </h3>
          }
        >
          <LineChart
            data={playsByDay}
            xAxisKey="day"
            series={[
              {
                dataKey: 'starts',
                name: labels.startsLabel,
              },
              {
                dataKey: 'completions',
                name: labels.completionsLabel,
              },
            ]}
            height={240}
            smooth
            xAxisTickFormatter={(value) => String(value).slice(5)}
          />
        </PanelCard>

        <PanelCard
          header={
            <h3 className="app-panel__title">
              <VideoCameraOutlined aria-hidden /> {labels.topSeriesTitle}
            </h3>
          }
        >
          {topSeries.length === 0 ? (
            <EmptyState title={labels.topSeriesEmpty} />
          ) : (
            <ol className="watch-stats-panel__top-list">
              {topSeries.map((item, index) => (
                <li key={item.seriesId} className="watch-stats-panel__top-item">
                  <span className="watch-stats-panel__top-pos">
                    {index + 1}
                  </span>
                  <div className="watch-stats-panel__top-info">
                    <Link
                      href={item.href}
                      className="watch-stats-panel__top-link"
                    >
                      {item.title}
                    </Link>
                    <span className="watch-stats-panel__top-counts">
                      <span>
                        {formatNumber(item.starts)} {labels.startsUnit}
                      </span>
                      <span>·</span>
                      <span>
                        {formatNumber(item.completions)}{' '}
                        {labels.completionsUnit}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </PanelCard>
      </div>

      {/* Alerta de Privacidad y Transparencia */}
      <Alert
        type="info"
        showIcon
        icon={<SafetyCertificateOutlined />}
        message={labels.transparencyBadge}
        description={
          <div>
            <span>{labels.transparencyNote}</span>
            <Link
              href="/privacidad"
              className="watch-stats-panel__privacy-link"
            >
              {labels.privacyLinkText}
            </Link>
          </div>
        }
        className="watch-stats-panel__alert"
      />
    </section>
  );
}
