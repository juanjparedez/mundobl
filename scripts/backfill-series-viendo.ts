/* eslint-disable no-console */
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

/**
 * Corrige pares (userId, seriesId) que tienen episodios en VISTA pero
 * ninguna fila de serie (o una fila en SIN_VER) — quedaban afuera de
 * /watching hasta T03. Si ya tiene una fila con otro status (VIENDO,
 * VISTA, ABANDONADA, RETOMAR), no se toca: el usuario ya la manejó a mano.
 *
 * Si el usuario vio todos los episodios de la serie, la fila se crea en
 * VISTA (no VIENDO) con watchedDate = max(watchedDate) de sus episodios.
 * Si no, se crea en VIENDO con lastWatchedAt = max(watchedDate).
 *
 * Uso:
 *   npx tsx scripts/backfill-series-viendo.ts            # dry-run (default)
 *   npx tsx scripts/backfill-series-viendo.ts --apply    # corrige en DB
 */

const APPLY = process.argv.includes('--apply');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface PairInfo {
  userId: string;
  seriesId: number;
  watchedCount: number;
  totalEpisodes: number;
  maxWatchedDate: Date;
  currentStatus: string | null;
}

async function main() {
  console.log(
    `=== Backfill series VIENDO ${APPLY ? '(APPLY)' : '(DRY-RUN)'} ===\n`
  );

  const watchedEpisodes = await prisma.viewStatus.findMany({
    where: { status: 'VISTA', episodeId: { not: null }, userId: { not: null } },
    select: {
      userId: true,
      watchedDate: true,
      episode: { select: { season: { select: { seriesId: true } } } },
    },
  });

  const groups = new Map<
    string,
    {
      userId: string;
      seriesId: number;
      watchedCount: number;
      maxWatchedDate: Date;
    }
  >();
  for (const row of watchedEpisodes) {
    if (!row.userId || !row.episode) continue;
    const { seriesId } = row.episode.season;
    const key = `${row.userId}:${seriesId}`;
    const watchedDate = row.watchedDate ?? new Date(0);
    const existing = groups.get(key);
    if (existing) {
      existing.watchedCount += 1;
      if (watchedDate > existing.maxWatchedDate) {
        existing.maxWatchedDate = watchedDate;
      }
    } else {
      groups.set(key, {
        userId: row.userId,
        seriesId,
        watchedCount: 1,
        maxWatchedDate: watchedDate,
      });
    }
  }

  const pairs: PairInfo[] = [];
  for (const g of groups.values()) {
    const [totalEpisodes, seriesStatus] = await Promise.all([
      prisma.episode.count({ where: { season: { seriesId: g.seriesId } } }),
      prisma.viewStatus.findUnique({
        where: { userId_seriesId: { userId: g.userId, seriesId: g.seriesId } },
      }),
    ]);
    if (seriesStatus && seriesStatus.status !== 'SIN_VER') continue;

    pairs.push({
      userId: g.userId,
      seriesId: g.seriesId,
      watchedCount: g.watchedCount,
      totalEpisodes,
      maxWatchedDate: g.maxWatchedDate,
      currentStatus: seriesStatus?.status ?? null,
    });
  }

  console.log(`Pares afectados: ${pairs.length}\n`);
  for (const p of pairs) {
    const allWatched =
      p.totalEpisodes > 0 && p.watchedCount === p.totalEpisodes;
    const newStatus = allWatched ? 'VISTA' : 'VIENDO';
    console.log(
      `user=${p.userId} series=${p.seriesId} vistos=${p.watchedCount}/${p.totalEpisodes} ` +
        `fila_actual=${p.currentStatus ?? '(ninguna)'} -> ${newStatus} ` +
        `(fecha=${p.maxWatchedDate.toISOString()})`
    );
  }

  if (!APPLY) {
    console.log('\nDry-run. Correr con --apply para aplicar los cambios.');
    return;
  }

  for (const p of pairs) {
    const allWatched =
      p.totalEpisodes > 0 && p.watchedCount === p.totalEpisodes;
    await prisma.viewStatus.upsert({
      where: { userId_seriesId: { userId: p.userId, seriesId: p.seriesId } },
      update: allWatched
        ? { status: 'VISTA', watchedDate: p.maxWatchedDate }
        : { status: 'VIENDO', lastWatchedAt: p.maxWatchedDate },
      create: allWatched
        ? {
            userId: p.userId,
            seriesId: p.seriesId,
            status: 'VISTA',
            watchedDate: p.maxWatchedDate,
          }
        : {
            userId: p.userId,
            seriesId: p.seriesId,
            status: 'VIENDO',
            lastWatchedAt: p.maxWatchedDate,
          },
    });
  }

  console.log(
    `\nAplicado: ${pairs.length} filas de serie creadas/actualizadas.`
  );
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
