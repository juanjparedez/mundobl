'use client';

import { useEffect, useState } from 'react';
import { StarFilled, StarOutlined } from '@ant-design/icons';
import { useSession, signIn } from 'next-auth/react';
import { IconToggle } from '@/components/design-system';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useSeriesUserStatus } from '../SeriesUserStatusProvider';

/**
 * Estrella de favorito para la ficha y /ver: lo mismo que la del catalogo,
 * con el estado que ya trae SeriesUserStatusProvider (sin pedido extra).
 */
export function FavoriteButton() {
  const { t } = useLocale();
  const { status } = useSession();
  const message = useMessage();
  const {
    seriesId,
    favorite: initialFavorite,
    loaded,
    version,
  } = useSeriesUserStatus();
  const [favorite, setFavorite] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loaded) setFavorite(initialFavorite);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-sembrar en cada version (refetch), no solo cuando cambia el valor en si
  }, [version]);

  if (seriesId === null) return null;

  const handleClick = async () => {
    if (status !== 'authenticated') {
      void signIn('google', {
        callbackUrl: window.location.pathname + window.location.search,
      });
      return;
    }

    const next = !favorite;
    setFavorite(next);
    setSaving(true);
    try {
      const response = await fetch(`/api/series/${seriesId}/favorite`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error();
      // El endpoint alterna: su respuesta es la verdad.
      const data = (await response.json()) as { isFavorite: boolean };
      setFavorite(data.isFavorite);
    } catch {
      setFavorite(!next);
      message.error(t('catalogo.favoriteError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <IconToggle
      label={
        favorite ? t('catalogo.removeFavorite') : t('catalogo.addFavorite')
      }
      icon={favorite ? <StarFilled /> : <StarOutlined />}
      pressed={favorite}
      disabled={saving || status === 'loading'}
      onClick={() => void handleClick()}
    />
  );
}
