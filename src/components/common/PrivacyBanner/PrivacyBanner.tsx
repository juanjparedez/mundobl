'use client';

import { useSyncExternalStore } from 'react';
import { Button } from 'antd';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './PrivacyBanner.css';

const STORAGE_KEY = 'privacy-accepted';

function getSnapshot(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function getServerSnapshot(): boolean {
  return true; // En SSR, no mostrar el banner
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function PrivacyBanner() {
  const accepted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const { t } = useLocale();

  if (accepted) return null;

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    // Forzar re-render disparando evento storage
    window.dispatchEvent(new StorageEvent('storage'));
  };

  return (
    <div className="privacy-banner">
      <p className="privacy-banner__text">
        {t('privacyBanner.text')}
      </p>
      <Button
        type="primary"
        size="small"
        onClick={handleAccept}
        className="privacy-banner__btn"
      >
        {t('privacyBanner.accept')}
      </Button>
    </div>
  );
}
