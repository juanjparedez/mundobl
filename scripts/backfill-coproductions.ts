/* eslint-disable no-console */
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';
import {
  findOrCreateProductionCompany,
  splitProductionCompanyNames,
} from '../src/lib/tag-utils';

/**
 * Backfill de Series.productionCompanyId (1-a-N) a SeriesProductionCompany
 * (muchos-a-muchos), separando las co-producciones.
 *
 * Hasta ahora una serie tenia UNA sola productora, asi que las co-producciones
 * se guardaban como una unica fila con comas en el nombre:
 *   "SETTV, SPO Entertainment, Avex Taiwan"  -> 1 ProductionCompany
 * Este script las parte en companias reales y crea un vinculo por cada una.
 *
 * Ademas backfillea ProductionCompany.countryId (FK) desde el texto libre
 * ProductionCompany.country, matcheando por nombre de Country.
 *
 * NO borra nada: Series.productionCompanyId y ProductionCompany.country quedan
 * intactos. El drop de esas columnas es una migracion posterior, una vez que
 * se verifico que esto quedo bien.
 *
 * Uso:
 *   npx tsx scripts/backfill-coproductions.ts            # dry-run
 *   npx tsx scripts/backfill-coproductions.ts --apply
 */

const APPLY = process.argv.includes('--apply');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function backfillLinks(): Promise<void> {
  console.log('--- Vinculos serie <-> productora ---');

  const series = await prisma.series.findMany({
    where: { productionCompanyId: { not: null } },
    select: {
      id: true,
      title: true,
      productionCompany: { select: { id: true, name: true } },
    },
  });
  console.log(`Series con productora: ${series.length}`);

  let linksCreated = 0;
  const companiesCreated = 0;
  let splitCount = 0;

  for (const s of series) {
    const raw = s.productionCompany?.name;
    if (!raw) continue;

    const names = splitProductionCompanyNames(raw);
    if (names.length > 1) {
      splitCount++;
      console.log(
        `  [split] "${raw}" -> ${names.length}: ${names.join(' | ')}`
      );
    }

    if (!APPLY) {
      linksCreated += names.length;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      for (const name of names) {
        const company = await findOrCreateProductionCompany(tx, name);
        if (!company) continue;
        if (company.name === name && company.id !== s.productionCompany?.id) {
          // puede ser una compania recien creada por el split
        }
        const existing = await tx.seriesProductionCompany.findUnique({
          where: {
            seriesId_productionCompanyId: {
              seriesId: s.id,
              productionCompanyId: company.id,
            },
          },
          select: { id: true },
        });
        if (existing) continue;
        await tx.seriesProductionCompany.create({
          data: { seriesId: s.id, productionCompanyId: company.id },
        });
        linksCreated++;
      }
    });
  }

  console.log(
    `Filas multivalor separadas: ${splitCount} | vinculos ${APPLY ? 'creados' : 'a crear'}: ${linksCreated}` +
      (companiesCreated ? ` | companias nuevas: ${companiesCreated}` : '')
  );
}

async function backfillCountry(): Promise<void> {
  console.log('\n--- ProductionCompany.country (texto) -> countryId (FK) ---');

  const companies = await prisma.productionCompany.findMany({
    where: { country: { not: null }, countryId: null },
    select: { id: true, name: true, country: true },
  });
  const countries = await prisma.country.findMany({
    select: { id: true, name: true },
  });
  const byName = new Map(countries.map((c) => [c.name.toLowerCase(), c.id]));

  let matched = 0;
  const unmatched: string[] = [];

  for (const c of companies) {
    const key = (c.country ?? '').trim().toLowerCase();
    const countryId = byName.get(key);
    if (!countryId) {
      if (key) unmatched.push(`${c.name} -> "${c.country}"`);
      continue;
    }
    matched++;
    if (APPLY) {
      await prisma.productionCompany.update({
        where: { id: c.id },
        data: { countryId },
      });
    }
  }

  console.log(
    `Con pais en texto: ${companies.length} | ${APPLY ? 'matcheadas' : 'matcheables'}: ${matched}`
  );
  if (unmatched.length > 0) {
    console.log(`  Sin match en Country (quedan para revisar a mano):`);
    for (const u of unmatched) console.log(`    ${u}`);
  }
}

async function main() {
  console.log(
    `=== Backfill de co-producciones ${APPLY ? '(APPLY)' : '(DRY-RUN)'} ===\n`
  );
  await backfillLinks();
  await backfillCountry();
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
