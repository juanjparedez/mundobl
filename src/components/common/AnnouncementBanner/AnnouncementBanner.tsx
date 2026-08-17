'use client';

import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Button } from 'antd';
import {
  CloseOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import { resolvePageKey } from '@/constants/announcements';
import {
  useActiveAnnouncements,
  type ActiveAnnouncement,
} from '@/hooks/useActiveAnnouncements';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './AnnouncementBanner.css';

const STORAGE_KEY = 'announcements-dismissed';

const TONE_ICON: Record<ActiveAnnouncement['tone'], React.ReactNode> = {
  INFO: <InfoCircleOutlined />,
  SUCCESS: <CheckCircleOutlined />,
  WARNING: <WarningOutlined />,
  PROMO: <GiftOutlined />,
};

// useSyncExternalStore exige que getSnapshot devuelva la MISMA referencia
// si el valor subyacente no cambio (usa Object.is para decidir si hay que
// re-renderizar). JSON.parse crea un array nuevo en cada llamada -> sin este
// cache, React ve "cambios" en cada render y entra en loop infinito
// ("Maximum update depth exceeded"), lo que tira la app entera para abajo
// via el error boundary. Cacheamos por el string crudo: solo re-parseamos
// (y devolvemos una referencia nueva) cuando localStorage realmente cambio.
let cachedRaw: string | null = null;
let cachedIds: number[] = [];

function getDismissedIds(): number[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return cachedIds;
  }
  if (raw === cachedRaw) return cachedIds;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedIds = Array.isArray(parsed) ? parsed : [];
  } catch {
    cachedIds = [];
  }
  return cachedIds;
}

const EMPTY_IDS: number[] = [];
function getServerSnapshot(): number[] {
  return EMPTY_IDS;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function dismissAnnouncement(id: number): void {
  const current = getDismissedIds();
  if (current.includes(id)) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, id]));
  window.dispatchEvent(new StorageEvent('storage'));
}

export function AnnouncementBanner() {
  const pathname = usePathname();
  const { t } = useLocale();
  const dismissedIds = useSyncExternalStore(
    subscribe,
    getDismissedIds,
    getServerSnapshot
  );

  const isAdminRoute = pathname?.startsWith('/admin');
  const pageKey = resolvePageKey(pathname ?? '/');
  const items = useActiveAnnouncements(isAdminRoute ? '' : pageKey);

  if (isAdminRoute) return null;

  const announcement = items.find((a) => !dismissedIds.includes(a.id));
  if (!announcement) return null;

  return (
    <div
      className={`announcement-banner announcement-banner--${announcement.tone.toLowerCase()}`}
      role="region"
      aria-label={announcement.title}
    >
      <span className="announcement-banner__icon" aria-hidden="true">
        {TONE_ICON[announcement.tone]}
      </span>
      <div className="announcement-banner__body">
        <strong className="announcement-banner__title">
          {announcement.title}
        </strong>
        <div className="announcement-banner__text">
          <ReactMarkdown
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              p: ({ children }) => <p>{children}</p>,
            }}
          >
            {announcement.body}
          </ReactMarkdown>
        </div>
      </div>
      {announcement.linkUrl && announcement.linkLabel && (
        <a
          className="announcement-banner__cta"
          href={announcement.linkUrl}
          target={announcement.linkUrl.startsWith('/') ? undefined : '_blank'}
          rel={
            announcement.linkUrl.startsWith('/')
              ? undefined
              : 'noopener noreferrer'
          }
        >
          {announcement.linkLabel}
        </a>
      )}
      {announcement.dismissible && (
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          className="announcement-banner__close"
          onClick={() => dismissAnnouncement(announcement.id)}
          aria-label={t('announcementBanner.dismiss')}
        />
      )}
    </div>
  );
}
