import 'dotenv/config';
import { prisma } from '../src/lib/database';
import { awardAllAchievements } from '../src/lib/achievement-store';

/**
 * Guarda en UserAchievement los logros que cada usuario ya cumple. Antes de
 * la migracion 20261028040000_user_achievements los logros se recalculaban
 * en cada carga del perfil y no se guardaban; desde ahi se otorgan al
 * momento de la accion.
 *
 * Las filas quedan con la fecha en que corre el script: la fecha real en que
 * se cumplio cada logro no estaba registrada. No avisa al usuario (no es
 * algo que acaba de lograr). Es idempotente: lo ya guardado no se toca.
 *
 * npm run migrate:supabase lo corre solo, justo despues de aplicar esa
 * migracion. A mano: `npx tsx scripts/backfill-achievements.ts --apply`
 * (sin --apply solo cuenta usuarios).
 */
async function main() {
  const apply = process.argv.includes('--apply');
  const users = await prisma.user.findMany({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!apply) {
    console.log(`Dry-run: ${users.length} usuarios. Usar --apply.`);
    return;
  }

  let stored = 0;
  let withNew = 0;
  for (const [index, user] of users.entries()) {
    const keys = await awardAllAchievements(user.id, { notify: false });
    stored += keys.length;
    if (keys.length > 0) withNew++;
    if ((index + 1) % 50 === 0)
      console.log(`  ${index + 1}/${users.length} usuarios`);
  }
  console.log(
    `Logros guardados: ${stored} (${withNew} de ${users.length} usuarios).`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
