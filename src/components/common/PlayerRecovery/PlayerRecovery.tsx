'use client';

import { useState } from 'react';
import { Alert, Button, Collapse, Popconfirm } from 'antd';
import { ReloadOutlined, ToolOutlined } from '@ant-design/icons';
import {
  inspectPlaybackEnvironment,
  resetServiceWorker,
  type PlaybackEnvironment,
} from '@/lib/reset-recovery';
import './PlayerRecovery.css';

export interface PlayerRecoveryLabels {
  title: string;
  description: string;
  review: string;
  retry: string;
  reset: string;
  resetConfirm: string;
  confirm: string;
  cancel: string;
  online: string;
  offline: string;
  localActive: string;
  localEmpty: string;
  reviewFailed: string;
  resetFailed: string;
  platformNotice: string;
  open: string;
}

interface PlayerRecoveryProps {
  labels: PlayerRecoveryLabels;
  url: string;
  onRetry: () => void;
}

export function PlayerRecovery({ labels, url, onRetry }: PlayerRecoveryProps) {
  const [inspection, setInspection] = useState<PlaybackEnvironment | null>(
    null
  );
  const [busy, setBusy] = useState<'review' | 'reset' | null>(null);
  const [error, setError] = useState<'review' | 'reset' | 'offline' | null>(
    null
  );

  const review = async () => {
    setBusy('review');
    setError(null);
    setInspection(null);
    try {
      setInspection(await inspectPlaybackEnvironment());
    } catch {
      setError('review');
    } finally {
      setBusy(null);
    }
  };

  const repair = async () => {
    if (!navigator.onLine) {
      setError('offline');
      return;
    }
    setBusy('reset');
    setError(null);
    const success = await resetServiceWorker(false);
    if (success) {
      window.location.reload();
    } else {
      setError('reset');
      setBusy(null);
    }
  };

  return (
    <div className="player-recovery">
      <Collapse
        size="small"
        items={[
          {
            key: 'help',
            label: labels.title,
            children: (
              <div className="player-recovery__content">
                <p>{labels.description}</p>
                <div className="player-recovery__actions">
                  <Button
                    onClick={onRetry}
                    disabled={busy !== null}
                    icon={<ReloadOutlined />}
                  >
                    {labels.retry}
                  </Button>
                  <Button
                    onClick={review}
                    loading={busy === 'review'}
                    disabled={busy === 'reset'}
                  >
                    {labels.review}
                  </Button>
                  <Popconfirm
                    title={labels.reset}
                    description={labels.resetConfirm}
                    onConfirm={repair}
                    okText={labels.confirm}
                    cancelText={labels.cancel}
                    disabled={busy !== null}
                  >
                    <Button
                      loading={busy === 'reset'}
                      disabled={busy === 'review'}
                      icon={<ToolOutlined />}
                    >
                      {labels.reset}
                    </Button>
                  </Popconfirm>
                </div>
                <div role="status" aria-live="polite">
                  {inspection && (
                    <ul className="player-recovery__results">
                      <li>
                        {inspection.online ? labels.online : labels.offline}
                      </li>
                      <li>
                        {inspection.hasLocalData
                          ? labels.localActive
                          : labels.localEmpty}
                      </li>
                    </ul>
                  )}
                  {error && (
                    <Alert
                      type="warning"
                      showIcon
                      title={
                        error === 'offline'
                          ? labels.offline
                          : error === 'review'
                            ? labels.reviewFailed
                            : labels.resetFailed
                      }
                    />
                  )}
                </div>
                <p>{labels.platformNotice}</p>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {labels.open}
                </a>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
