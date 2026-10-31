'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import './ReportStatus.css';

export function ReportStatus({
  generatedAt,
  refreshLabel,
  generatedLabel,
  scope,
  loading = false,
  onRefresh,
}: {
  generatedAt?: string;
  refreshLabel: string;
  generatedLabel: string;
  scope: string;
  loading?: boolean;
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="report-status">
      <p>{scope}</p>
      <div className="report-status__actions">
        {generatedAt && (
          <span>
            {generatedLabel}{' '}
            <time dateTime={generatedAt}>
              {generatedAt.replace('T', ' ').slice(0, 19)} UTC
            </time>
          </span>
        )}
        <Button
          loading={loading || pending}
          onClick={onRefresh ?? (() => startTransition(() => router.refresh()))}
        >
          {refreshLabel}
        </Button>
      </div>
    </div>
  );
}
