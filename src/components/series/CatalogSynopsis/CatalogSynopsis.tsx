'use client';

import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { readCatalogSynopsis } from '@/lib/catalog-synopsis';
import './CatalogSynopsis.css';

interface Props {
  seriesId: string;
  labels: { empty: string; loading: string; error: string; retry: string };
}

export function CatalogSynopsis({ seriesId, labels }: Props) {
  const [result, setResult] = useState<{
    id: string;
    text: string | null;
    error: boolean;
  }>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    readCatalogSynopsis(seriesId).then(
      (text) => {
        if (active) setResult({ id: seriesId, text, error: false });
      },
      () => {
        if (active) setResult({ id: seriesId, text: null, error: true });
      }
    );
    return () => {
      active = false;
    };
  }, [seriesId, attempt]);
  const current = result?.id === seriesId ? result : undefined;
  return (
    <div className="catalog-synopsis" aria-live="polite" aria-busy={!current}>
      {current?.error ? (
        <>
          <p role="status">{labels.error}</p>
          <Button
            onClick={() => {
              setResult(undefined);
              setAttempt((value) => value + 1);
            }}
          >
            {labels.retry}
          </Button>
        </>
      ) : (
        <p>{current ? current.text?.trim() || labels.empty : labels.loading}</p>
      )}
    </div>
  );
}
