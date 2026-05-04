'use client';

import { ReactNode } from 'react';
import { Rate } from 'antd';
import './CategoryRater.css';

interface CategoryRaterProps {
  label: string;
  icon?: ReactNode;
  // Valor en escala 1-10 (mapea internamente a 5 estrellas con medio paso).
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  // Tono visual: por default neutral. 'primary' para "tu puntuacion".
  tone?: 'neutral' | 'primary' | 'gold';
}

export function CategoryRater({
  label,
  icon,
  value,
  onChange,
  readonly = false,
  tone = 'neutral',
}: CategoryRaterProps) {
  const stars = value > 0 ? value / 2 : 0;
  const display = value > 0 ? value.toString() : '–';

  return (
    <div className={`category-rater category-rater--${tone}`}>
      <div className="category-rater__head">
        <span className="category-rater__label">
          {icon && <span className="category-rater__icon">{icon}</span>}
          {label}
        </span>
        <span className="category-rater__score">
          {display}
          <span className="category-rater__score-max">/10</span>
        </span>
      </div>
      <Rate
        count={5}
        value={stars}
        allowHalf
        disabled={readonly}
        onChange={(v) =>
          onChange?.(Math.max(0, Math.min(10, Math.round(v * 2))))
        }
        className="category-rater__stars"
      />
    </div>
  );
}
