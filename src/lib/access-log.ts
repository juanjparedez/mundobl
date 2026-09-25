import { prisma } from '@/lib/database';
import { isRuntimeFreezeActive } from '@/lib/runtime-freeze';
import { runCronJob } from '@/lib/cron-runs';

/**
 * Registra una visita (llamado desde el proxy). Solo ruta y hora: sin IP,
 * sin user-agent y sin usuario, aunque haya sesion. Es lo que dice
 * /privacidad; las visitas solo alimentan conteos (activity-by-day).
 * Fire-and-forget: no bloquea el request.
 */
export function logPageView(path: string): void {
  if (isRuntimeFreezeActive('logging')) return;

  prisma.accessLog
    .create({
      data: {
        action: 'PAGE_VIEW',
        path,
        method: 'GET',
      },
    })
    .catch(() => {
      // Silenciar errores de logging para no afectar el request
    });
}

export const ABUSE_ACTION = 'ABUSE';
export const ABUSE_RETENTION_DAYS = 7;
export const LOG_RETENTION_DAYS = 90;

/**
 * Tope de escrituras de abuso: un scanner tira cientos de rutas por minuto y
 * no puede convertirse en cientos de filas. Por ventana (y por instancia),
 * cada IP se anota una sola vez y en total no mas de `maxPerWindow`.
 */
export function createAbuseThrottle(windowMs: number, maxPerWindow: number) {
  const window = { startMs: 0, ips: new Set<string>() };
  return (ip: string, nowMs: number): boolean => {
    if (nowMs - window.startMs >= windowMs) {
      window.startMs = nowMs;
      window.ips.clear();
    }
    if (window.ips.has(ip) || window.ips.size >= maxPerWindow) return false;
    window.ips.add(ip);
    return true;
  };
}

const shouldLogAbuse = createAbuseThrottle(10 * 60 * 1000, 50);

/**
 * Registra un intento de ataque con su IP, para poder bloquearla desde
 * /admin/banned-ips. Es la unica fila con IP que guardamos y vence a los
 * `ABUSE_RETENTION_DAYS` dias (purgeExpiredLogs). /privacidad lo dice.
 */
export function logAbuse(path: string, ip: string, reason: 'scanner'): void {
  if (isRuntimeFreezeActive('logging')) return;
  if (!shouldLogAbuse(ip, Date.now())) return;

  prisma.accessLog
    .create({
      data: {
        action: ABUSE_ACTION,
        path,
        method: 'GET',
        ip,
        metadata: JSON.stringify({ reason }),
      },
    })
    .catch(() => {
      // Silenciar errores de logging para no afectar el request
    });
}

/**
 * Registra una accion de API (llamado desde API routes)
 * Fire-and-forget: no bloquea el request
 */
export function logAction(
  action: string,
  path: string,
  method: string,
  userId: string | null,
  metadata?: string
): void {
  if (isRuntimeFreezeActive('logging')) return;

  prisma.accessLog
    .create({
      data: {
        action,
        path,
        method,
        userId,
        metadata,
      },
    })
    .catch(() => {
      // Silenciar errores de logging
    });
}

/**
 * Registra eventos criticos (errores) aun cuando el freeze desactiva
 * logging normal. Uso intencionalmente acotado para no sumar carga.
 */
export function logCriticalAction(
  action: string,
  path: string,
  method: string,
  userId: string | null,
  metadata?: string
): void {
  prisma.accessLog
    .create({
      data: {
        action,
        path,
        method,
        userId,
        metadata,
      },
    })
    .catch(() => {
      // Silenciar errores criticos de logging para no afectar request
    });
}

interface LogFilters {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
  ip?: string;
  path?: string;
  from?: string;
  to?: string;
}

/**
 * Obtiene logs con filtros y paginacion (para la pagina admin)
 */
export async function getAccessLogs(filters: LogFilters) {
  const { page = 1, limit = 50, action, userId, ip, path, from, to } = filters;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (action) {
    where.action = action;
  }
  if (userId) {
    where.userId = userId;
  }
  if (ip) {
    where.ip = { contains: ip };
  }
  if (path) {
    where.path = { contains: path };
  }
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to + 'T23:59:59.999Z') } : {}),
    };
  }

  const [logs, total] = await Promise.all([
    prisma.accessLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.accessLog.count({ where }),
  ]);

  return { logs, total, page, limit };
}

/**
 * Retorna estadisticas agregadas de los logs y usuarios
 */
