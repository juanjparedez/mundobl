import { Skeleton } from 'antd';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';

export default function CatalogoDetailLoading() {
  return (
    <AppLayout>
      <div style={{ padding: 'var(--spacing-lg)' }}>
        <Skeleton.Image
          active
          style={{ width: '100%', height: 320, borderRadius: 12 }}
        />
        <Skeleton active paragraph={{ rows: 6 }} style={{ marginTop: 24 }} />
      </div>
    </AppLayout>
  );
}
