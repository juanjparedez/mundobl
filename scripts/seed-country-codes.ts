import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';
import { getCountryCode } from '../src/lib/country-codes';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const countries = await prisma.country.findMany();

  let updated = 0;
  for (const country of countries) {
    const code = getCountryCode(country.name);
    if (!code) {
      console.log(`No code found for "${country.name}" - skipping`);
      continue;
    }
    if (country.code === code) continue; // Already correct

    await prisma.country.update({
      where: { id: country.id },
      data: { code },
    });
    console.log(`Updated "${country.name}" -> ${code}`);
    updated++;
  }

  console.log(`\nDone. Updated ${updated} of ${countries.length} countries.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
