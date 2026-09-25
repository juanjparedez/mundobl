/* eslint-disable no-console */
import 'dotenv/config';
import { prisma } from '../src/lib/database';
import type { Prisma } from '../src/generated/prisma';

/**
 * Deja las visitas ya guardadas como las nuevas: solo ruta y hora. Borra IP,
 * user-agent y usuario de las filas PAGE_VIEW (tarea 3.1b del plan; es lo que
 * dice /privacidad). No toca los intentos de ataque (ABUSE) ni las acciones
 * del equipo.
 *
 * Dry-run por defecto. Para escribir: `npx tsx scripts/anonymize-page-views.ts --apply`
 * Lo corre Juan. No es reversible.
 */
const BATCH = 10_000;

const WITH_PERSONAL_DATA: Prisma.AccessLogWhereInput = {
  action: 'PAGE_VIEW',
  OR: [
    { ip: { not: null } },
    { userAgent: { not: null } },
    { userId: { not: null } },
  ],
};

async function main() {
  const apply = process.argv.includes('--apply');

  const pending = await prisma.accessLog.count({ where: WITH_PERSONAL_DATA });
  console.log(`Visitas con IP, user-agent o usuario: ${pending}`);

  if (!apply) {
    console.log('Dry-run: no se escribio nada. Para aplicar: --apply');
    return;
  }

  // En tandas por id: un solo UPDATE de ~190 mil filas puede cortarse en el
  // pooler, y asi el progreso queda a la vista.
  let done = 0;
  for (;;) {
    const rows = await prisma.accessLog.findMany({
      where: WITH_PERSONAL_DATA,
      select: { id: true },
      take: BATCH,
    });
    if (rows.length === 0) break;

    const { count } = await prisma.accessLog.updateMany({
      where: { id: { in: rows.map((row) => row.id) } },
      data: { ip: null, userAgent: null, userId: null },
    });
    done += count;
    console.log(`  ${done} / ${pending}`);
  }

  console.log(`Listo: ${done} visitas quedaron sin IP, user-agent ni usuario.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
