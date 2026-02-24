/**
 * Migra los favoritos existentes (Series.isFavorite = true)
 * a la tabla UserFavorite, asignándolos al usuario de Flor.
 *
 * Uso: npx tsx scripts/migrate-favorites.ts
 */
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const FLOR_EMAIL = 'florstratovarius@gmail.com';

async function migrate() {
  const flor = await prisma.user.findUnique({
    where: { email: FLOR_EMAIL },
  });

  if (!flor) {
    console.error(`Usuario con email ${FLOR_EMAIL} no encontrado.`);
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
    });
    console.log('Usuarios disponibles:');
    users.forEach((u) => console.log(`  ${u.email} (${u.name})`));
    process.exit(1);
  }

  console.log(`Usuario encontrado: ${flor.name} (${flor.id})`);

  const favoriteSeries = await prisma.series.findMany({
    where: { isFavorite: true },
    select: { id: true, title: true },
  });

  console.log(`\nSeries favoritas encontradas: ${favoriteSeries.length}`);

  let created = 0;
  let skipped = 0;

  for (const serie of favoriteSeries) {
    try {
      await prisma.userFavorite.create({
        data: {
          userId: flor.id,
          seriesId: serie.id,
        },
      });
      console.log(`  + ${serie.title}`);
      created++;
    } catch {
      console.log(`  ~ ${serie.title} (ya existía)`);
      skipped++;
    }
  }

  console.log(
    `\nMigración completada: ${created} creados, ${skipped} ya existían.`
  );
}

migrate()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
