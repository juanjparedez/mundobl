'use client';

import { Button, Progress } from 'antd';
import { PanelCard } from '@/components/design-system/PanelCard/PanelCard';
import type { InsightCategory } from '@/lib/insight-distributions';
import './InsightDistribution.css';

export function InsightDistribution({
  title,
  categories,
  total,
  selected,
  onSelect,
  label,
  more,
  locale,
}: {
  title: string;
  categories: InsightCategory[];
  total: number;
  selected: string | null;
  onSelect: (key: string) => void;
  label: (category: InsightCategory) => string;
  more: string;
  locale: string;
}) {
  const render = (items: InsightCategory[]) => (
    <ul>
      {items.map((category) => (
        <li key={category.key}>
          <Button
            type="text"
            block
            aria-pressed={selected === category.key}
            onClick={() => onSelect(category.key)}
          >
            <span>{label(category)}</span>
            <strong>
              {category.count} ·{' '}
              {new Intl.NumberFormat(locale, {
                style: 'percent',
                maximumFractionDigits: 0,
              }).format(category.count / total)}
            </strong>
          </Button>
          <Progress
            percent={(100 * category.count) / total}
            showInfo={false}
            size="small"
          />
        </li>
      ))}
    </ul>
  );
  return (
    <PanelCard className="insight-distribution">
      <h2>{title}</h2>
      {render(categories.slice(0, 5))}
      {categories.length > 5 && (
        <details>
          <summary>{more}</summary>
          {render(categories.slice(5))}
        </details>
      )}
    </PanelCard>
  );
}
