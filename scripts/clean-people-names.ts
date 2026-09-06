/* eslint-disable no-console */
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

/**
 * Higiene de nombres para Director, ProductionCompany y titulos de Series.
 *
 * Contraparte de scripts/merge-duplicate-actors.ts, que solo cubria Actor.
 * Hace dos cosas, en este orden (el orden importa: si trimeas primero,
 * el trim choca contra el @unique del nombre y explota):
 *
 *   1. Fusiona duplicados por nombre normalizado (trim + lowercase).
 *      Canonico = el que tiene mas relaciones; desempate: nombre ya limpio,
 *      luego id mas bajo. Misma logica que /api/directors/merge.
 *   2. Trimea los nombres/titulos que quedan con espacios sobrantes.
 *
 * Uso:
 *   npx tsx scripts/clean-people-names.ts            # dry-run (default)
 *   npx tsx scripts/clean-people-names.ts --apply    # escribe en la DB
 */

const APPLY = process.argv.includes('--apply');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const normalize = (name: string): string => name.trim().toLowerCase();
const isClean = (name: string): boolean => name === name.trim();

interface Row {
  id: number;
  name: string;
  count: number;
}

/** Ordena un grupo de duplicados y devuelve [canonico, ...duplicados]. */
function rank(group: Row[]): Row[] {
  return [...group].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    const cleanA = isClean(a.name);
    const cleanB = isClean(b.name);
    if (cleanA !== cleanB) return cleanA ? -1 : 1;
    return a.id - b.id;
  });
}

function groupByNormalized(rows: Row[]): Row[][] {
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const key = normalize(r.name);
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }
  return [...groups.values()].filter((g) => g.length > 1);
}

async function mergeDirectors(): Promise<void> {
  console.log('--- Directores ---');
  const directors = await prisma.director.findMany({
    select: { id: true, name: true, _count: { select: { series: true } } },
  });
  const rows: Row[] = directors.map((d) => ({
    id: d.id,
    name: d.name,
    count: d._count.series,
  }));
  const dupGroups = groupByNormalized(rows);
  console.log(`Total: ${rows.length} | grupos duplicados: ${dupGroups.length}`);

  for (const group of dupGroups) {
    const [canonical, ...dups] = rank(group);
    const target = canonical.name.trim();
    console.log(
      `[${target}] canonico #${canonical.id} "${canonical.name}" (${canonical.count}) ` +
        `<- ${dups.map((d) => `#${d.id} "${d.name}" (${d.count})`).join(', ')}`
    );
    if (!APPLY) continue;

    await prisma.$transaction(async (tx) => {
      for (const d of dups) {
        // SeriesDirector tiene @@unique([seriesId, directorId]): si el
        // canonico ya dirige esa serie, el vinculo duplicado se borra.
        const links = await tx.seriesDirector.findMany({
          where: { directorId: d.id },
        });
        for (const link of links) {
          const existing = await tx.seriesDirector.findFirst({
            where: { seriesId: link.seriesId, directorId: canonical.id },
          });
          if (existing) {
            await tx.seriesDirector.delete({ where: { id: link.id } });
          } else {
            await tx.seriesDirector.update({
              where: { id: link.id },
              data: { directorId: canonical.id },
            });
          }
        }
        await tx.director.delete({ where: { id: d.id } });
      }
      if (!isClean(canonical.name)) {
        await tx.director.update({
          where: { id: canonical.id },
          data: { name: target },
        });
      }
    });
  }
}

async function mergeProductionCompanies(): Promise<void> {
  console.log('\n--- Productoras ---');
  const companies = await prisma.productionCompany.findMany({
    select: { id: true, name: true, _count: { select: { series: true } } },
  });
  const rows: Row[] = companies.map((c) => ({
    id: c.id,
    name: c.name,
    count: c._count.series,
  }));
  const dupGroups = groupByNormalized(rows);
  console.log(`Total: ${rows.length} | grupos duplicados: ${dupGroups.length}`);

  for (const group of dupGroups) {
    const [canonical, ...dups] = rank(group);
    const target = canonical.name.trim();
    console.log(
      `[${target}] canonico #${canonical.id} "${canonical.name}" (${canonical.count}) ` +
        `<- ${dups.map((d) => `#${d.id} "${d.name}" (${d.count})`).join(', ')}`
    );
    if (!APPLY) continue;

    await prisma.$transaction(async (tx) => {
      for (const d of dups) {
        // Series.productionCompanyId es 1-a-N: se repuntan las series y
        // recien despues se borra la compania duplicada.
        await tx.series.updateMany({
          where: { productionCompanyId: d.id },
          data: { productionCompanyId: canonical.id },
        });
        await tx.productionCompany.delete({ where: { id: d.id } });
      }
      if (!isClean(canonical.name)) {
        await tx.productionCompany.update({
          where: { id: canonical.id },
          data: { name: target },
        });
      }
    });
  }
}

/** Trim final de lo que quedo con espacios y ya no colisiona con nadie. */
async function trimLeftovers(): Promise<void> {
  console.log('\n--- Trim de sobrantes ---');

  const actors = await prisma.actor.findMany({
    select: { id: true, name: true },
  });
  const directors = await prisma.director.findMany({
    select: { id: true, name: true },
  });
  const companies = await prisma.productionCompany.findMany({
    select: { id: true, name: true },
  });
  const series = await prisma.series.findMany({
    select: { id: true, title: true },
  });

  const dirtyActors = actors.filter((a) => !isClean(a.name));
  const dirtyDirectors = directors.filter((d) => !isClean(d.name));
  const dirtyCompanies = companies.filter((c) => !isClean(c.name));
  const dirtySeries = series.filter((s) => !isClean(s.title));

  console.log(
    `actores: ${dirtyActors.length} | directores: ${dirtyDirectors.length} | ` +
      `productoras: ${dirtyCompanies.length} | series: ${dirtySeries.length}`
  );

  if (!APPLY) return;

  for (const a of dirtyActors) {
    await prisma.actor.update({
      where: { id: a.id },
      data: { name: a.name.trim() },
    });
  }
  for (const d of dirtyDirectors) {
    await prisma.director.update({
      where: { id: d.id },
      data: { name: d.name.trim() },
    });
  }
  for (const c of dirtyCompanies) {
    await prisma.productionCompany.update({
      where: { id: c.id },
      data: { name: c.name.trim() },
    });
  }
  for (const s of dirtySeries) {
    await prisma.series.update({
      where: { id: s.id },
      data: { title: s.title.trim() },
    });
  }
  console.log('Trim aplicado.');
}

async function main() {
  console.log(
    `=== Higiene de nombres ${APPLY ? '(APPLY)' : '(DRY-RUN)'} ===\n`
  );
  await mergeDirectors();
  await mergeProductionCompanies();
  await trimLeftovers();
  console.log(
    APPLY ? '\nListo.' : '\nDry-run. Correr con --apply para escribir.'
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
