export const dynamic = 'force-dynamic';

import { getAllSeries, getAllCountries, getAllGenres } from '@/lib/database';
import { PageTitleClient } from '@/components/common/PageTitle/PageTitleClient';
import { AdminNav } from '../AdminNav';
import '../admin.css';
import { AdminTableClient } from '../AdminTableClient';
import { CatalogCompletenessPanel } from './CatalogCompletenessPanel/CatalogCompletenessPanel';

interface SerieData {
  key: string;
  titulo: string;
  pais: string;
  tipo: string;
  temporadas: number;
  episodios: number;
  anio: number;
  estado: string;
  rating: number | null;
  generos: string[];
}

export default async function AdminPage() {
  // Obtener datos reales desde la base de datos
  // Solo lista CURATED — los aportes USER_EMBED viven en /admin/series/user-submitted.
  const [seriesDB, countriesDB, genresDB] = await Promise.all([
    getAllSeries({ origin: 'CURATED' }),
    getAllCountries(),
    getAllGenres(),
  ]);

  // Transformar países y géneros para los filtros
  const countries = countriesDB.map((c) => ({ id: c.id, name: c.name }));
  const genres = genresDB.map((g) => ({ id: g.id, name: g.name }));

  // Transformar datos para la tabla
  const seriesData: SerieData[] = seriesDB.map((serie) => ({
    key: serie.id.toString(),
    titulo: serie.title,
    pais: serie.country?.name || 'Sin país',
    tipo: serie.type,
    temporadas: serie.seasons.length,
    episodios: serie.seasons.reduce((acc, s) => acc + (s.episodeCount || 0), 0),
    anio: serie.year || 0,
    estado:
      serie.type === 'pelicula' || serie.type === 'corto'
        ? 'finalizada'
        : 'activa',
    rating: serie.overallRating,
    generos: serie.genres?.map((g) => g.genre.name) || [],
  }));

  return (
    <>
      <div className="admin-page">
        <AdminNav />
        <div className="admin-header">
          <PageTitleClient level={2}>Administración de Series</PageTitleClient>
        </div>

        <div className="admin-content">
          <CatalogCompletenessPanel />
          <AdminTableClient
            data={seriesData}
            countries={countries}
            genres={genres}
          />
        </div>
      </div>
    </>
  );
}
