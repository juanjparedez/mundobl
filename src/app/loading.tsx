import { Skeleton } from 'antd';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';

export default function RootLoading() {
  return (
    <AppLayout>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: 'var(--spacing-lg)',
        }}
      >
        <Skeleton active paragraph={{ rows: 2 }} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
            marginTop: 24,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                background: 'var(--bg-elevated)',
                padding: 12,
              }}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '2 / 3',
                  borderRadius: 8,
                  background: 'var(--bg-spotlight)',
                  marginBottom: 12,
                }}
              />
              <Skeleton active paragraph={{ rows: 2 }} />
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