export async function getLogStats() {
  const [totalLogs, totalUsers, topEndpointsRaw, actionBreakdownRaw] =
    await Promise.all([
      prisma.accessLog.count(),
      prisma.user.count(),
      prisma.$queryRaw<{ path: string; count: bigint }[]>`
        SELECT path, COUNT(*) AS count
        FROM "AccessLog"
        GROUP BY path
        ORDER BY count DESC
        LIMIT 15
      `,
      prisma.$queryRaw<{ action: string; count: bigint }[]>`
        SELECT action, COUNT(*) AS count
        FROM "AccessLog"
        GROUP BY action
        ORDER BY count DESC
      `,
    ]);

  return {
    totalLogs,
    totalUsers,
    topEndpoints: topEndpointsRaw.map((r) => ({
      path: r.path,
      count: Number(r.count),
    })),
    actionBreakdown: actionBreakdownRaw.map((r) => ({
      action: r.action,
      count: Number(r.count),
    })),
  };
}

/**
 * Elimina logs mas viejos de X dias
 */
export async function cleanOldLogs(daysToKeep: number = 90): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);

  const result = await prisma.accessLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return result.count;
}

const PURGE_BATCH = 5000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Retencion automatica (la corre el cron diario): los intentos de ataque se
 * borran a los `ABUSE_RETENTION_DAYS` dias y todo lo demas a los
 * `LOG_RETENTION_DAYS`. `cleanOldLogs` queda para la limpieza a mano de
 * /admin/logs.
 *
 * Borra en tandas y corta al llegar a `deadline` (ms epoch): la primera vez
 * hay meses acumulados, y un solo DELETE podia pasarse del tiempo del cron.
 * Lo que no entra queda para la corrida siguiente.
 */
export async function purgeExpiredLogs(
  deadline: number,
  now: Date = new Date()
): Promise<{ deleted: number; done: boolean }> {
  const where = {
    OR: [
      {
        createdAt: {
          lt: new Date(now.getTime() - LOG_RETENTION_DAYS * DAY_MS),
        },
      },
      {
        action: ABUSE_ACTION,
        createdAt: {
          lt: new Date(now.getTime() - ABUSE_RETENTION_DAYS * DAY_MS),
        },
      },
    ],
  };

  let deleted = 0;
  while (Date.now() < deadline) {
    const rows = await prisma.accessLog.findMany({
      where,
      select: { id: true },
      take: PURGE_BATCH,
    });
    if (rows.length === 0) return { deleted, done: true };

    const { count } = await prisma.accessLog.deleteMany({
      where: { id: { in: rows.map((row) => row.id) } },
    });
    deleted += count;
    if (rows.length < PURGE_BATCH) return { deleted, done: true };
  }
  return { deleted, done: false };
}

/** La retencion de logs como trabajo del cron diario, con su registro. */
export function runLogRetentionJob(deadline: number) {
  return runCronJob(
    'logs',
    () => purgeExpiredLogs(deadline),
    (result) => ({
      trigger: 'schedule',
      deleted: result.deleted,
      budgetExhausted: !result.done,
    }),
    { trigger: 'schedule' }
  );
}

// Patrones para identificar logs de scanners ya existentes en la DB
const SCANNER_PATH_PATTERNS = [
  '.php',
  '/wp-',
  '/wordpress',
  '/.env',
  '/.git',
  '/cgi-bin',
  '/phpmyadmin',
  '/xmlrpc',
  '/adminer',
  '/phpinfo',
  '/shell',
  '/eval',
  '/exec',
  '/cmd',
  '/console',
  '/actuator',
  '/jenkins',
  '/solr',
  '/struts',
  '/backup',
  '/debug',
  '/myadmin',
  '/mysql',
  '/.aws',
  '/.docker',
  '/config.json',
  '/config.yml',
  '/config.yaml',
  '/config.xml',
  '/config.bak',
];

/**
 * Elimina visitas viejas generadas por scanners de vulnerabilidades (de antes
 * de que el proxy los cortara). Solo PAGE_VIEW: las filas ABUSE tienen esas
 * mismas rutas a proposito y se borran solas a los 7 dias.
 */
export async function cleanScannerLogs(): Promise<number> {
  const result = await prisma.accessLog.deleteMany({
    where: {
      action: 'PAGE_VIEW',
      OR: SCANNER_PATH_PATTERNS.map((pattern) => ({
        path: { contains: pattern },
      })),
    },
  });

  return result.count;
}
