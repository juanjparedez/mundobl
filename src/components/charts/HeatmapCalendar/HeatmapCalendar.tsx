'use client';

import { useMemo } from 'react';
import { Tooltip } from 'antd';
import './HeatmapCalendar.css';

export interface HeatmapCalendarProps {
  /** Lista de fechas ISO (YYYY-MM-DD) donde hubo actividad. Las repeticiones
   *  cuentan: ['2026-05-01', '2026-05-01', '2026-05-02'] da intensidad 2 en 1, 1 en 2. */
  values: string[];
  /** Numero de semanas hacia atras desde hoy. Default 26 (~6 meses). */
  weeks?: number;
  /** Color base — default `--primary-color`. */
  baseColor?: string;
}

interface DayCell {
  date: string;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildGrid(values: string[], weeks: number): DayCell[][] {
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }

  const max = Math.max(1, ...counts.values());
  const today = new Date();
  // Anchor: domingo de la semana actual
  const day = today.getDay();
  const anchor = new Date(today);
  anchor.setDate(today.getDate() + (6 - day));

  const cols: DayCell[][] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const col: DayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(anchor);
      date.setDate(anchor.getDate() - w * 7 - (6 - d));
      const iso = toIsoDate(date);
      const count = counts.get(iso) ?? 0;
      const intensity =
        count === 0
          ? 0
          : count <= max * 0.25
            ? 1
            : count <= max * 0.5
              ? 2
              : count <= max * 0.75
                ? 3
                : 4;
      col.push({ date: iso, count, intensity });
    }
    cols.push(col);
  }
  return cols;
}

export function HeatmapCalendar({
  values,
  weeks = 26,
  baseColor,
}: HeatmapCalendarProps) {
  const grid = useMemo(() => buildGrid(values, weeks), [values, weeks]);

  const baseStyle = baseColor
    ? ({ '--mb-heatmap-base': baseColor } as React.CSSProperties)
    : undefined;

  return (
    <div className="mb-heatmap-calendar" style={baseStyle}>
      <div className="mb-heatmap-calendar__grid" role="img">
        {grid.map((week, wIdx) => (
          <div key={wIdx} className="mb-heatmap-calendar__week">
            {week.map((cell) => (
              <Tooltip
                key={cell.date}
                title={
                  cell.count === 0 ? cell.date : `${cell.date} — ${cell.count}`
                }
              >
                <span
                  className={`mb-heatmap-calendar__cell mb-heatmap-calendar__cell--lvl-${cell.intensity}`}
                />
              </Tooltip>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
