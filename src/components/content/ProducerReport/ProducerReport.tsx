'use client';

import Link from 'next/link';
import { Button, Segmented, Table } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { ReportStatus } from '@/components/content/ReportStatus/ReportStatus';
import { PanelCard, StatCard } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import { getSeriesUrl } from '@/lib/slug';
import {
  PRODUCER_REPORT_WINDOWS,
  type ProducerReport as Report,
} from '@/lib/producer-report-shape';
import './ProducerReport.css';

/**
 * Los numeros que se le muestran a una productora o plataforma para pedir
 * una serie o una licencia. Todo agregado y anonimo; el texto copiable es
 * para pegar en un mail.
 */
export function ProducerReport({ report }: { report: Report }) {
  const { t, locale } = useLocale();
  const message = useMessage();
  const number = (value: number) => value.toLocaleString(locale);

  const summary = [
    t('producerReport.copyHeader', {
      days: report.days,
      from: report.from,
      to: report.to,
    }),
    t('producerReport.copyAccounts', {
      accounts: number(report.accounts),
      active: number(report.activeAccounts),
    }),
    t('reportStatus.copyMarkings', {
      chapters: number(report.totals.chapters),
      browser: number(report.chaptersBySource.browser),
    }),
    ...((report.totals.openVer ?? 0) > 0 ||
    (report.totals.playStarts ?? 0) > 0 ||
    (report.totals.outboundClicks ?? 0) > 0
      ? [
          [
            `${t('producerReport.openVer')}: ${number(report.totals.openVer ?? 0)}`,
            `${t('producerReport.playStarts')}: ${number(report.totals.playStarts ?? 0)}`,
            `${t('publicWatchStats.completedPlays')}: ${number(report.totals.views)}`,
            `${t('producerReport.likes')}: ${number(report.totals.likes ?? 0)}`,
            `${t('producerReport.outboundClicks')}: ${number(report.totals.outboundClicks ?? 0)}`,
          ].join(' · '),
        ]
      : []),
    t('reportStatus.producerScope'),
    ...report.series.slice(0, 10).map((row) =>
      t('reportStatus.copySeries', {
        title: row.title,
        chapters: number(row.chapters),
        trackers: number(row.trackers),
      })
    ),
  ].join('\n');

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      message.success(t('producerReport.copied'));
    } catch {
      message.error(t('producerReport.copyFailed'));
    }
  };

  const activityColumns = [
    {
      title: t('reportStatus.markings'),
      dataIndex: 'chapters',
      render: number,
    },
    {
      title: t('publicWatchStats.completedPlays'),
      dataIndex: 'views',
      render: number,
    },
    { title: t('producerReport.wants'), dataIndex: 'wants', render: number },
    {
      title: t('producerReport.finishes'),
      dataIndex: 'finishes',
      render: number,
    },
  ];

  return (
    <section className="producer-report">
      <PanelCard>
        <div className="producer-report__header">
          <div>
            <h1>{t('producerReport.title')}</h1>
            <p>{t('producerReport.intro')}</p>
          </div>
          <div className="producer-report__controls">
            <Segmented
              value={report.days}
              options={PRODUCER_REPORT_WINDOWS.map((days) => ({
                value: days,
                label: (
                  <Link href={`/admin/informe-productoras?dias=${days}`}>
                    {t('producerReport.window', { days })}
                  </Link>
                ),
              }))}
            />
            <Button icon={<CopyOutlined />} onClick={() => void copySummary()}>
              {t('producerReport.copy')}
            </Button>
          </div>
        </div>
        <ReportStatus
          generatedAt={report.generatedAt}
          generatedLabel={t('reportStatus.generated')}
          refreshLabel={t('trackingHistory.refresh')}
          scope={t('reportStatus.producerScope')}
        />
        <div className="producer-report__stats">
          <StatCard
            label={t('producerReport.accounts')}
            value={number(report.accounts)}
          />
          <StatCard
            label={t('producerReport.activeAccounts')}
            value={number(report.activeAccounts)}
          />
          <StatCard
            label={t('reportStatus.markings')}
            value={number(report.totals.chapters)}
            hint={t('producerReport.chaptersHint', {
              account: number(report.chaptersBySource.account),
              browser: number(report.chaptersBySource.browser),
            })}
          />
          <StatCard
            label={t('producerReport.wants')}
            value={number(report.totals.wants)}
          />
        </div>
        <p className="producer-report__note">{t('producerReport.privacy')}</p>
      </PanelCard>

      <PanelCard>
        <h2>{t('producerReport.verFunnelTitle')}</h2>
        <div className="producer-report__stats">
          <StatCard
            label={t('producerReport.openVer')}
            value={number(report.totals.openVer ?? 0)}
          />
          <StatCard
            label={t('producerReport.playStarts')}
            value={number(report.totals.playStarts ?? 0)}
          />
          <StatCard
            label={t('publicWatchStats.completedPlays')}
            value={number(report.totals.views)}
          />
          <StatCard
            label={t('producerReport.likes')}
            value={number(report.totals.likes ?? 0)}
          />
          <StatCard
            label={t('producerReport.outboundClicks')}
            value={number(report.totals.outboundClicks ?? 0)}
          />
        </div>
        <p className="producer-report__note">
          {t('producerReport.verFunnelHint')}
        </p>
      </PanelCard>

      {/* Interno, no va en el texto copiable: es para saber si el aviso de
          estreno convierte, no un numero para una productora. */}
      <PanelCard>
        <h2>{t('airingAlert.funnelTitle')}</h2>
        <div className="producer-report__stats">
          <StatCard
            label={t('airingAlert.funnelOffers')}
            value={number(report.alerts.offers)}
          />
          <StatCard
            label={t('airingAlert.funnelClicks')}
            value={number(report.alerts.clicks)}
          />
          <StatCard
            label={t('airingAlert.funnelActivated')}
            value={number(report.alerts.activated)}
          />
        </div>
        <p className="producer-report__note">{t('airingAlert.funnelHint')}</p>
      </PanelCard>

      <PanelCard>
        <h2>{t('producerReport.bySeries')}</h2>
        <Table
          dataSource={report.series}
          rowKey="seriesId"
          pagination={false}
          scroll={{ x: true }}
          columns={[
            {
              title: t('producerReport.series'),
              dataIndex: 'title',
              render: (title: string, row) => (
                <Link href={getSeriesUrl(row.seriesId, title)}>{title}</Link>
              ),
            },
            {
              title: t('producerReport.channel'),
              dataIndex: 'channel',
              render: (channel: string | null) => channel ?? '—',
            },
            ...activityColumns,
            {
              title: t('producerReport.trackers'),
              dataIndex: 'trackers',
              render: number,
            },
          ]}
        />
      </PanelCard>

      <div className="producer-report__row">
        <PanelCard>
          <h2>{t('producerReport.byChannel')}</h2>
          <Table
            dataSource={report.channels}
            rowKey="channel"
            pagination={false}
            scroll={{ x: true }}
            columns={[
              { title: t('producerReport.channel'), dataIndex: 'channel' },
              {
                title: t('producerReport.seriesCount'),
                dataIndex: 'series',
                render: number,
              },
              ...activityColumns,
            ]}
          />
        </PanelCard>
        <PanelCard>
          <h2>{t('producerReport.byCountry')}</h2>
          <Table
            dataSource={report.countries}
            rowKey="country"
            pagination={false}
            columns={[
              {
                title: t('producerReport.country'),
                dataIndex: 'country',
                render: (country: string) =>
                  country || t('producerReport.unknownCountry'),
              },
              {
                title: t('reportStatus.markings'),
                dataIndex: 'chapters',
                render: number,
              },
            ]}
          />
        </PanelCard>
        <PanelCard>
          <h2>{t('producerReport.outbound')}</h2>
          <Table
            dataSource={report.outbound}
            rowKey="platform"
            pagination={false}
            columns={[
              { title: t('producerReport.platform'), dataIndex: 'platform' },
              {
                title: t('producerReport.clicks'),
                dataIndex: 'clicks',
                render: number,
              },
            ]}
          />
        </PanelCard>
        <PanelCard>
          <h2>{t('producerReport.trafficSectionTitle')}</h2>
          <Table
            dataSource={report.trafficBySection ?? []}
            rowKey="section"
            pagination={false}
            columns={[
              {
                title: t('producerReport.trafficSection'),
                dataIndex: 'section',
              },
              {
                title: t('producerReport.trafficViews'),
                dataIndex: 'views',
                render: number,
              },
            ]}
          />
        </PanelCard>
      </div>
    </section>
  );
}
