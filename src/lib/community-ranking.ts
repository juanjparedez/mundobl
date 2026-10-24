import { prisma } from '@/lib/database';

/**
 * Ranking mensual de la comunidad: capitulos marcados como vistos en los
 * ultimos 30 dias. Se mide por capitulos y no por series terminadas porque
 * casi nadie de la comunidad termina series (ver public-stats.ts): un
 * ranking de terminadas mostraria siempre a las mismas 3 personas.
 *
 * Privacidad: Mi seguimiento le promete al usuario que su tracking es
 * privado. Por eso el ranking publico es anonimo y solo muestra el nombre de
 * quien publico su perfil de comunidad (CommunityProfile.published, el
 * opt-in que ya existe). Cada usuario ve su propia posicion aparte.
 *
 * Fuera del ranking: ADMIN, MODERATOR (el equipo) y cuentas baneadas.
 */
export const RANKING_WINDOW_DAYS = 30;
export const RANKING_SIZE = 10;

export interface RankingEntry {
  rank: number;
  count: number;
  /** Solo con perfil de comunidad publicado; si no, null (anonimo). */
  name: string | null;
  profileId: string | null;
}

export interface OwnRankingPosition {
  /** null: no marco ningun capitulo en la ventana (o es del equipo). */
  rank: number | null;
  count: number;
  /** Cuantas personas de la comunidad entran en el ranking del mes. */
  ranked: number;
  windowDays: number;
}

interface RankedRow {
  userId: string;
  count: bigint;
  rank: bigint;
}

function windowStart(now: Date): Date {
  return new Date(now.getTime() - RANKING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

// RANK() deja huecos en los empates (1, 1, 3): dos personas con el mismo
// numero comparten puesto, y nadie queda "detras" de alguien que vio igual.
async function rankedRows(since: Date): Promise<RankedRow[]> {
  return prisma.$queryRaw<RankedRow[]>`
    SELECT vs."userId" AS "userId",
           COUNT(*) AS count,
           RANK() OVER (ORDER BY COUNT(*) DESC) AS rank
    FROM "ViewStatus" vs
    JOIN "User" u ON u.id = vs."userId"
    WHERE vs.status = 'VISTA'
      AND vs."episodeId" IS NOT NULL
      AND vs."updatedAt" >= ${since}
      AND u.role NOT IN ('ADMIN', 'MODERATOR')
      AND u.banned = false
    GROUP BY vs."userId"
    ORDER BY count DESC, vs."userId" ASC
  `;
}

export async function getMonthlyRanking(
  now: Date = new Date()
): Promise<RankingEntry[]> {
  const top = (await rankedRows(windowStart(now))).slice(0, RANKING_SIZE);
  const profiles = await prisma.communityProfile.findMany({
    where: {
      userId: { in: top.map((row) => row.userId) },
      published: true,
      moderationHidden: false,
    },
    select: { userId: true, publicId: true, displayName: true },
  });
  const byUser = new Map(profiles.map((p) => [p.userId, p]));
  return top.map((row) => {
    const profile = byUser.get(row.userId);
    const name = profile?.displayName.trim() || null;
    return {
      rank: Number(row.rank),
      count: Number(row.count),
      name: profile && name ? name : null,
      profileId: profile && name ? profile.publicId : null,
    };
  });
}

export async function getOwnRankingPosition(
  userId: string,
  now: Date = new Date()
): Promise<OwnRankingPosition> {
  const rows = await rankedRows(windowStart(now));
  const own = rows.find((row) => row.userId === userId);
  return {
    rank: own ? Number(own.rank) : null,
    count: own ? Number(own.count) : 0,
    ranked: rows.length,
    windowDays: RANKING_WINDOW_DAYS,
  };
}
