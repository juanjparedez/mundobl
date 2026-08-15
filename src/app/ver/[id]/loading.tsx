import { Skeleton } from 'antd';

export default function VerSerieLoading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'var(--spacing-md)' }}>
      <Skeleton.Button active style={{ width: 120, height: 32, marginBottom: 16 }} />

      <div
        style={{
          padding: 20,
          borderRadius: 12,
          background: 'var(--bg-elevated)',
          marginBottom: 20,
        }}
      >
        <Skeleton active paragraph={{ rows: 2 }} />
      </div>

      {/* Video player placeholder */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
          maxHeight: '68vh',
          borderRadius: 12,
          background: 'var(--bg-spotlight)',
          marginBottom: 20,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Skeleton.Button active style={{ width: 64, height: 64, borderRadius: '50%' }} />
      </div>

      <Skeleton active paragraph={{ rows: 4 }} />
    </div>
  );
}
