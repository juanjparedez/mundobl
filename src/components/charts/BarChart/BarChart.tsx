'use client';

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
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

export interface BarChartSeries {
  dataKey: string;
  name: string;
  color?: string;
}

export interface BarChartProps<TData extends Record<string, unknown>> {
  data: TData[];
  /** Key del eje categorico. */
  xAxisKey: keyof TData & string;
  /** Series a graficar (puede ser una sola). */
  series: BarChartSeries[];
  /** Altura en px o '100%' para llenar el contenedor. Default 240. */
  height?: number | string;
  /** Layout horizontal — invierte ejes (default vertical bars). */
  horizontal?: boolean;
  /** Si true, cada barra usa un color distinto de la paleta categorica.
   *  Solo aplica con una unica serie. */
  multicolor?: boolean;
  tooltipFormatter?: ChartTooltipFormatter;
  tooltipLabelFormatter?: ChartTooltipLabelFormatter;
  hideYAxis?: boolean;
  hideXAxis?: boolean;
}

export function BarChart<TData extends Record<string, unknown>>({
  data,
  xAxisKey,
  series,
  height = 240,
  horizontal = false,
  multicolor = false,
  tooltipFormatter,
  tooltipLabelFormatter,
  hideYAxis = false,
  hideXAxis = false,
}: BarChartProps<TData>) {
  return (
    <ResponsiveContainer width="100%" height={height as number | `${number}%`}>
      <RechartsBarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 12, right: 20, bottom: 8, left: 4 }}
      >
        <CartesianGrid
          stroke={CHART_TOKENS.borderSecondary}
          strokeDasharray="3 4"
          vertical={horizontal}
          horizontal={!horizontal}
        />
        {!hideXAxis &&
          (horizontal ? (
            <XAxis
              type="number"
              stroke={CHART_TOKENS.textTertiary}
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />
          ) : (
            <XAxis
              dataKey={xAxisKey as never}
              stroke={CHART_TOKENS.textTertiary}
              tickLine={false}
              axisLine={{ stroke: CHART_TOKENS.borderSecondary }}
              fontSize={11}
            />
          ))}
        {!hideYAxis &&
          (horizontal ? (
            <YAxis
              type="category"
              dataKey={xAxisKey as never}
              stroke={CHART_TOKENS.textTertiary}
              tickLine={false}
              axisLine={false}
              fontSize={11}
              width={120}
            />
          ) : (
            <YAxis
              stroke={CHART_TOKENS.textTertiary}
              tickLine={false}
              axisLine={false}
              fontSize={11}
              width={40}
            />
          ))}
        <Tooltip
          content={
            <ChartTooltip
              formatter={tooltipFormatter}
              labelFormatter={tooltipLabelFormatter}
            />
          }
          cursor={{ fill: CHART_TOKENS.primarySoft }}
        />
        {series.map((s, sIdx) => (
          <Bar
            key={s.dataKey}
            dataKey={s.dataKey}
            name={s.name}
            fill={
              s.color ??
              (sIdx === 0
                ? CHART_TOKENS.primary
                : CHART_CATEGORICAL_PALETTE[
                    sIdx % CHART_CATEGORICAL_PALETTE.length
                  ])
            }
            radius={[4, 4, 0, 0]}
          >
            {multicolor && series.length === 1
              ? data.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={
                      CHART_CATEGORICAL_PALETTE[
                        idx % CHART_CATEGORICAL_PALETTE.length
                      ]
                    }
                  />
                ))
              : null}
          </Bar>
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
