import { getContentUrl, getSeriesUrl } from './slug';

export function getCommunityReviewUrl(series: {
  id: number;
  title: string;
  origin: string;
  catalogScope: string;
}): string {
  const path =
    series.origin === 'CURATED'
      ? getSeriesUrl(series.id, series.title)
      : getContentUrl(series);
  return `${path}#series-section-reviews`;
}

export function getCommunityUrl(
  page = 1,
  search = '',
  view = 'all',
  scope?: { seriesId: number; episodeId?: number }
): string {
  const params = new URLSearchParams();
  if (search) params.set('q', search);
  if (page > 1) params.set('page', String(page));
  if (view !== 'all') params.set('view', view);
  if (scope?.episodeId) params.set('episodeId', String(scope.episodeId));
  const path = scope ? `/comunidad/obras/${scope.seriesId}` : '/comunidad';
  return `${path}${params.size ? `?${params}` : ''}`;
}
