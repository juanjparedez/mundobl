import 'dotenv/config'; // Cargar variables de entorno
import { PrismaClient } from '../src/generated/prisma';

console.log(`📂 DATABASE_URL: ${process.env.DATABASE_URL}`);

// Initialize Prisma Client (Prisma 5)
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

console.log('✅ Prisma client created');

async function main() {
  console.log('\n📊 Testing database connection...\n');

  // Try to fetch all countries
  const countries = await prisma.country.findMany();
  console.log(`✅ Found ${countries.length} countries`);

  // Try to create a test country
  const testCountry = await prisma.country.create({
    data: {
      name: 'Test Country',
    },
  });
  console.log(`✅ Created test country: ${testCountry.name}`);

  // Delete the test country
  await prisma.country.delete({
    where: { id: testCountry.id },
  });
  console.log(`✅ Deleted test country`);

  console.log('\n✨ All tests passed!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
