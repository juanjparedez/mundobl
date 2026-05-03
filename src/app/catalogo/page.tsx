export const dynamic = 'force-dynamic';
import { unstable_cache } from 'next/cache';

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
import { getCatalogFilterIndex } from '@/lib/database';
import './catalogo.css';

const getCatalogDataCached = unstable_cache(
  async () => {
    return await Promise.all([getAllSeries(), getCatalogFilterIndex()]);
  },
  ['catalog-page-data-v1'],
  { revalidate: 120 }
);

export default async function CatalogoPage() {
  const session = await auth();
  const userRole = session?.user?.role || null;

  // Obtener datos reales desde la base de datos
  const [seriesDB, filterIndex] = await getCatalogDataCached();

  // Index seriesId -> nombres (para filtros extendidos)
  const genresBySerie = new Map<number, string[]>();
  filterIndex.genres.forEach((sg) => {
    const arr = genresBySerie.get(sg.seriesId) ?? [];
    arr.push(sg.genre.name);
    genresBySerie.set(sg.seriesId, arr);
  });

  const directorsBySerie = new Map<number, string[]>();
  filterIndex.directors.forEach((sd) => {
    const arr = directorsBySerie.get(sd.seriesId) ?? [];
    arr.push(sd.director.name);
    directorsBySerie.set(sd.seriesId, arr);
  });

  const actorsBySerie = new Map<number, string[]>();
  filterIndex.actors.forEach((sa) => {
    const arr = actorsBySerie.get(sa.seriesId) ?? [];
    arr.push(sa.actor.name);
    actorsBySerie.set(sa.seriesId, arr);
  });

  const productionCompanyBySerie = new Map<number, string>();
  filterIndex.productionCompanies.forEach((s) => {
    if (s.productionCompany) {
      productionCompanyBySerie.set(s.id, s.productionCompany.name);
    }
  });

  const languageBySerie = new Map<number, string>();
  filterIndex.languages.forEach((s) => {
    if (s.originalLanguage) {
      languageBySerie.set(s.id, s.originalLanguage.name);
    }
  });

  // Transformar datos para las tarjetas
  const seriesData = seriesDB.map((serie) => {
    const episodiosTotales = serie.seasons.reduce(
      (acc, s) => acc + (s.episodeCount || 0),
      0
    );
    const runtimeHours =
      episodiosTotales > 0
        ? Number(((episodiosTotales * 45) / 60).toFixed(1))
        : 0;

    return {
      id: serie.id.toString(),
      titulo: serie.title,
      pais: serie.country?.name || 'Sin país',
      paisCode: serie.country?.code || null,
      tipo: serie.type,
      formato: serie.format,
      temporadas: serie.seasons.length,
      episodios: episodiosTotales,
      runtimeHours,
      anio: serie.year || 0,
      rating: serie.overallRating,
      observaciones: serie.observations,
      imageUrl: serie.imageUrl,
      imagePosition: serie.imagePosition,
      synopsis: serie.synopsis,
      visto: serie.viewStatus?.[0]?.status === 'VISTA',
      universoId: serie.universeId,
      universoNombre: serie.universe?.name || null,
      tags: serie.tags.map((st) => ({ id: st.tag.id, name: st.tag.name })),
      genres: genresBySerie.get(serie.id) ?? [],
      directors: directorsBySerie.get(serie.id) ?? [],
      actors: actorsBySerie.get(serie.id) ?? [],
      productionCompany: productionCompanyBySerie.get(serie.id) ?? null,
      originalLanguage: languageBySerie.get(serie.id) ?? null,
    };
  });

  return (
    <AppLayout>
      <div className="catalogo-page">
        <CatalogoClient series={seriesData} userRole={userRole} />
      </div>
    </AppLayout>
  );
}
