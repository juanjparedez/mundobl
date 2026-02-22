'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal, Button, Space } from 'antd';
import { ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import './StaleVersionNotifier.css';

const CHECK_INTERVAL_MS = 60_000; // Check every 60 seconds

async function fetchBuildId(): Promise<string | null> {
  try {
    const res = await fetch('/api/build-info', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.buildId as string;
  } catch {
    return null;
  }
}

export function StaleVersionNotifier() {
  const [stale, setStale] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [currentBuildId, setCurrentBuildId] = useState<string | null>(null);
  const [newBuildId, setNewBuildId] = useState<string | null>(null);
  const knownBuildId = useRef<string | null>(null);

  useEffect(() => {
    // Skip version checking in development
    if (process.env.NODE_ENV === 'development') return;

    // Capture initial build ID on mount
    fetchBuildId().then((id) => {
      if (id) {
        knownBuildId.current = id;
        setCurrentBuildId(id);
      }
    });

    const interval = setInterval(async () => {
      const latestId = await fetchBuildId();
      if (!latestId || !knownBuildId.current) return;

      if (knownBuildId.current !== latestId) {
        setNewBuildId(latestId);
        setStale(true);
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (!stale || dismissed) return null;

  return (
    <Modal
      open
      closable={false}
      footer={null}
      centered
      maskClosable={false}
      className="stale-version-modal"
    >
      <div className="stale-version-modal__content">
        <WarningOutlined className="stale-version-modal__icon" />
        <h3 className="stale-version-modal__title">Nueva versión disponible</h3>
        <p className="stale-version-modal__description">
          Hay una versión más reciente de la aplicación. Te recomendamos
          recargar la página para evitar errores o inconsistencias.
        </p>
        {(currentBuildId || newBuildId) && (
          <div className="stale-version-modal__versions">
            {currentBuildId && (
              <span>
                Versión actual: <code>{currentBuildId}</code>
              </span>
            )}
            {newBuildId && (
              <span>
                Nueva versión: <code>{newBuildId}</code>
              </span>
            )}
            <a
              href="https://github.com/juanjparedez/mundobl/blob/main/CHANGELOG.md"
              target="_blank"
              rel="noopener noreferrer"
              className="stale-version-modal__changelog-link"
            >
              Ver changelog
            </a>
          </div>
        )}
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleReload}
            block
            size="large"
          >
            Recargar ahora
          </Button>
          <Button onClick={handleDismiss} block>
            Continuar sin recargar
          </Button>
        </Space>
        <p className="stale-version-modal__warning">
          Continuar sin recargar puede generar inconsistencias en los datos.
        </p>
      </div>
    </Modal>
  );
}
