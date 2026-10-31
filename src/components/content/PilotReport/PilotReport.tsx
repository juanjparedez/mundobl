'use client';
import { ReportStatus } from '@/components/content/ReportStatus/ReportStatus';
import { Table } from 'antd';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { PanelCard } from '@/components/design-system/PanelCard/PanelCard';
import './PilotReport.css';
interface Row {
  day: string;
  placement: string;
  clicks: number;
}
export function PilotReport({
  rows,
  generatedAt,
}: {
  rows: Row[];
  generatedAt?: string;
}) {
  const { t } = useLocale();
  return (
    <section className="pilot-report">
      <PanelCard>
        <h1>{t('editorial.pilot')}</h1>
        <p>{t('editorial.pilotNotice')}</p>
        <ReportStatus
          generatedAt={generatedAt}
          generatedLabel={t('reportStatus.generated')}
          refreshLabel={t('trackingHistory.refresh')}
          scope={t('reportStatus.pilotScope')}
        />
        <p>{t('editorial.privacy')}</p>
        <Table
          dataSource={rows}
          rowKey={(row) => `${row.day}:${row.placement}`}
          pagination={{ pageSize: 20 }}
          columns={[
            { title: t('editorial.day'), dataIndex: 'day' },
            {
              title: t('editorial.pilot'),
              dataIndex: 'placement',
              render: (value: string) =>
                value === 'series'
                  ? t('editorial.series')
                  : t('editorial.platforms'),
            },
            { title: t('editorial.clicks'), dataIndex: 'clicks' },
          ]}
        />
      </PanelCard>
    </section>
  );
}
