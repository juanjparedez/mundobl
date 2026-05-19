// Agregado de completitud del catálogo (#112 fase 2). Reusa la métrica
// pura de series-completeness.ts sobre TODAS las series CURATED y arma
// el reporte que consume el panel admin: promedio, distribución por tier
// y ranking de las más incompletas para priorizar curación.

import { prisma } from './database';
import {
  computeCompleteness,
  completenessTier,
  type CompletenessField,
} from './series-completeness';

export interface CatalogWorstEntry {
  id: number;
  title: string;
  score: number;
  missing: CompletenessField[];
}

export interface CatalogCompletenessReport {
  total: number;
  /** Promedio del score 0-100 sobre el catálogo CURATED. */
  average: number;
  tiers: { low: number; mid: number; high: number };
  /** Las N series con menor score (asc), para curar primero. */
  worst: CatalogWorstEntry[];
}

const WORST_LIMIT = 20;

export async function getCatalogCompletenessReport(): Promise<CatalogCompletenessReport> {
  const series = await prisma.series.findMany({
    where: { origin: 'CURATED' },
    select: {
      id: true,
      title: true,
      synopsis: true,
      imageUrl: true,
      year: true,
      originalTitle: true,
      review: true,
      soundtrack: true,
      country: { select: { id: true } },
      actors: { select: { actorId: true } },
      directors: { select: { directorId: true } },
      tags: { select: { tagId: true } },
    },
  });

  const total = series.length;
  if (total === 0) {
    return {
      total: 0,
      average: 0,
      tiers: { low: 0, mid: 0, high: 0 },
      worst: [],
    };
  }

  const tiers = { low: 0, mid: 0, high: 0 };
  let sum = 0;
  const scored: CatalogWorstEntry[] = [];

  for (const s of series) {
    const { score, missing } = computeCompleteness(s);
    sum += score;
    tiers[completenessTier(score)] += 1;
    scored.push({ id: s.id, title: s.title, score, missing });
  }

  const worst = scored
    .filter((e) => e.score < 100)
    .sort((a, b) => a.score - b.score)
    .slice(0, WORST_LIMIT);

  return {
    total,
    average: Math.round(sum / total),
    tiers,
    worst,
  };
}
