export function getCommunityUrl(page = 1, search = ''): string {
  const params = new URLSearchParams();
  if (search) params.set('q', search);
  if (page > 1) params.set('page', String(page));
  return `/comunidad${params.size ? `?${params}` : ''}`;
}
