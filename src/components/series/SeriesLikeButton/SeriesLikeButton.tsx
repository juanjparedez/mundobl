'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { IconToggle } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { recordSeriesActivity } from '@/lib/activity-beacon';
import { useCommunityAlias } from '@/hooks/useCommunityAlias';
import './SeriesLikeButton.css';

const LIKES_STORAGE_KEY = 'mundobl.likes';

let cachedLikesRaw: string | null = null;
let cachedLikes: number[] = [];

function getStoredLikes(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LIKES_STORAGE_KEY);
    if (raw === cachedLikesRaw) return cachedLikes;
    cachedLikesRaw = raw;
    if (!raw) {
      cachedLikes = [];
      return cachedLikes;
    }
    const parsed: unknown = JSON.parse(raw);
    cachedLikes = Array.isArray(parsed)
      ? parsed.filter((n): n is number => typeof n === 'number')
      : [];
    return cachedLikes;
  } catch {
    return cachedLikes;
  }
}

function setStoredLikes(likes: number[]): void {
  try {
    cachedLikes = likes;
    cachedLikesRaw = JSON.stringify(likes);
    window.localStorage.setItem(LIKES_STORAGE_KEY, cachedLikesRaw);
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
  const { aliasName, optedIn } = useCommunityAlias();
  const getLiked = useCallback(
    () => getStoredLikes().includes(seriesId),
    [seriesId]
  );
  const liked = useSyncExternalStore(subscribe, getLiked, () => false);

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
        label={
          liked
            ? optedIn
              ? t('verSerie.likedAs', { alias: aliasName })
              : t('verSerie.liked')
            : t('verSerie.like')
        }
        icon={liked ? <HeartFilled /> : <HeartOutlined />}
        pressed={liked}
        onClick={handleClick}
      />
      {optedIn && liked && (
        <span className="series-like-btn__hint">
          {t('verSerie.likedAs', { alias: aliasName })}
        </span>
      )}
    </div>
  );
}
