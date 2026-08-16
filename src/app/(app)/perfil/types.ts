/**
 * Tipos compartidos entre la vista clasica del perfil (`/perfil`) y la
 * vista dashboard opt-in (`/perfil/dashboard`).
 *
 * Mantiene la shape que devuelve `GET /api/user/profile` para que ambos
 * clientes consumieran el mismo endpoint sin duplicar el contrato.
 */

export interface ProfileSeriesMini {
  id: number;
  title: string;
  imageUrl: string | null;
  year: number | null;
  country: { name: string } | null;
}

export interface ProfileReview {
  id: number;
  title: string;
  body: string;
  verdict: 'RECOMMENDED' | 'MIXED' | 'SKIP' | null;
  language: string;
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
  isFeatured: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  hasSpoilers: boolean;
  publishedAt: string | null;
  updatedAt: string;
  series: {
    id: number;
    title: string;
    imageUrl: string | null;
    year: number | null;
  } | null;
}

/** Handles de redes sociales del usuario. Solo se persisten en User.socials
 *  (Json field) los keys que el usuario completo — el resto undefined o
 *  null significa "no configurado". Renderizado por SocialsWidget. */
export interface UserSocials {
  twitter?: string | null;
  instagram?: string | null;
  letterboxd?: string | null;
  mal?: string | null;
  mdl?: string | null;
}

export interface ProfileData {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
    createdAt: string;
    socials?: UserSocials | null;
  };
  stats: {
    watched: number;
    watching: number;
    abandoned: number;
    toRewatch: number;
    favorites: number;
    ratings: number;
    comments: number;
    reviews: number;
    hoursWatched: number;
    activeDaysThisWeek: number;
    topGenres: Array<{ name: string; count: number }>;
    topCountries: Array<{ name: string; code: string | null; count: number }>;
    topActors: Array<{ name: string; count: number }>;
    topProductionCompanies: Array<{ name: string; count: number }>;
    completedByYear: Array<{ year: number | null; count: number }>;
    avgRating: number | null;
    topRatedSeries: Array<{
      seriesId: number;
      title: string;
      rating: number;
      imageUrl: string | null;
    }>;
    byType: Array<{ type: string; count: number }>;
    totalEpisodes: number;
    longestStreak: number;
    heatmap: string[];
  };
  recentlyCompleted: Array<{
    seriesId: number;
    series: ProfileSeriesMini | null;
  }>;
  currentlyWatching: Array<{
    seriesId: number;
    series: ProfileSeriesMini | null;
    progress: { totalEpisodes: number; watchedEpisodes: number };
    nextEpisode: { seasonNumber: number; episodeNumber: number } | null;
  }>;
  favorites: Array<{ seriesId: number; series: ProfileSeriesMini | null }>;
  recentReviews: ProfileReview[];
}
