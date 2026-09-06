import type { PeopleSort } from '@/lib/database';

/** searchParams aceptados por los indices de personas. */
export interface PeopleSearchParams {
  q?: string;
  sort?: string;
  nationality?: string;
  page?: string;
}

export interface ParsedPeopleParams {
  q?: string;
  sort: PeopleSort;
  nationality?: string;
  page: number;
}

const SORTS: PeopleSort[] = ['credits', 'az', 'za'];

/** Normaliza y acota lo que llega por URL — nunca confiar en searchParams. */
export function parsePeopleSearchParams(
  raw: PeopleSearchParams
): ParsedPeopleParams {
  const page = Number.parseInt(raw.page ?? '1', 10);
  const sort = SORTS.includes(raw.sort as PeopleSort)
    ? (raw.sort as PeopleSort)
    : 'credits';
  return {
    q: raw.q?.trim() || undefined,
    sort,
    nationality: raw.nationality?.trim() || undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Href de una pagina preservando el resto de los filtros activos. */
export function buildPeopleHref(
  basePath: string,
  params: ParsedPeopleParams,
  page: number
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.sort !== 'credits') sp.set('sort', params.sort);
  if (params.nationality) sp.set('nationality', params.nationality);
  if (page > 1) sp.set('page', String(page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
