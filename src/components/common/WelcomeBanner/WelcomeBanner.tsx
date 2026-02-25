'use client';

import { useSyncExternalStore } from 'react';
import { Button } from 'antd';
import { SmileOutlined } from '@ant-design/icons';
import './WelcomeBanner.css';

const STORAGE_KEY = 'welcome-dismissed';

function getSnapshot(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function getServerSnapshot(): boolean {
  return true;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

interface WelcomeBannerProps {
  isLoggedIn: boolean;
}

export function WelcomeBanner({ isLoggedIn }: WelcomeBannerProps) {
  const dismissed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  if (dismissed || isLoggedIn) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    window.dispatchEvent(new StorageEvent('storage'));
  };

  return (
    <div className="welcome-banner">
      <div className="welcome-banner__content">
        <SmileOutlined className="welcome-banner__icon" />
        <div className="welcome-banner__text">
          <strong>Bienvenido/a a MundoBL</strong>
          <p>
            Este es mi catálogo personal de series BL y doramas que fui viendo,
            incluyendo las que aún están en emisión. Si viste alguna, me
            encantaría que dejes tu comentario, reflexión o reseña.
          </p>
        </div>
      </div>
      <Button size="small" onClick={handleDismiss}>
        Entendido
      </Button>
    </div>
  );
}
