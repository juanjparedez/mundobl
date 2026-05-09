'use client';

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_CATEGORICAL_PALETTE, CHART_TOKENS } from '../ChartTokens';
import {
  ChartTooltip,
  type ChartTooltipFormatter,
  type ChartTooltipLabelFormatter,
} from '../ChartTooltip/ChartTooltip';

export interface LineChartSeries {
  /** Key dentro de cada item de data (ej. 'watched', 'rated'). */
  dataKey: string;
  /** Texto visible en tooltip (ya traducido). */
  name: string;
  /** Color stroke. Default: paleta categorica indexada. */
  color?: string;
}

export interface LineChartProps<TData extends Record<string, unknown>> {
  /** Items con valores por dataKey y un eje X comun. */
  data: TData[];
  /** Key del eje X. */
  xAxisKey: keyof TData & string;
  /** Series a graficar. */
  series: LineChartSeries[];
  /** Altura del chart. Numero (px) o '100%' para llenar el contenedor.
   *  Default 240. Cuando es '100%', el padre debe tener una altura definida. */
  height?: number | string;
  /** Si true, suaviza la linea con monotone curve. */
  smooth?: boolean;
  /** Custom formatter para tooltip. */
  tooltipFormatter?: ChartTooltipFormatter;
  /** Custom formatter para el label del tooltip (eje X). */
  tooltipLabelFormatter?: ChartTooltipLabelFormatter;
  /** Oculta los ticks del eje Y. */
  hideYAxis?: boolean;
  /** Oculta los ticks del eje X. */
  hideXAxis?: boolean;
}

/** LineChart wrapper usando tokens premium + paleta categorica. */
export function LineChart<TData extends Record<string, unknown>>({
  data,
  xAxisKey,
  series,
  height = 240,
  smooth = true,
  tooltipFormatter,
  tooltipLabelFormatter,
  hideYAxis = false,
  hideXAxis = false,
}: LineChartProps<TData>) {
  return (
    <ResponsiveContainer width="100%" height={height as number | `${number}%`}>
      <RechartsLineChart
        data={data}
        margin={{ top: 12, right: 20, bottom: 8, left: 4 }}
      >
        <CartesianGrid
          stroke={CHART_TOKENS.borderSecondary}
          strokeDasharray="3 4"
          vertical={false}
        />
        {!hideXAxis && (
          <XAxis
            dataKey={xAxisKey as never}
            stroke={CHART_TOKENS.textTertiary}
            tickLine={false}
            axisLine={{ stroke: CHART_TOKENS.borderSecondary }}
            fontSize={11}
          />
        )}
        {!hideYAxis && (
          <YAxis
            stroke={CHART_TOKENS.textTertiary}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={40}
          />
        )}
        <Tooltip
          content={
            <ChartTooltip
              formatter={tooltipFormatter}
              labelFormatter={tooltipLabelFormatter}
            />
          }
          cursor={{ stroke: CHART_TOKENS.primarySoft, strokeWidth: 1 }}
        />
        {series.map((s, idx) => (
          <Line
            key={s.dataKey}
            type={smooth ? 'monotone' : 'linear'}
            dataKey={s.dataKey}
            name={s.name}
            stroke={
              s.color ??
              (idx === 0
                ? CHART_TOKENS.primary
                : CHART_CATEGORICAL_PALETTE[
                    idx % CHART_CATEGORICAL_PALETTE.length
                  ])
            }
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
