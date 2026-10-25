'use client';

import { useSyncExternalStore } from 'react';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { IconToggle } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { recordSeriesActivity } from '@/lib/activity-beacon';
import './SeriesLikeButton.css';

const LIKES_STORAGE_KEY = 'mundobl.likes';

function getStoredLikes(): number[] {
  try {
    const raw = window.localStorage.getItem(LIKES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((n): n is number => typeof n === 'number')
      : [];
  } catch {
    return [];
  }
}

function setStoredLikes(likes: number[]): void {
  try {
    window.localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likes));
    window.dispatchEvent(new StorageEvent('storage'));
  } catch {
    /* ignore */
  }
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

interface SeriesLikeButtonProps {
  seriesId: number;
}

/**
 * Botón de "Me gusta" nativo de MundoBL para la ficha de reproducción (/ver/[id]).
 * Funciona con y sin cuenta, persistiendo la decisión en el navegador
 * y registrando el evento agregado anónimo en SeriesActivityDaily.
 */
export function SeriesLikeButton({ seriesId }: SeriesLikeButtonProps) {
  const { t } = useLocale();
  const liked = useSyncExternalStore(
    subscribe,
    () => getStoredLikes().includes(seriesId),
    () => false
  );

  const handleClick = () => {
    const next = !liked;
    const likes = getStoredLikes();
    if (next) {
      if (!likes.includes(seriesId)) likes.push(seriesId);
      recordSeriesActivity(seriesId, 'like');
    } else {
      const idx = likes.indexOf(seriesId);
      if (idx !== -1) likes.splice(idx, 1);
    }
    setStoredLikes(likes);
  };

  return (
    <div className="series-like-btn">
      <IconToggle
        label={liked ? t('verSerie.liked') : t('verSerie.like')}
        icon={liked ? <HeartFilled /> : <HeartOutlined />}
        pressed={liked}
        onClick={handleClick}
      />
    </div>
  );
}
