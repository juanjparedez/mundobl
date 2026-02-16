import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { getAllSeries } from '@/lib/database';
import { PageTitleClient } from '@/components/common/PageTitle/PageTitleClient';
import { CatalogoClient } from './CatalogoClient';
import './catalogo.css';

export default async function CatalogoPage() {
  // Obtener datos reales desde la base de datos
  const seriesDB = await getAllSeries();

  // Transformar datos para las tarjetas
  const seriesData = seriesDB.map((serie) => ({
    id: serie.id.toString(),
    titulo: serie.title,
    pais: serie.country?.name || 'Sin país',
    tipo: serie.type,
    temporadas: serie.seasons.length,
    episodios: serie.seasons.reduce((acc, s) => acc + (s.episodeCount || 0), 0),
    anio: serie.year || 0,
    rating: serie.overallRating,
    observaciones: serie.observations,
    imageUrl: serie.imageUrl,
    synopsis: serie.synopsis,
    isFavorite: serie.isFavorite,
  }));

  return (
    <AppLayout>
      <div className="catalogo-page">
        <div className="catalogo-header">
          <PageTitleClient level={2}>Catálogo de Series</PageTitleClient>
        </div>

        <div className="catalogo-content">
          <CatalogoClient series={seriesData} />
        </div>
      </div>
    </AppLayout>
  );
}
