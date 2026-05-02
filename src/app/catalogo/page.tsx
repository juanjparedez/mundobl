export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { getAllSeries } from '@/lib/database';

export const metadata: Metadata = {
  title: 'Catálogo de Series BL y GL',
  description:
    'Explora el catálogo completo de series BL (Boys Love), GL (Girls Love), películas y doramas asiáticos. Filtra por país, año, género y calificación.',
  alternates: {
    canonical: '/catalogo',
  },
  openGraph: {
    title: 'Catálogo de Series BL y GL',
    description:
      'Explora el catálogo completo de series BL, GL y doramas asiáticos.',
    url: '/catalogo',
  },
};
import { auth } from '@/lib/auth';
import { CatalogoClient } from './CatalogoClient';
import './catalogo.css';

export default async function CatalogoPage() {
  const session = await auth();
  const userRole = session?.user?.role || null;

  // Obtener datos reales desde la base de datos
  const seriesDB = await getAllSeries();

  // Transformar datos para las tarjetas
  const seriesData = seriesDB.map((serie) => ({
    id: serie.id.toString(),
    titulo: serie.title,
    pais: serie.country?.name || 'Sin país',
    paisCode: serie.country?.code || null,
    tipo: serie.type,
    formato: serie.format,
    temporadas: serie.seasons.length,
    episodios: serie.seasons.reduce((acc, s) => acc + (s.episodeCount || 0), 0),
    anio: serie.year || 0,
    rating: serie.overallRating,
    observaciones: serie.observations,
    imageUrl: serie.imageUrl,
    imagePosition: serie.imagePosition,
    synopsis: serie.synopsis,
    visto: serie.viewStatus?.[0]?.status === 'VISTA',
    universoId: serie.universeId,
    universoNombre: serie.universe?.name || null,
    productionCompany: serie.productionCompany?.name || null,
    originalLanguage: serie.originalLanguage?.name || null,
    tags: serie.tags.map((st) => ({ id: st.tag.id, name: st.tag.name })),
    genres: serie.genres.map((sg) => ({
      id: sg.genre.id,
      name: sg.genre.name,
    })),
    directors: serie.directors.map((sd) => ({
      id: sd.director.id,
      name: sd.director.name,
    })),
    actors: serie.actors.map((sa) => ({
      id: sa.actor.id,
      name: sa.actor.name,
    })),
  }));

  return (
    <AppLayout>
      <div className="catalogo-page">
        <CatalogoClient series={seriesData} userRole={userRole} />
      </div>
    </AppLayout>
  );
}
