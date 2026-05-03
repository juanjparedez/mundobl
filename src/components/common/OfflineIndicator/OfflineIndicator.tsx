'use client';

import { startTransition, useEffect, useState } from 'react';
import { CloudOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './OfflineIndicator.css';

/**
 * Banner sutil cuando el browser detecta que perdió conexión.
 * Aparece sólo si estaba online y se cae — evita el flash al cargar.
 */
export function OfflineIndicator() {
  const { t } = useLocale();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    startTransition(() => setIsOffline(!navigator.onLine));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="offline-indicator" role="status" aria-live="polite">
      <CloudOutlined className="offline-indicator__icon" />
      <span>{t('offline.message')}</span>
    </div>
  );
}
