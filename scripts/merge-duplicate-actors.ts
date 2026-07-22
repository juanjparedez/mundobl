/* eslint-disable no-console */
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

/**
 * Fusiona actores duplicados por normalización (trim + case-insensitive).
 *
 * Ej: "Usa Takuma" y " Usa Takuma" (espacio al inicio) son el mismo actor.
 * Mueve SeriesActor + SeasonActor al canónico (manejando el
 * @@unique([seriesId/seasonId, actorId, character])), borra el duplicado y
 * deja el nombre trimmeado. Misma lógica que /api/actors/merge.
 *
 * Canónico: el que tiene más relaciones (SeriesActor + SeasonActor); desempate
 * nombre ya limpio, luego id más bajo.
 *
 * Uso:
 *   npx tsx scripts/merge-duplicate-actors.ts            # dry-run (default)
 *   npx tsx scripts/merge-duplicate-actors.ts --apply    # fusiona en DB
 */

const APPLY = process.argv.includes('--apply');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface ActorRow {
  id: number;
  name: string;
  count: number;
}

const normalize = (name: string): string => name.trim().toLowerCase();
const isClean = (name: string): boolean => name === name.trim();

async function main() {
  console.log(
    `=== Merge duplicate actors ${APPLY ? '(APPLY)' : '(DRY-RUN)'} ===\n`
  );

  const actors = await prisma.actor.findMany({
    select: {
      id: true,
      name: true,
      _count: { select: { series: true, seasons: true } },
    },
  });
  const rows: ActorRow[] = actors.map((a) => ({
    id: a.id,
    name: a.name,
    count: a._count.series + a._count.seasons,
  }));

  const groups = new Map<string, ActorRow[]>();
  for (const r of rows) {
    const key = normalize(r.name);
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }

  const dupGroups = [...groups.values()].filter((g) => g.length > 1);
  console.log(
    `Total actores: ${rows.length} | grupos duplicados: ${dupGroups.length}\n`
  );

  let mergedActors = 0;
  let renamedActors = 0;

  for (const group of dupGroups) {
    const sorted = [...group].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const cleanA = isClean(a.name);
      const cleanB = isClean(b.name);
      if (cleanA !== cleanB) return cleanA ? -1 : 1;
      return a.id - b.id;
    });
    const canonical = sorted[0];
    const dups = sorted.slice(1);
    const target = canonical.name.trim();

    console.log(
      `[${target}] canónico #${canonical.id} "${canonical.name}" (${canonical.count}) ` +
        `← ${dups.map((d) => `#${d.id} "${d.name}" (${d.count})`).join(', ')}` +
        `${!isClean(canonical.name) ? '  [+trim canónico]' : ''}`
    );

    if (!APPLY) continue;

    await prisma.$transaction(async (tx) => {
      for (const d of dups) {
        // SeriesActor: source → target (unique seriesId+actorId+character)
        const seriesActors = await tx.seriesActor.findMany({
          where: { actorId: d.id },
        });
        for (const sa of seriesActors) {
          const existing = await tx.seriesActor.findFirst({
            where: {
              seriesId: sa.seriesId,
              actorId: canonical.id,
              character: sa.character,
            },
          });
          if (existing) {
            await tx.seriesActor.delete({ where: { id: sa.id } });
          } else {
            await tx.seriesActor.update({
              where: { id: sa.id },
              data: { actorId: canonical.id },
            });
          }
        }

        // SeasonActor: source → target (unique seasonId+actorId+character)
        const seasonActors = await tx.seasonActor.findMany({
          where: { actorId: d.id },
        });
        for (const sa of seasonActors) {
          const existing = await tx.seasonActor.findFirst({
            where: {
              seasonId: sa.seasonId,
              actorId: canonical.id,
              character: sa.character,
            },
          });
          if (existing) {
            await tx.seasonActor.delete({ where: { id: sa.id } });
          } else {
            await tx.seasonActor.update({
              where: { id: sa.id },
              data: { actorId: canonical.id },
            });
          }
        }

        await tx.actor.delete({ where: { id: d.id } });
        mergedActors++;
      }
      if (!isClean(canonical.name)) {
        await tx.actor.update({
          where: { id: canonical.id },
          data: { name: target },
        });
        renamedActors++;
      }
    });
  }

  if (APPLY) {
    console.log(
      `\nAplicado: ${mergedActors} actores fusionados, ${renamedActors} canónicos trimmeados.`
    );
  } else {
    console.log('\nDry-run. Revisar y correr con --apply para fusionar.');
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
