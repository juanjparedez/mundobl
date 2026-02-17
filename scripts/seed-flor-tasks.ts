import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const florTasks = [
  {
    title: 'Estados de series: Abandonada, Retomar, Vista, Viendo ahora',
    description:
      'Reemplazar el sistema de booleans (watched/currentlyWatching) por un enum con 5 estados: Sin ver, Viendo, Vista, Abandonada, Retomar.',
    type: 'feature',
    status: 'completado',
    priority: 'alta',
  },
  {
    title: 'Permitir temporadas y episodios en Especiales',
    description:
      'Los contenidos de tipo "especial" ahora soportan temporadas y episodios, igual que las series.',
    type: 'feature',
    status: 'completado',
    priority: 'media',
  },
  {
    title: 'Fix layout de universos con más de 3 títulos',
    description:
      'Corregido el panel de expansión de universos para que no afecte el tamaño de las cards adyacentes en el grid.',
    type: 'bug',
    status: 'completado',
    priority: 'media',
  },
  {
    title: 'Cambiar label "Duración (Minutos)" a "Minutos"',
    description:
      'En el formulario de episodios, el label del campo de duración ahora dice simplemente "Minutos".',
    type: 'feature',
    status: 'completado',
    priority: 'baja',
  },
];

async function main() {
  console.log('Insertando tareas de Flor como completadas...');

  for (const task of florTasks) {
    const created = await prisma.featureRequest.create({
      data: task,
    });
    console.log(`  OK ${created.title} (id: ${created.id})`);
  }

  console.log('\nListo! Las 4 tareas apareceran en el Changelog de Feedback.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
