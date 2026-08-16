/**
 * Tipos compartidos entre la vista clasica del detalle de serie
 * (`/catalogo/[id]`) y la vista dashboard (`/catalogo/[id]/dashboard`).
 *
 * Espejo del shape que devuelve `getSeriesById()` en `src/lib/database.ts`,
 * minimo necesario para el render publico (sin notas privadas, etc).
 */

export interface SerieActorRelation {
  id: number;
  actor: {
    id: number;
    name: string;
  };
  character?: string | null;
}

export interface SerieSeasonData {
  seasonNumber: number;
  title?: string | null;
  episodeCount?: number | null;
  year?: number | null;
  observations?: string | null;
  actors?: SerieActorRelation[];
}

export interface SerieRatingData {
  id: number;
  category: string;
  score: number;
}

export interface SerieCommentData {
  id: number;
  content: string;
}

export interface SerieDetailData {
  id?: number;
  title: string;
  originalTitle?: string | null;
  type: string;
  year?: number | null;
  imageUrl?: string | null;
  synopsis?: string | null;
  observations?: string | null;
  review?: string | null;
  notesPrivate?: boolean;
  soundtrack?: string | null;
  isNovel?: boolean | null;
  overallRating?: number | null;
  country?: { name: string } | null;
  actors?: SerieActorRelation[];
  seasons: SerieSeasonData[];
  ratings?: SerieRatingData[];
  comments?: SerieCommentData[];
  universe?: {
    name: string;
    description?: string | null;
  } | null;
}
