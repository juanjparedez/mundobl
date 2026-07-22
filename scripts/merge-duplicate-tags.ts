/* eslint-disable no-console */
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

/**
 * Fusiona tags duplicados por normalización (trim + case-insensitive).
 *
 * Ej: "Reencuentro" (45 series) y "Reencuentro " (3 series, espacio al final)
 * son el mismo tag → mueve las series al canónico, borra el duplicado y
 * deja el nombre trimmeado. Mismo criterio que /api/tags/merge (maneja el
 * @@unique([seriesId, tagId]) borrando el SeriesTag redundante).
 *
 * Canónico de cada grupo: el que tiene MÁS series (desempate: nombre ya
 * limpio, luego id más bajo) → minimiza movimientos.
 *
 * Uso:
 *   npx tsx scripts/merge-duplicate-tags.ts            # dry-run (default)
 *   npx tsx scripts/merge-duplicate-tags.ts --apply    # fusiona en DB
 */

const APPLY = process.argv.includes('--apply');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface TagRow {
  id: number;
  name: string;
  count: number;
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

function isClean(name: string): boolean {
  return name === name.trim();
}

async function main() {
  console.log(
    `=== Merge duplicate tags ${APPLY ? '(APPLY)' : '(DRY-RUN)'} ===\n`
  );

  const tags = await prisma.tag.findMany({
    select: { id: true, name: true, _count: { select: { series: true } } },
  });
  const rows: TagRow[] = tags.map((t) => ({
    id: t.id,
    name: t.name,
    count: t._count.series,
  }));

  const groups = new Map<string, TagRow[]>();
  for (const r of rows) {
    const key = normalize(r.name);
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }

  const dupGroups = [...groups.values()].filter((g) => g.length > 1);
  console.log(
    `Total tags: ${rows.length} | grupos duplicados: ${dupGroups.length}\n`
  );

  let mergedTags = 0;
  let renamedTags = 0;

  for (const group of dupGroups) {
    const sorted = [...group].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count; // más series primero
      const cleanA = isClean(a.name);
      const cleanB = isClean(b.name);
      if (cleanA !== cleanB) return cleanA ? -1 : 1; // nombre ya limpio primero
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
        const seriesTags = await tx.seriesTag.findMany({
          where: { tagId: d.id },
        });
        for (const st of seriesTags) {
          const existing = await tx.seriesTag.findFirst({
            where: { seriesId: st.seriesId, tagId: canonical.id },
          });
          if (existing) {
            await tx.seriesTag.delete({ where: { id: st.id } });
          } else {
            await tx.seriesTag.update({
              where: { id: st.id },
              data: { tagId: canonical.id },
            });
          }
        }
        await tx.tag.delete({ where: { id: d.id } });
        mergedTags++;
      }
      // Trimmear el canónico si quedó con espacios (seguro: cualquier otro tag
      // con ese nombre ya fue fusionado en este grupo).
      if (!isClean(canonical.name)) {
        await tx.tag.update({
          where: { id: canonical.id },
          data: { name: target },
        });
        renamedTags++;
      }
    });
  }

  if (APPLY) {
    console.log(
      `\nAplicado: ${mergedTags} tags fusionados, ${renamedTags} canónicos trimmeados.`
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
