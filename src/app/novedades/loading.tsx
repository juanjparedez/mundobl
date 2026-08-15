import { Skeleton } from 'antd';

export default function NovedadesLoading() {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'var(--spacing-lg)' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Skeleton.Button active style={{ width: 220, height: 40, marginBottom: 12 }} />
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: 24,
              borderRadius: 12,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Skeleton active avatar={{ shape: 'circle' }} paragraph={{ rows: 3 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
