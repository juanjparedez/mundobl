/** Shapes compartidos entre CatalogoClient y el modo carrusel (vista
 *  carrusel + agrupador). Antes vivian solo dentro de CatalogoClient.tsx;
 *  se extraen aca para que ambos lados los importen sin depender uno
 *  del otro. */

export interface SerieTag {
  id: number;
  name: string;
}

export interface SerieData {
  id: string;
  titulo: string;
  pais: string;
  paisCode?: string | null;
  tipo: string;
  formato?: string;
  temporadas: number;
  episodios: number;
  runtimeHours?: number;
  anio: number;
  rating: number | null;
  observaciones: string | null;
  imageUrl?: string | null;
  imagePosition?: string;
  synopsis?: string | null;
  visto?: boolean;
  /** Curaduria editorial (Flor/admin) — filtro rapido "Destacadas". */
  featured?: boolean;
  /** Orden manual dentro de "Destacadas" (menor = primero). */
  featuredOrder?: number;
  universoId?: number | null;
  universoNombre?: string | null;
  tags?: SerieTag[];
  genres?: string[];
  directors?: string[];
  actors?: string[];
  productionCompany?: string | null;
  originalLanguage?: string | null;
  platforms?: string[];
  /** ISO string. Usado por la categoria "Recien agregadas" del modo
   *  carrusel — no relacionado con `anio` (año de estreno). */
  createdAt?: string;
}

export interface UniverseGroup {
  type: 'universe';
  universoId: number;
  universoNombre: string;
  series: SerieData[];
}

export interface SingleSerie {
  type: 'single';
  serie: SerieData;
}

export type CatalogItem = UniverseGroup | SingleSerie;
