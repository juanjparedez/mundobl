/**
 * Chart wrappers de MundoBL.
 *
 * Convencion:
 * - Todos consumen tokens (--primary-color, --text-*, etc) o la paleta
 *   categorica fija (CHART_CATEGORICAL_PALETTE) para series multiple.
 * - Cero strings hardcodeados visibles: cada nombre/etiqueta llega ya
 *   traducido por la pagina via t().
 * - Comparten ChartTooltip para look consistente.
 *
 * Wrappers:
 * - LineChart: serie temporal, multiple series, smooth opcional.
 * - BarChart: barras verticales/horizontales, opcional multicolor para 1 serie.
 * - DonutChart: distribucion con leyenda, opcional centerLabel.
 * - HeatmapCalendar: heatmap tipo GitHub para fechas con actividad.
 */

export { LineChart } from './LineChart/LineChart';
export type { LineChartProps, LineChartSeries } from './LineChart/LineChart';

export { BarChart } from './BarChart/BarChart';
export type { BarChartProps, BarChartSeries } from './BarChart/BarChart';

export { DonutChart } from './DonutChart/DonutChart';
export type { DonutChartProps, DonutChartItem } from './DonutChart/DonutChart';

export { HeatmapCalendar } from './HeatmapCalendar/HeatmapCalendar';
export type { HeatmapCalendarProps } from './HeatmapCalendar/HeatmapCalendar';

export { ChartTooltip } from './ChartTooltip/ChartTooltip';
export { CHART_TOKENS, CHART_CATEGORICAL_PALETTE } from './ChartTokens';
