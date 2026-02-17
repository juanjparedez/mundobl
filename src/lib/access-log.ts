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
  from?: string;
  to?: string;
}

/**
 * Obtiene logs con filtros y paginacion (para la pagina admin)
 */
export async function getAccessLogs(filters: LogFilters) {
  const { page = 1, limit = 50, action, userId, from, to } = filters;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (action) {
    where.action = action;
  }
  if (userId) {
    where.userId = userId;
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
