import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

/**
 * Backfill one-off de FeatureRequest.official.
 *
 * La migracion 20260722040212_add_feature_request_official incluye este mismo
 * UPDATE, pero prod se sincroniza con `prisma db push` (scripts/migrate-supabase.sh),
 * que solo agrega la columna (default false) y NO corre el SQL de la migracion.
 * Este script aplica el backfill en prod: marca como oficiales los items sin
 * autor (los sembrados por seed-feature-requests.ts = roadmap del equipo).
 *
 * IDEMPOTENTE: solo toca los que estan en false. Correr dos veces no cambia nada.
 *
 * Uso: `npx tsx scripts/backfill-feature-request-official.ts`
 */
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  try {
    const candidates = await prisma.featureRequest.count({
      where: { userId: null },
    });
    const alreadyOfficial = await prisma.featureRequest.count({
      where: { official: true },
    });
    console.log(`Candidatos (userId IS NULL): ${candidates}`);
    console.log(`Ya official=true antes: ${alreadyOfficial}`);

    const res = await prisma.featureRequest.updateMany({
      where: { userId: null, official: false },
      data: { official: true },
    });
    console.log(`Actualizados: ${res.count}`);

    const totalOfficial = await prisma.featureRequest.count({
      where: { official: true },
    });
    const officialWithAuthor = await prisma.featureRequest.count({
      where: { userId: { not: null }, official: true },
    });
    console.log(`Total official=true ahora: ${totalOfficial}`);
    console.log(
      `(sanity) official=true CON autor (deberia ser 0): ${officialWithAuthor}`
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
