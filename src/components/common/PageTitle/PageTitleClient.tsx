'use client';

interface PageTitleClientProps {
  level?: 1 | 2 | 3 | 4 | 5;
  children: React.ReactNode;
}

export function PageTitleClient({ level = 2, children }: PageTitleClientProps) {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <HeadingTag style={{
      margin: 0,
      color: 'var(--text-primary)',
      fontWeight: 600,
      lineHeight: 1.4
    }}>
      {children}
    </HeadingTag>
  );
}
