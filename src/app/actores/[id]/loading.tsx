import { Skeleton } from 'antd';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';

export default function ActorLoading() {
  return (
    <AppLayout>
      <div style={{ padding: 'var(--spacing-lg)' }}>
        <Skeleton avatar active paragraph={{ rows: 6 }} />
      </div>
    </AppLayout>
  );
}
