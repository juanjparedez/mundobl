'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_CATEGORICAL_PALETTE } from '../ChartTokens';
import {
  ChartTooltip,
  type ChartTooltipFormatter,
} from '../ChartTooltip/ChartTooltip';
import './DonutChart.css';

export interface DonutChartItem {
  /** Etiqueta visible (ya traducida). */
  name: string;
  /** Valor numerico. */
  value: number;
  /** Color custom. Si no se provee, usa la paleta categorica indexada. */
  color?: string;
}

export interface DonutChartProps {
  data: DonutChartItem[];
  /** Altura en px. Default 220. */
  height?: number;
  /** Inner radius (donut hole). Default 50. */
  innerRadius?: number;
  /** Outer radius. Default 80. */
  outerRadius?: number;
  /** Total opcional para mostrar en el centro (ej. "120 series"). */
  centerLabel?: { value: number | string; sublabel?: string };
  /** Mostrar leyenda al costado/abajo (default true). */
  showLegend?: boolean;
  /** Custom formatter para tooltip. */
  tooltipFormatter?: ChartTooltipFormatter;
}

export function DonutChart({
  data,
  height = 220,
  innerRadius = 50,
  outerRadius = 80,
  centerLabel,
  showLegend = true,
  tooltipFormatter,
}: DonutChartProps) {
  return (
    <div className="mb-donut-chart">
      <div className="mb-donut-chart__chart" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              stroke="var(--bg-container)"
              strokeWidth={2}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={
                    entry.color ??
                    CHART_CATEGORICAL_PALETTE[
                      idx % CHART_CATEGORICAL_PALETTE.length
                    ]
                  }
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip formatter={tooltipFormatter} />} />
          </PieChart>
        </ResponsiveContainer>
        {centerLabel && (
          <div className="mb-donut-chart__center" aria-hidden>
            <span className="mb-donut-chart__center-value">
              {centerLabel.value}
            </span>
            {centerLabel.sublabel && (
              <span className="mb-donut-chart__center-sublabel">
                {centerLabel.sublabel}
              </span>
            )}
          </div>
        )}
      </div>
      {showLegend && (
        <ul className="mb-donut-chart__legend">
          {data.map((entry, idx) => (
            <li key={entry.name} className="mb-donut-chart__legend-item">
              <span
                className="mb-donut-chart__legend-swatch"
                style={{
                  background:
                    entry.color ??
                    CHART_CATEGORICAL_PALETTE[
                      idx % CHART_CATEGORICAL_PALETTE.length
                    ],
                }}
                aria-hidden
              />
              <span className="mb-donut-chart__legend-name">{entry.name}</span>
              <span className="mb-donut-chart__legend-value">
                {entry.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
