'use client';

import { useEffect, useState } from 'react';
import { Alert, Button } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import {
  clearLocalSeriesProgress,
  listLocalProgress,
} from '@/lib/local-progress';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import './LocalProgressImporter.css';

export function LocalProgressImporter() {
  const { status } = useSession();
  const { t } = useLocale();
  const message = useMessage();
  const [count, setCount] = useState(0);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') setCount(listLocalProgress().length);
  }, [status]);

  if (status !== 'authenticated' || count === 0) return null;

  const handleImport = async () => {
    setImporting(true);
    const pending = listLocalProgress();
    let imported = 0;
    try {
      for (const { seriesId, progress } of pending) {
        const response = await fetch(`/api/series/${seriesId}/watched`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            episodeIds: progress.episodeIds,
            watched: true,
          }),
        });
        if (!response.ok) continue;
        clearLocalSeriesProgress(seriesId);
        imported += 1;
      }
      setCount(listLocalProgress().length);
      if (imported > 0) {
        window.dispatchEvent(new Event('mundobl:account-progress-imported'));
        message.success(t('trackingPanel.localImportSuccess'));
      }
      if (imported !== pending.length) {
        message.error(t('trackingPanel.localImportError'));
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <Alert
      className="local-progress-importer"
      type="info"
      showIcon
      title={t('trackingPanel.localImportOffer', { n: count })}
      action={
        <Button
          type="primary"
          icon={<CloudUploadOutlined />}
          loading={importing}
          onClick={() => void handleImport()}
        >
          {t('trackingPanel.localImportButton')}
        </Button>
      }
    />
  );
}
