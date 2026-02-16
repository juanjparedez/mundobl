import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { getAllSeries, getAllCountries } from '@/lib/database';
import { PageTitleClient } from '@/components/common/PageTitle/PageTitleClient';
import './admin.css';
import { AdminTableClient } from './AdminTableClient';

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
}

export default async function AdminPage() {
  // Obtener datos reales desde la base de datos
  const [seriesDB, countriesDB] = await Promise.all([
    getAllSeries(),
    getAllCountries(),
  ]);

  // Transformar países para el select
  const countries = countriesDB.map((c) => ({ id: c.id, name: c.name }));

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
  }));

  return (
    <AppLayout>
      <div className="admin-page">
        <div className="admin-header">
          <PageTitleClient level={2}>Administración de Series</PageTitleClient>
        </div>

        <div className="admin-content">
          <AdminTableClient data={seriesData} countries={countries} />
        </div>
      </div>
    </AppLayout>
  );
}
