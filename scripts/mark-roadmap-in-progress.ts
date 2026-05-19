// Marca como IN_PROGRESS los items del roadmap post-/perfil:
//   #109 pagina agregar serie
//   #110 AI integration
//   #111 precarga IMDB/MDL
//   #112 score de completitud
//
// Seguro por defecto: DRY-RUN. Imprime que haria (incluyendo el title
// real de cada item para que verifiques que los IDs son correctos) y
// NO escribe nada. Para aplicar de verdad, correr con --apply.
//
// Idempotente: solo toca items en estado OPEN. Si ya estan IN_PROGRESS,
// COMPLETED o REJECTED, los saltea y lo informa (no revierte nada).
//
// Uso:
//   npx tsx scripts/mark-roadmap-in-progress.ts            # dry-run
//   npx tsx scripts/mark-roadmap-in-progress.ts --apply     # aplica

import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

const TARGET_IDS = [109, 110, 111, 112];
const APPLY = process.argv.includes('--apply');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(
    APPLY
      ? '=== APLICANDO cambios (status -> IN_PROGRESS) ==='
      : '=== DRY-RUN (sin escribir — usar --apply para aplicar) ==='
  );

  const items = await prisma.featureRequest.findMany({
    where: { id: { in: TARGET_IDS } },
    select: { id: true, title: true, status: true },
  });

  const found = new Set(items.map((i) => i.id));
  for (const id of TARGET_IDS) {
    if (!found.has(id)) console.log(`  [#${id}] NO EXISTE en la DB — revisar`);
  }

  let changed = 0;
  let skipped = 0;
  for (const it of items) {
    const label = `[#${it.id}] "${it.title.slice(0, 70)}" (${it.status})`;
    if (it.status !== 'OPEN') {
      console.log(`  SKIP ${label} — no esta OPEN, no se toca`);
      skipped++;
      continue;
    }
    if (APPLY) {
      await prisma.featureRequest.update({
        where: { id: it.id },
        data: { status: 'IN_PROGRESS' },
      });
      console.log(`  OK   ${label} -> IN_PROGRESS`);
    } else {
      console.log(`  WOULD ${label} -> IN_PROGRESS`);
    }
    changed++;
  }

  console.log(
    `\nResumen: ${changed} ${APPLY ? 'cambiados' : 'a cambiar'}, ${skipped} salteados.`
  );
  if (!APPLY && changed > 0) {
    console.log('Verificá los titles arriba y volvé a correr con --apply.');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
