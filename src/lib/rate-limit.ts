/**
 * Helpers livianos de rate limiting basados en conteos de Prisma sobre
 * la propia tabla afectada — no requiere tabla auxiliar. Cada helper es
 * especifico a una accion. Para algo mas general (multiples acciones por
 * user), considerar Redis o una tabla UserActionLog.
 */

import { prisma } from './database';

export interface RateLimitOk {
  ok: true;
}

export interface RateLimitBlocked {
  ok: false;
  reason: string;
  retryAfterSeconds: number;
}

export type RateLimitResult = RateLimitOk | RateLimitBlocked;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const PER_HOUR = 5;
const PER_DAY = 20;

/**
 * Limita aportes de series USER_EMBED por usuario: max 5 por hora,
 * 20 por dia. Se calcula contando Series del submitter con createdAt
 * dentro de la ventana.
 */
export async function checkUserEmbedRateLimit(
  userId: string
): Promise<RateLimitResult> {
  const now = Date.now();
  const oneHourAgo = new Date(now - HOUR_MS);
  const oneDayAgo = new Date(now - DAY_MS);

  const [hourlyCount, dailyCount] = await Promise.all([
    prisma.series.count({
      where: { submittedById: userId, createdAt: { gte: oneHourAgo } },
    }),
    prisma.series.count({
      where: { submittedById: userId, createdAt: { gte: oneDayAgo } },
    }),
  ]);

  if (hourlyCount >= PER_HOUR) {
    return {
      ok: false,
      reason: `Maximo ${PER_HOUR} aportes por hora. Esperá un rato.`,
      retryAfterSeconds: Math.ceil(HOUR_MS / 1000),
    };
  }
  if (dailyCount >= PER_DAY) {
    return {
      ok: false,
      reason: `Maximo ${PER_DAY} aportes por dia. Volvé manana.`,
      retryAfterSeconds: Math.ceil(DAY_MS / 1000),
    };
  }

  return { ok: true };
}
