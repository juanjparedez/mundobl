import 'dotenv/config';
import { prisma } from '../src/lib/database';

/**
 * Suscribe a sus avisos a quien YA sigue una serie (fila de serie en VIENDO
 * o RETOMAR) y no tiene la suscripcion.
 *
 * Desde la tarea 1.4 del plan, empezar a seguir una serie suscribe solo
 * (ver subscribeOnFirstTrack en src/lib/tracking.ts). Esto cubre a quienes
 * empezaron antes de ese cambio: sin la suscripcion, el aviso de capitulo
 * disponible no les llegaria.
 *
 * Dry-run por defecto. Para escribir: `npx tsx scripts/backfill-series-subscriptions.ts --apply`
 * Lo corre Juan. Quien no quiera los avisos los apaga con la campanita, que
 * esta a la vista en la ficha y en /ver.
 */
async function main() {
  const apply = process.argv.includes('--apply');

  const following = await prisma.viewStatus.findMany({
    where: {
      seriesId: { not: null },
      userId: { not: null },
      status: { in: ['VIENDO', 'RETOMAR'] },
    },
    select: { userId: true, seriesId: true },
  });

  const subscribed = await prisma.seriesSubscription.findMany({
    select: { userId: true, seriesId: true },
  });
  const has = new Set(subscribed.map((s) => `${s.userId}:${s.seriesId}`));

  const missing = following
    .filter((f) => !has.has(`${f.userId}:${f.seriesId}`))
    .map((f) => ({
      userId: f.userId as string,
      seriesId: f.seriesId as number,
    }));

  const users = new Set(missing.map((m) => m.userId)).size;
  console.log(
    `Siguen series sin estar suscriptos: ${missing.length} pares, ${users} usuarios.`
  );

  if (!apply) {
    console.log('Dry-run: no se escribio nada. Con --apply se crean.');
    return;
  }

  const { count } = await prisma.seriesSubscription.createMany({
    data: missing,
    skipDuplicates: true,
  });
  console.log(`Suscripciones creadas: ${count}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
