import { Skeleton } from 'antd';

export default function ActorLoading() {
  return (
    <>
      <div style={{ padding: 'var(--spacing-lg)' }}>
        <Skeleton avatar active paragraph={{ rows: 6 }} />
      </div>
    </>
  );
}
