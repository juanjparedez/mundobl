export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { getAllSeries } from '@/lib/database';
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
    imagePosition: serie.imagePosition,
    synopsis: serie.synopsis,
    visto: serie.viewStatus?.[0]?.status === 'VISTA',
    isFavorite: serie.isFavorite,
    universoId: serie.universeId,
    universoNombre: serie.universe?.name || null,
  }));

  return (
    <AppLayout>
      <div className="catalogo-page">
        <CatalogoClient series={seriesData} />
      </div>
    </AppLayout>
  );
}
