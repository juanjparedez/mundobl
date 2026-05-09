'use client';

import './ChartTooltip.css';

/** Funciones de formato — value puede ser undefined porque Recharts las
 *  invoca con la entry parcial mientras anima/highlightea. */
export type ChartTooltipFormatter = (
  value: number | string | undefined,
  name: string
) => [string, string];

export type ChartTooltipLabelFormatter = (
  label: number | string | undefined
) => string;

/** Shape minimo del payload de Recharts que necesitamos. Usamos un tipo local
 *  en lugar de TooltipProps para no atarse a internals de la lib que cambian
 *  entre versiones. */
interface ChartTooltipPayloadEntry {
  value?: number | string;
  name?: string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: readonly ChartTooltipPayloadEntry[];
  label?: number | string;
  formatter?: ChartTooltipFormatter;
  labelFormatter?: ChartTooltipLabelFormatter;
}

/**
 * Tooltip premium reutilizable para todos los chart wrappers.
 * Mantiene una estetica consistente con la skin/tokens del proyecto.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="mb-chart-tooltip">
      {label !== undefined && (
        <div className="mb-chart-tooltip__label">
          {labelFormatter ? labelFormatter(label) : String(label)}
        </div>
      )}
      <ul className="mb-chart-tooltip__list">
        {payload.map((entry, idx) => {
          const value = entry.value;
          const name = entry.name ?? '';
          const [displayValue, displayName] = formatter
            ? formatter(value, name)
            : [value === undefined ? '' : String(value), name];
          return (
            <li key={`${name}-${idx}`} className="mb-chart-tooltip__item">
              <span
                className="mb-chart-tooltip__swatch"
                style={{ background: String(entry.color) }}
                aria-hidden
              />
              {displayName && (
                <span className="mb-chart-tooltip__name">{displayName}</span>
              )}
              <span className="mb-chart-tooltip__value">{displayValue}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
