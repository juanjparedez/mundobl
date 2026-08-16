'use client';

import { useEffect, useState } from 'react';
import { Segmented, Spin } from 'antd';
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

type Period = 'week' | 'month' | 'year';

/** Widget "Recursos de actividad" del mock admin.png — chart de
 *  page views y actions admin, con selector Semana/Mes/Año. Fetch a
 *  /api/admin/activity-by-day?range=. Usa LineChart wrapper del proyecto
 *  con paleta categorica del skin premium. */
export function ActivityChartWidget() {
  const { t, locale } = useLocale();
  const [period, setPeriod] = useState<Period>('month');
  const [series, setSeries] = useState<DayPoint[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // No reseteamos `loaded` a false acá: al cambiar de período dejamos el
    // chart anterior visible hasta que llegan los datos nuevos (transición
    // suave, sin parpadeo del spinner) en vez de un setState sincrónico al
    // toque del efecto.
    fetch(`/api/admin/activity-by-day?range=${period}`)
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
  }, [period]);

  const hasData = series.some((d) => d.views > 0 || d.actions > 0);

  // En "year" el bucket es mensual (date = "YYYY-MM"), en el resto es
  // diario (date = "YYYY-MM-DD") — parsear distinto segun granularidad.
  const parseBucketDate = (raw: string) =>
    period === 'year' ? new Date(`${raw}-01`) : new Date(raw);

  // Formatter del label del eje X — compacto (DD/MM, o abreviatura del
  // mes en la vista anual).
  const formatDateShort = (raw: string) => {
    try {
      const d = parseBucketDate(raw);
      return period === 'year'
        ? d.toLocaleDateString(locale, { month: 'short' })
        : d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
    } catch {
      return raw;
    }
  };

  // Label del tooltip: version completa y legible (a diferencia del tick
  // compacto del eje X) para que quede claro a que dia/mes corresponde
  // cada punto sin tener que adivinar el formato DD/MM.
  const formatTooltipLabel = (raw: string | number | undefined) => {
    if (raw === undefined) return '';
    try {
      const d = parseBucketDate(String(raw));
      return period === 'year'
        ? d.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
        : d.toLocaleDateString(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          });
    } catch {
      return String(raw);
    }
  };

  // Recharts no permite formatter en XAxis directo via prop estandar,
  // entonces transformamos los data points pre-render.
  const formattedData = series.map((d) => ({
    ...d,
    dateShort: formatDateShort(d.date),
  }));

  const rangeOptions = [
    { label: t('activityChart.rangeWeek'), value: 'week' as const },
    { label: t('activityChart.rangeMonth'), value: 'month' as const },
    { label: t('activityChart.rangeYear'), value: 'year' as const },
  ];

  const captionKey =
    period === 'week'
      ? 'activityChart.captionWeek'
      : period === 'year'
        ? 'activityChart.captionYear'
        : 'activityChart.captionMonth';

  return (
    <Widget
      title={t('activityChart.title')}
      icon={<LineChartOutlined />}
      noPadding
      actions={
        <Segmented
          size="small"
          value={period}
          onChange={(v) => setPeriod(v as Period)}
          options={rangeOptions}
          aria-label={t('activityChart.rangeAria')}
        />
      }
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
          <p className="mb-activity-chart__caption">{t(captionKey)}</p>
          <div className="mb-activity-chart__chart-wrap">
            <LineChart
              data={formattedData}
              xAxisKey="dateShort"
              series={[
                { dataKey: 'views', name: t('activityChart.seriesViews') },
                { dataKey: 'actions', name: t('activityChart.seriesActions') },
              ]}
              height="100%"
              smooth
              tooltipLabelFormatter={formatTooltipLabel}
            />
          </div>
        </div>
      )}
    </Widget>
  );
}
