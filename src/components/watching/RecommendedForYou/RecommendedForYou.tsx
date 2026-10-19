'use client';

import { useEffect, useState } from 'react';
import { FireOutlined, HeartOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { UserRecommendations } from '@/lib/recommendations';
import { RecommendedSeriesGrid } from '@/components/series/RecommendedSeriesGrid/RecommendedSeriesGrid';

/**
 * "Para vos" debajo de la biblioteca: lo que sigue despues de terminar una
 * serie. Si la biblioteca esta vacia muestra lo mas seguido del sitio.
 * Falla en silencio: es una sugerencia, no puede tapar la biblioteca.
 *
 * `refreshKey` cambia cuando la biblioteca cambia, para no sugerir una
 * serie que el usuario acaba de empezar.
 */
export function RecommendedForYou({ refreshKey }: { refreshKey: string }) {
  const { t } = useLocale();
  const [data, setData] = useState<UserRecommendations | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/user/recommendations', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: UserRecommendations | null) => {
        if (body && Array.isArray(body.series)) setData(body);
      })
      .catch(() => null);
    return () => controller.abort();
  }, [refreshKey]);

  if (!data) return null;
  const personal = data.kind === 'personal';
  return (
    <RecommendedSeriesGrid
      icon={personal ? <HeartOutlined /> : <FireOutlined />}
      title={t(
        personal
          ? 'recommendations.forYouTitle'
          : 'recommendations.popularTitle'
      )}
      subtitle={t(
        personal
          ? 'recommendations.forYouSubtitle'
          : 'recommendations.popularSubtitle'
      )}
      series={data.series}
      becauseLabel={(title) => t('recommendations.similarTo', { title })}
    />
  );
}
