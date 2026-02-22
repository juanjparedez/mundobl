import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';
import {
  isSupabaseUrl,
  downloadAndUploadExternalImage,
} from '../src/lib/supabase';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface MigrationResult {
  migrated: number;
  skipped: number;
  failures: Array<{ id: number; name: string; error: string }>;
}

async function migrateEntity(
  entityName: string,
  folder: string,
  findMany: () => Promise<Array<{ id: number; name: string; imageUrl: string | null }>>,
  update: (id: number, imageUrl: string) => Promise<void>
): Promise<MigrationResult> {
  const items = await findMany();
  console.log(`\n--- ${entityName} ---`);
  console.log(`Found ${items.length} with imageUrl`);

  let migrated = 0;
  let skipped = 0;
  const failures: MigrationResult['failures'] = [];

  for (const item of items) {
    if (!item.imageUrl || isSupabaseUrl(item.imageUrl)) {
      skipped++;
      continue;
    }

    try {
      const newUrl = await downloadAndUploadExternalImage(item.imageUrl, folder);
      await update(item.id, newUrl);
      migrated++;
      console.log(`[${migrated}] Migrated "${item.name}" -> ${newUrl}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      failures.push({ id: item.id, name: item.name, error: msg });
      console.error(`FAILED "${item.name}": ${msg}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(
    `${entityName}: ${migrated} migrated, ${skipped} already in Supabase, ${failures.length} failed`
  );

  return { migrated, skipped, failures };
}

async function main() {
  console.log('Starting image migration to Supabase...\n');

  const results: Record<string, MigrationResult> = {};

  // Series
  results['Series'] = await migrateEntity(
    'Series',
    'series',
    async () => {
      const items = await prisma.series.findMany({
        where: { imageUrl: { not: null } },
        select: { id: true, title: true, imageUrl: true },
      });
      return items.map((i) => ({ id: i.id, name: i.title, imageUrl: i.imageUrl }));
    },
    async (id, imageUrl) => {
      await prisma.series.update({ where: { id }, data: { imageUrl } });
    }
  );

  // Seasons
  results['Seasons'] = await migrateEntity(
    'Seasons',
    'seasons',
    async () => {
      const items = await prisma.season.findMany({
        where: { imageUrl: { not: null } },
        select: { id: true, title: true, seasonNumber: true, imageUrl: true },
      });
      return items.map((i) => ({
        id: i.id,
        name: i.title || `Season ${i.seasonNumber}`,
        imageUrl: i.imageUrl,
      }));
    },
    async (id, imageUrl) => {
      await prisma.season.update({ where: { id }, data: { imageUrl } });
    }
  );

  // Actors
  results['Actors'] = await migrateEntity(
    'Actors',
    'actors',
    async () => {
      const items = await prisma.actor.findMany({
        where: { imageUrl: { not: null } },
        select: { id: true, name: true, imageUrl: true },
      });
      return items.map((i) => ({ id: i.id, name: i.name, imageUrl: i.imageUrl }));
    },
    async (id, imageUrl) => {
      await prisma.actor.update({ where: { id }, data: { imageUrl } });
    }
  );

  // Directors
  results['Directors'] = await migrateEntity(
    'Directors',
    'directors',
    async () => {
      const items = await prisma.director.findMany({
        where: { imageUrl: { not: null } },
        select: { id: true, name: true, imageUrl: true },
      });
      return items.map((i) => ({ id: i.id, name: i.name, imageUrl: i.imageUrl }));
    },
    async (id, imageUrl) => {
      await prisma.director.update({ where: { id }, data: { imageUrl } });
    }
  );

  // Universes
  results['Universes'] = await migrateEntity(
    'Universes',
    'universes',
    async () => {
      const items = await prisma.universe.findMany({
        where: { imageUrl: { not: null } },
        select: { id: true, name: true, imageUrl: true },
      });
      return items.map((i) => ({ id: i.id, name: i.name, imageUrl: i.imageUrl }));
    },
    async (id, imageUrl) => {
      await prisma.universe.update({ where: { id }, data: { imageUrl } });
    }
  );

  // Production Companies
  results['ProductionCompanies'] = await migrateEntity(
    'Production Companies',
    'productoras',
    async () => {
      const items = await prisma.productionCompany.findMany({
        where: { imageUrl: { not: null } },
        select: { id: true, name: true, imageUrl: true },
      });
      return items.map((i) => ({ id: i.id, name: i.name, imageUrl: i.imageUrl }));
    },
    async (id, imageUrl) => {
      await prisma.productionCompany.update({ where: { id }, data: { imageUrl } });
    }
  );

  // Recommended Sites
  results['RecommendedSites'] = await migrateEntity(
    'Recommended Sites',
    'sitios',
    async () => {
      const items = await prisma.recommendedSite.findMany({
        where: { imageUrl: { not: null } },
        select: { id: true, name: true, imageUrl: true },
      });
      return items.map((i) => ({ id: i.id, name: i.name, imageUrl: i.imageUrl }));
    },
    async (id, imageUrl) => {
      await prisma.recommendedSite.update({ where: { id }, data: { imageUrl } });
    }
  );

  // Summary
  console.log('\n========== MIGRATION SUMMARY ==========');
  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const [entity, result] of Object.entries(results)) {
    totalMigrated += result.migrated;
    totalSkipped += result.skipped;
    totalFailed += result.failures.length;
    if (result.failures.length > 0) {
      console.log(`\n${entity} failures:`);
      for (const f of result.failures) {
        console.log(`  - [${f.id}] "${f.name}": ${f.error}`);
      }
    }
  }

  console.log(`\nTotal: ${totalMigrated} migrated, ${totalSkipped} skipped, ${totalFailed} failed`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
