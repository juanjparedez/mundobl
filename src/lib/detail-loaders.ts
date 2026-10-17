import { cache } from 'react';
import {
  getActorById,
  getDirectorById,
  getSeriesById,
  getWatchableSeriesById,
} from './database';
import { isPlaceholderActor } from './placeholder-actor';

/**
 * Layout, metadata y pagina de una ficha piden lo mismo en el mismo render:
 * con `cache` es una sola consulta. El layout de cada `[id]` los usa para el
 * 404, porque corre antes del loading.tsx; desde la pagina, notFound() llega
 * cuando el esqueleto ya salio con status 200.
 */
export const getSeriesByIdCached = cache(getSeriesById);
export const getWatchableSeriesByIdCached = cache(getWatchableSeriesById);

export const loadPublicActor = cache(async (id: string) => {
  const actorId = Number.parseInt(id, 10);
  if (Number.isNaN(actorId)) return null;
  const actor = await getActorById(actorId);
  // El placeholder "Actor no identificado" agrupa personajes sin interprete
  // conocido: no es una persona y no tiene ficha publica.
  if (!actor || isPlaceholderActor(actor)) return null;
  return actor;
});

export const loadDirector = cache(async (id: string) => {
  const directorId = Number.parseInt(id, 10);
  if (Number.isNaN(directorId)) return null;
  return getDirectorById(directorId);
});
