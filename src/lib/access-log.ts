import { prisma } from '@/lib/database';

/**
 * Registra un page view (llamado desde el proxy/middleware)
 * Fire-and-forget: no bloquea el request
 */
export function logPageView(
  path: string,
  ip: string | null,
  userAgent: string | null,
  userId: string | null
): void {
  prisma.accessLog
    .create({
      data: {
        action: 'PAGE_VIEW',
        path,
        method: 'GET',
        ip,
        userAgent,
        userId,
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
 * Elimina logs existentes generados por scanners de vulnerabilidades
 */
export async function cleanScannerLogs(): Promise<number> {
  const result = await prisma.accessLog.deleteMany({
    where: {
      OR: SCANNER_PATH_PATTERNS.map((pattern) => ({
        path: { contains: pattern },
      })),
    },
  });

  return result.count;
}
