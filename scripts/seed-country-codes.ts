import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Mapeo de nombres de países a códigos ISO 3166-1 alpha-2
const countryCodes: Record<string, string> = {
  Tailandia: 'th',
  'Corea del Sur': 'kr',
  Corea: 'kr',
  Japón: 'jp',
  Japan: 'jp',
  China: 'cn',
  Taiwán: 'tw',
  Taiwan: 'tw',
  Filipinas: 'ph',
  Vietnam: 'vn',
  Myanmar: 'mm',
  Camboya: 'kh',
  Indonesia: 'id',
  Laos: 'la',
  'Hong Kong': 'hk',
  Malasia: 'my',
  Singapur: 'sg',
  India: 'in',
  'Estados Unidos': 'us',
  'Reino Unido': 'gb',
  España: 'es',
  México: 'mx',
  Argentina: 'ar',
  Brasil: 'br',
  Francia: 'fr',
  Alemania: 'de',
  Italia: 'it',
};

async function main() {
  const countries = await prisma.country.findMany();

  let updated = 0;
  for (const country of countries) {
    if (country.code) continue; // Already has a code

    const code = countryCodes[country.name];
    if (code) {
      await prisma.country.update({
        where: { id: country.id },
        data: { code },
      });
      console.log(`Updated "${country.name}" -> ${code}`);
      updated++;
    } else {
      console.log(`No code found for "${country.name}" - skipping`);
    }
  }

  console.log(`\nDone. Updated ${updated} of ${countries.length} countries.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
