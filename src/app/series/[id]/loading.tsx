import { Skeleton } from 'antd';

export default function SeriesDetailLoading() {
  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          height: 320,
          borderRadius: 12,
          background: 'var(--bg-secondary)',
        }}
      />
      <Skeleton active paragraph={{ rows: 6 }} style={{ marginTop: 24 }} />
      <Skeleton active paragraph={{ rows: 4 }} style={{ marginTop: 24 }} />
    </div>
  );
}
