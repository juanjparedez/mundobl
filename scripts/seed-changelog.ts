/**
 * Script one-time: agrega al changelog las features implementadas en esta sesión.
 *
 * Uso: npx tsx scripts/seed-changelog.ts
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

const CHANGELOG_ENTRIES = [
  {
    title: 'Tags y etiquetas con autocompletado en formulario de series',
    description:
      'El selector de tags ahora muestra y busca entre las etiquetas existentes mientras se escribe, en vez de requerir el nombre exacto.',
    type: 'feature' as const,
    priority: 'media' as const,
    status: 'completado' as const,
  },
  {
    title: 'Parejas de personajes en el reparto',
    description:
      'Se pueden agrupar actores en parejas asignando el mismo número. La vista de detalle muestra las parejas visualmente agrupadas con un diseño mejorado.',
    type: 'feature' as const,
    priority: 'alta' as const,
    status: 'completado' as const,
  },
  {
    title: 'Selector de posición de imagen mejorado',
    description:
      'El selector de focal point ahora muestra la imagen completa con un recuadro arrastrable del tamaño de la card, más un preview en tiempo real.',
    type: 'feature' as const,
    priority: 'media' as const,
    status: 'completado' as const,
  },
  {
    title: 'Cards de universos rediseñadas',
    description:
      'Los universos ahora tienen el mismo tamaño que las cards normales, se expanden al hacer click para mostrar las series, y se ordenan alfabéticamente junto con el resto.',
    type: 'feature' as const,
    priority: 'media' as const,
    status: 'completado' as const,
  },
  {
    title: '"Basado en" dinámico',
    description:
      'El campo "Basado en" ya no tiene opciones fijas. Ahora se pueden agregar nuevos valores (ej: Manhwa) y buscar entre los existentes.',
    type: 'feature' as const,
    priority: 'media' as const,
    status: 'completado' as const,
  },
  {
    title: 'Verificación de Google Search Console',
    description:
      'Se agregó la meta tag de verificación de Google para el dominio mundobl.win.',
    type: 'feature' as const,
    priority: 'baja' as const,
    status: 'completado' as const,
  },
];

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  for (const entry of CHANGELOG_ENTRIES) {
    const existing = await prisma.featureRequest.findFirst({
      where: { title: entry.title },
    });

    if (existing) {
      console.log(`Ya existe: "${entry.title}"`);
      continue;
    }

    await prisma.featureRequest.create({ data: entry });
    console.log(`Creado: "${entry.title}"`);
  }

  // También marcar como completado el focal point que ya existía como pendiente
  const focalPoint = await prisma.featureRequest.findFirst({
    where: { title: { contains: 'Focal point' } },
  });
  if (focalPoint && focalPoint.status !== 'completado') {
    await prisma.featureRequest.update({
      where: { id: focalPoint.id },
      data: { status: 'completado' },
    });
    console.log(`Marcado como completado: "${focalPoint.title}"`);
  }

  console.log('Changelog seed completado.');

  await prisma.$disconnect();
  await pool.end();
}

seed().catch((error) => {
  console.error('Error en seed:', error);
  process.exit(1);
});
