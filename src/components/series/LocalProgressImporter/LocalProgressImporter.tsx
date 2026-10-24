'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Alert, Button } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import {
  clearLocalSeriesProgress,
  listLocalProgress,
} from '@/lib/local-progress';
import './LocalProgressImporter.css';

/**
 * Al iniciar sesion, lo que se siguio sin cuenta en este navegador pasa solo
 * a la cuenta: crear una cuenta es justamente para no perderlo. Nunca pisa
 * lo que la cuenta ya tenia (ver local-progress-import.ts). Si algo falla,
 * queda en el navegador y se ofrece reintentar.
 */
export function LocalProgressImporter() {
  const { status } = useSession();
  const { t } = useLocale();
  const message = useMessage();
  const [failedCount, setFailedCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const attempted = useRef(false);

  const runImport = useCallback(async () => {
    const pending = listLocalProgress();
    if (pending.length === 0) return;
    setImporting(true);
    try {
      const response = await fetch('/api/user/local-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: pending.map(({ seriesId, progress }) => ({
            seriesId,
            episodeIds: progress.episodeIds,
            ...(progress.intent ? { intent: progress.intent } : {}),
          })),
        }),
      });
      if (!response.ok) throw new Error();
      const { imported, failed } = (await response.json()) as {
        imported: number[];
        failed: number[];
      };
      for (const seriesId of imported) clearLocalSeriesProgress(seriesId);
      setFailedCount(failed.length);
      if (imported.length > 0) {
        window.dispatchEvent(new Event('mundobl:account-progress-imported'));
        message.success(
          t('trackingPanel.localImportSuccess', { n: imported.length })
        );
      }
    } catch {
      setFailedCount(listLocalProgress().length);
    } finally {
      setImporting(false);
    }
  }, [message, t]);

  useEffect(() => {
    if (status !== 'authenticated' || attempted.current) return;
    attempted.current = true;
    void runImport();
  }, [status, runImport]);

  if (status !== 'authenticated' || failedCount === 0) return null;

  return (
    <Alert
      className="local-progress-importer"
      type="warning"
      showIcon
      closable
      onClose={() => setFailedCount(0)}
      title={t('trackingPanel.localImportOffer', { n: failedCount })}
      action={
        <Button
          type="primary"
          icon={<CloudUploadOutlined />}
          loading={importing}
          onClick={() => void runImport()}
        >
          {t('trackingPanel.localImportButton')}
        </Button>
      }
    />
  );
}
