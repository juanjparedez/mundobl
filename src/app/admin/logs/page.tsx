import { Suspense } from 'react';
import { Spin } from 'antd';
import { LogsClient } from './LogsClient';

export default function LogsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      }
    >
      <LogsClient />
    </Suspense>
  );
}

