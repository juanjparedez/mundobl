import { Skeleton } from 'antd';

export default function DirectorLoading() {
  return (
    <>
      <div style={{ padding: 'var(--spacing-lg)' }}>
        <Skeleton avatar active paragraph={{ rows: 6 }} />
      </div>
    </>
  );
}
