// Cierra las solicitudes de Flor que ya estan resueltas y desplegadas:
//   #153 Cortos / Duracion  -> 44150c7 + 00a445d
//   #154 Error 'platform'   -> a6c3678
//   #155 Error 'platform'   -> a6c3678
//
// Las tres siguen figurando IN_PROGRESS en el tablero aunque el codigo
// esta en origin/main hace dias, asi que Flor las ve como pendientes.
//
// Seguro por defecto: DRY-RUN. Imprime el title real de cada item para
// que verifiques que los IDs son correctos y NO escribe nada. Para
// aplicar de verdad, correr con --apply.
//
// Idempotente: solo toca items en OPEN o IN_PROGRESS. Si ya estan
// COMPLETED o REJECTED los saltea y lo informa (no revierte nada).
//
// Uso:
//   npx tsx scripts/close-flor-requests-2026-09.ts            # dry-run
//   npx tsx scripts/close-flor-requests-2026-09.ts --apply    # aplica

import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

const TARGET_IDS = [153, 154, 155];
const APPLY = process.argv.includes('--apply');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log(APPLY ? '=== APLICANDO ===\n' : '=== DRY-RUN (sin --apply no escribe nada) ===\n');

  for (const id of TARGET_IDS) {
    const item = await prisma.featureRequest.findUnique({ where: { id } });

    if (!item) {
      console.log(`#${id} NO EXISTE — se saltea`);
      continue;
    }

    if (item.status === 'COMPLETED' || item.status === 'REJECTED') {
      console.log(`#${id} ya esta ${item.status} ("${item.title}") — se saltea`);
      continue;
    }

    console.log(`#${id} "${item.title}": ${item.status} -> COMPLETED`);

    if (APPLY) {
      await prisma.featureRequest.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });
    }
  }

  const activas = await prisma.featureRequest.count({
    where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
  });
  console.log(`\nsolicitudes activas ${APPLY ? 'ahora' : 'actualmente'}: ${activas}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
