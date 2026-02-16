'use client';

import './PageTitle.css';

interface PageTitleProps {
  title: string;
  level?: 1 | 2 | 3 | 4 | 5;
  subtitle?: string;
}

export function PageTitle({ title, level = 2, subtitle }: PageTitleProps) {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <div className="page-title">
      <HeadingTag className="page-title-text">
        {title}
      </HeadingTag>
      {subtitle && (
        <span style={{ color: 'var(--text-secondary)' }} className="page-subtitle">
          {subtitle}
        </span>
      )}
    </div>
  );
}
