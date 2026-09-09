'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Result, Space, Tag } from 'antd';
import {
  ReloadOutlined,
  HomeOutlined,
  ClearOutlined,
  BugOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { signOut } from 'next-auth/react';
import { resetServiceWorker, resetClientState } from '@/lib/reset-recovery';
import './error.css';

// Todo el reporte viaja como query param hacia /feedback, asi que el stack
// va recortado: un stack entero de produccion puede pasar los 8k y dejar la
// URL a merced de lo que la trunque en el camino. Con este tope entran ~15
// frames, de sobra para ubicar el origen.
const STACK_MAX_CHARS = 1200;

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (typeof console !== 'undefined') {
      console.error('App error boundary caught:', error);
    }
  }, [error]);

  const handleReportBug = () => {
    const title = `Error en la app${error.digest ? ` (${error.digest})` : ''}`;
    const lines = [
      `URL: ${typeof window !== 'undefined' ? window.location.href : ''}`,
      `User-Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : ''}`,
      `Fecha: ${new Date().toISOString()}`,
      '',
      `Mensaje: ${error.message || 'Sin mensaje'}`,
      error.digest ? `Digest: ${error.digest}` : '',
      // El stack es lo unico que convierte un "Cannot read properties of
      // undefined" en un archivo y una linea. Sin el, un error de cliente
      // (que no tiene digest, porque el digest solo existe en errores de
      // servidor) no deja rastro en ningun lado: el boundary solo hace
      // console.error, y esa consola esta en el telefono de quien reporta.
      error.stack ? `\nStack:\n${error.stack.slice(0, STACK_MAX_CHARS)}` : '',
    ].filter(Boolean);
    const description = lines.join('\n');
    const params = new URLSearchParams({
      type: 'bug',
      title,
      description,
    });
    router.push(`/feedback?${params.toString()}`);
  };

  const handleResetSW = async () => {
    setBusy('sw');
    await resetServiceWorker();
  };

  const handleResetAll = async () => {
    setBusy('all');
    await resetClientState();
    if (typeof window !== 'undefined') window.location.assign('/');
  };

  const handleSignOut = async () => {
    setBusy('signout');
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="error-page">
      <Result
        status="error"
        title="Algo salió mal"
        subTitle={
          <div className="error-page__subtitle">
            <p>
              Ocurrió un error al cargar esta página. Probá las acciones de
              abajo: la mayoría de los problemas se resuelven con reintentar o
              limpiando el cache.
            </p>
            {error.digest && (
              <Tag color="default" className="error-page__digest">
                Código: {error.digest}
              </Tag>
            )}
          </div>
        }
        extra={
          <Space
            orientation="vertical"
            size="large"
            className="error-page__actions"
          >
            <Space wrap size="small" className="error-page__primary-actions">
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => reset()}
              >
                Reintentar
              </Button>
              <Button icon={<HomeOutlined />} onClick={() => router.push('/')}>
                Ir al inicio
              </Button>
              <Button icon={<BugOutlined />} onClick={handleReportBug}>
                Reportar este error
              </Button>
            </Space>

            <div className="error-page__rescue">
              <p className="error-page__rescue-title">
                Si el problema persiste:
              </p>
              <Space wrap size="small">
                <Button
                  icon={<ClearOutlined />}
                  loading={busy === 'sw'}
                  onClick={handleResetSW}
                >
                  Resetear Service Worker
                </Button>
                <Button
                  danger
                  icon={<ClearOutlined />}
                  loading={busy === 'all'}
                  onClick={handleResetAll}
                >
                  Borrar cache local y recargar
                </Button>
                <Button
                  icon={<LogoutOutlined />}
                  loading={busy === 'signout'}
                  onClick={handleSignOut}
                >
                  Cerrar sesión
                </Button>
              </Space>
            </div>
          </Space>
        }
      />
    </div>
  );
}
