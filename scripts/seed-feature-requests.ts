/**
 * Script one-time: inserta las ideas iniciales de ideas.md como FeatureRequests.
 *
 * Uso: npx tsx scripts/seed-feature-requests.ts
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

const INITIAL_REQUESTS = [
  {
    title: 'Nombre de app configurable por variable de entorno',
    description:
      'Hacer que appName sea una variable de entorno para poder personalizar la app y reutilizarla como portfolio.',
    type: 'idea' as const,
    priority: 'baja' as const,
  },
  {
    title: 'Focal point para imágenes de portada en catálogo',
    description:
      'Poder seleccionar qué parte de la imagen se muestra en las cards del catálogo, ya que algunas imágenes al recortarse no quedan bien.',
    type: 'feature' as const,
    priority: 'media' as const,
  },
  {
    title: 'Revisión de protección contra inyección de queries',
    description:
      'Revisar campos de entrada manual para prevenir inyección SQL u otros ataques.',
    type: 'bug' as const,
    priority: 'alta' as const,
  },
];

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  for (const request of INITIAL_REQUESTS) {
    const existing = await prisma.featureRequest.findFirst({
      where: { title: request.title },
    });

    if (existing) {
      console.log(`Ya existe: "${request.title}"`);
      continue;
    }

    await prisma.featureRequest.create({ data: request });
    console.log(`Creado: "${request.title}"`);
  }

  console.log('Seed completado.');

  await prisma.$disconnect();
  await pool.end();
}

seed().catch((error) => {
  console.error('Error en seed:', error);
  process.exit(1);
});
