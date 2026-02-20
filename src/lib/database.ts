/**
 * Database helper functions for MundoBL
 *
 * Este archivo proporciona funciones helpers para acceso fácil y type-safe
 * a la base de datos usando Prisma.
 */

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';

// Singleton pattern para PrismaClient
// Esto evita crear múltiples instancias del cliente en desarrollo
const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ============================================
// SERIES
// ============================================

/**
 * Obtener todas las series con información básica
 */
export async function getAllSeries() {
  return await prisma.series.findMany({
    include: {
      country: true,
      universe: true,
      seasons: {
        select: {
          id: true,
          seasonNumber: true,
          episodeCount: true,
        },
      },
      viewStatus: {
        select: {
          status: true,
        },
        take: 1,
      },
    },
    orderBy: {
      title: 'asc',
    },
  });
}

/**
 * Obtener una serie por ID con toda la información
 */
export async function getSeriesById(id: number) {
  return await prisma.series.findUnique({
    where: { id },
    include: {
      country: true,
      universe: true,
      seasons: {
        include: {
          actors: {
            include: {
              actor: true,
            },
          },
          episodes: {
            include: {
              viewStatus: true,
              comments: true,
            },
            orderBy: {
              episodeNumber: 'asc',
            },
          },
          ratings: true,
          comments: true,
          viewStatus: true,
        },
        orderBy: {
          seasonNumber: 'asc',
        },
      },
      actors: {
        include: {
          actor: true,
        },
      },
      directors: {
        include: {
          director: true,
        },
      },
      ratings: true,
      comments: true,
      viewStatus: true,
      tags: {
        include: {
          tag: true,
        },
      },
      productionCompany: true,
      originalLanguage: true,
      dubbings: {
        include: {
          language: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
      watchLinks: true,
      relatedSeriesFrom: {
        include: {
          relatedSeries: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              year: true,
              type: true,
            },
          },
        },
      },
      relatedSeriesTo: {
        include: {
          mainSeries: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              year: true,
              type: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Buscar series por título
 */
export async function searchSeriesByTitle(query: string) {
  return await prisma.series.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { originalTitle: { contains: query } },
      ],
    },
    include: {
      country: true,
      seasons: {
        select: {
          id: true,
          seasonNumber: true,
        },
      },
    },
    orderBy: {
      title: 'asc',
    },
  });
}

/**
 * Filtrar series por país
 */
export async function getSeriesByCountry(countryId: number) {
  return await prisma.series.findMany({
    where: { countryId },
    include: {
      country: true,
      seasons: true,
    },
    orderBy: {
      title: 'asc',
    },
  });
}

/**
 * Filtrar series por tipo (serie, pelicula, corto, etc.)
 */
export async function getSeriesByType(type: string) {
  return await prisma.series.findMany({
    where: { type },
    include: {
      country: true,
      seasons: true,
    },
    orderBy: {
      title: 'asc',
    },
  });
}

/**
 * Obtener series de un universo
 */
export async function getSeriesByUniverse(universeId: number) {
  return await prisma.series.findMany({
    where: { universeId },
    include: {
      country: true,
      seasons: true,
    },
    orderBy: {
      year: 'asc',
    },
  });
}

// ============================================
// ACTORES
// ============================================

/**
 * Obtener todos los actores
 */
export async function getAllActors() {
  return await prisma.actor.findMany({
    orderBy: {
      name: 'asc',
    },
  });
}

/**
 * Obtener un actor por ID con sus series
 */
export async function getActorById(id: number) {
  return await prisma.actor.findUnique({
    where: { id },
    include: {
      series: {
        include: {
          series: {
            include: {
              country: true,
            },
          },
        },
      },
      seasons: {
        include: {
          season: {
            include: {
              series: {
                include: {
                  country: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Buscar actores por nombre
 */
export async function searchActorsByName(query: string) {
  return await prisma.actor.findMany({
    where: {
      OR: [{ name: { contains: query } }, { stageName: { contains: query } }],
    },
    orderBy: {
      name: 'asc',
    },
  });
}

/**
 * Obtener todos los actores con conteo de series/temporadas
 */
export async function getAllActorsWithCount() {
  return await prisma.actor.findMany({
    include: {
      _count: { select: { series: true, seasons: true } },
    },
    orderBy: { name: 'asc' },
  });
}

// ============================================
// DIRECTORES
// ============================================

/**
 * Obtener todos los directores
 */
export async function getAllDirectors() {
  return await prisma.director.findMany({
    orderBy: { name: 'asc' },
  });
}

/**
 * Obtener todos los directores con conteo de series
 */
export async function getAllDirectorsWithCount() {
  return await prisma.director.findMany({
    include: {
      _count: { select: { series: true } },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Obtener un director por ID con sus series
 */
export async function getDirectorById(id: number) {
  return await prisma.director.findUnique({
    where: { id },
    include: {
      series: {
        include: {
          series: {
            include: {
              country: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Buscar directores por nombre
 */
export async function searchDirectorsByName(query: string) {
  return await prisma.director.findMany({
    where: {
      name: { contains: query },
    },
    orderBy: { name: 'asc' },
  });
}

// ============================================
// PAÍSES
// ============================================

/**
 * Obtener todos los países con conteo de series
 */
export async function getAllCountries() {
  const countries = await prisma.country.findMany({
    include: {
      _count: {
        select: {
          series: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return countries;
}

/**
 * Obtener un país por ID
 */
export async function getCountryById(id: number) {
  return await prisma.country.findUnique({
    where: { id },
    include: {
      series: {
        include: {
          seasons: true,
        },
      },
    },
  });
}

// ============================================
// ESTADÍSTICAS
// ============================================

/**
 * Obtener estadísticas generales de la base de datos
 */
export async function getStats() {
  const [
    totalSeries,
    totalSeasons,
    totalActors,
    totalCountries,
    totalEpisodes,
  ] = await Promise.all([
    prisma.series.count(),
    prisma.season.count(),
    prisma.actor.count(),
    prisma.country.count(),
    prisma.episode.count(),
  ]);

  return {
    totalSeries,
    totalSeasons,
    totalActors,
    totalCountries,
    totalEpisodes,
  };
}

/**
 * Obtener series vistas vs no vistas
 */
export async function getViewStats() {
  const totalWatched = await prisma.viewStatus.count({
    where: { status: 'VISTA' },
  });

  const totalUnwatched = await prisma.viewStatus.count({
    where: { status: 'SIN_VER' },
  });

  return {
    watched: totalWatched,
    unwatched: totalUnwatched,
    total: totalWatched + totalUnwatched,
  };
}

// ============================================
// UNIVERSOS
// ============================================

/**
 * Obtener todos los universos
 */
export async function getAllUniverses() {
  return await prisma.universe.findMany({
    include: {
      _count: {
        select: {
          series: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
}

/**
 * Obtener un universo por ID
 */
export async function getUniverseById(id: number) {
  return await prisma.universe.findUnique({
    where: { id },
    include: {
      series: {
        include: {
          country: true,
          seasons: true,
        },
        orderBy: {
          year: 'asc',
        },
      },
    },
  });
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Cerrar la conexión a la base de datos
 */
export async function disconnect() {
  await prisma.$disconnect();
}
