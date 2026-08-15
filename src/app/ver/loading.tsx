import { Skeleton } from 'antd';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';

export default function VerLoading() {
  return (
    <AppLayout>
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: 'var(--spacing-md)',
        }}
      >
        {/* Hero skeleton */}
        <div
          style={{
            padding: 24,
            borderRadius: 12,
            background: 'var(--bg-elevated)',
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          <Skeleton.Button
            active
            style={{ width: 140, height: 28, marginBottom: 12 }}
          />
          <div style={{ maxWidth: 400, margin: '0 auto' }}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </div>
        </div>

        {/* Filter bar skeleton */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 24,
            padding: 12,
            background: 'var(--bg-container)',
            borderRadius: 12,
          }}
        >
          <Skeleton.Input active style={{ flex: 2, height: 40 }} />
          <Skeleton.Input active style={{ flex: 1, height: 40 }} />
          <Skeleton.Input active style={{ flex: 1, height: 40 }} />
        </div>

        {/* Cards grid skeleton */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '2 / 3',
                  background: 'var(--bg-spotlight)',
                }}
              />
              <div style={{ padding: 12 }}>
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
