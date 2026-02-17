import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Listar todas las feature requests para ver IDs
  const all = await prisma.featureRequest.findMany({
    orderBy: { id: 'asc' },
    select: { id: true, title: true, status: true, userId: true },
  });

  console.log('Todas las feature requests:');
  for (const r of all) {
    console.log(`  [${r.id}] ${r.status.padEnd(12)} | user: ${r.userId ?? 'null'} | ${r.title}`);
  }

  // 2. Eliminar los duplicados que cree sin userId (ids 19-22)
  const duplicateIds = [19, 20, 21, 22];
  const deleted = await prisma.featureRequest.deleteMany({
    where: { id: { in: duplicateIds } },
  });
  console.log(`\nEliminados ${deleted.count} duplicados (ids: ${duplicateIds.join(', ')})`);

  // 3. Marcar como completadas las tareas originales de Flor que ya resolvimos
  // Basado en el screenshot: Estado, Especiales, Modificacion (universos)
  // Necesito ver los IDs reales
  const florTasks = all.filter(
    (r) =>
      r.userId !== null &&
      r.status === 'pendiente' &&
      (r.title.toLowerCase().includes('estado') ||
        r.title.toLowerCase().includes('especiales') ||
        r.title.toLowerCase().includes('modificación') ||
        r.title.toLowerCase().includes('modificacion'))
  );

  console.log('\nTareas de Flor a marcar como completadas:');
  for (const task of florTasks) {
    console.log(`  [${task.id}] ${task.title}`);
    await prisma.featureRequest.update({
      where: { id: task.id },
      data: { status: 'completado' },
    });
  }

  console.log('\nListo!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
