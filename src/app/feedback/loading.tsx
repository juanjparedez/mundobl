import { Skeleton } from 'antd';

export default function FeedbackLoading() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Skeleton.Button active style={{ width: 180, height: 36 }} />
        <Skeleton.Button active style={{ width: 140, height: 36 }} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton.Button key={i} active style={{ width: 80, height: 28 }} />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: 16,
              borderRadius: 12,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Skeleton active paragraph={{ rows: 2 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
