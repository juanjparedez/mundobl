'use client';

import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { LineChart } from '@/components/charts';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './ActivityChartWidget.css';

interface DayPoint {
  date: string;
  views: number;
  actions: number;
}

/** Widget "Recursos de actividad" del mock admin.png — chart de
 *  page views y actions admin por dia (ultimos 14 dias). Fetch a
 *  /api/admin/activity-by-day. Usa LineChart wrapper del proyecto
 *  con paleta categorica del skin premium. */
export function ActivityChartWidget() {
  const { t, locale } = useLocale();
  const [series, setSeries] = useState<DayPoint[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/activity-by-day')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { series?: DayPoint[] } | null) => {
        if (cancelled) return;
        if (payload?.series) setSeries(payload.series);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasData = series.some((d) => d.views > 0 || d.actions > 0);

  // Formatter del label del eje X — muestra DD/MM en lugar del ISO
  // YYYY-MM-DD para mas compacto. Recibe el valor crudo del date.
  const formatDateShort = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
    } catch {
      return iso;
    }
  };

  // Recharts no permite formatter en XAxis directo via prop estandar,
  // entonces transformamos los data points pre-render.
  const formattedData = series.map((d) => ({
    ...d,
    dateShort: formatDateShort(d.date),
  }));

  return (
    <Widget
      title={t('activityChart.title')}
      icon={<LineChartOutlined />}
      noPadding
    >
      {!loaded ? (
        <div className="mb-activity-chart__loading">
          <Spin size="small" />
        </div>
      ) : !hasData ? (
        <EmptyState
          title={t('activityChart.empty')}
          variant="soft"
          fullHeight={false}
        />
      ) : (
        <div className="mb-activity-chart">
          <LineChart
            data={formattedData}
            xAxisKey="dateShort"
            series={[
              { dataKey: 'views', name: t('activityChart.seriesViews') },
              { dataKey: 'actions', name: t('activityChart.seriesActions') },
            ]}
            height="100%"
            smooth
          />
        </div>
      )}
    </Widget>
  );
}
