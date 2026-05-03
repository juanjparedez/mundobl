import { prisma } from './database';

export interface NotificationInput {
  userId: string;
  type: string;
  title: string;
  body?: string;
  linkPath?: string;
  refType?: string;
  refId?: string | number;
}

/**
 * Crea una notificación in-app. Idempotente: si ya existe una con
 * (userId, type, refType, refId) NO LEÍDA, no crea otra duplicada.
 *
 * Esto evita que un mismo evento que se reprocesa varias veces (por
 * retries, jobs desfasados, etc.) genere ruido visual.
 */
export async function notifyUser(input: NotificationInput): Promise<void> {
  const refIdStr = input.refId !== undefined ? String(input.refId) : undefined;

  if (input.refType && refIdStr) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: input.userId,
        type: input.type,
        refType: input.refType,
        refId: refIdStr,
        readAt: null,
      },
      select: { id: true },
    });
    if (existing) return;
  }

  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      linkPath: input.linkPath ?? null,
      refType: input.refType ?? null,
      refId: refIdStr ?? null,
    },
  });
}
