export interface ActorAdmin {
  id: number;
  name: string;
  stageName?: string | null;
  birthDate?: string | null;
  nationality?: string | null;
  imageUrl?: string | null;
  biography?: string | null;
  _count?: {
    series: number;
    seasons: number;
  };
}

export interface DirectorAdmin {
  id: number;
  name: string;
  nationality?: string | null;
  imageUrl?: string | null;
  biography?: string | null;
  aliases?: string[];
  imdbUrl?: string | null;
  mdlUrl?: string | null;
  wikiUrl?: string | null;
  birthYear?: number | null;
  awards?: string[];
  _count?: {
    series: number;
  };
}
